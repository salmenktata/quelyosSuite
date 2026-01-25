"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "./api";

const SETTINGS_KEY = "qyl_settings";
const DEFAULT_CURRENCY = "EUR";

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export type ExchangeRates = {
  [currencyCode: string]: number;
};

type CurrencyContextType = {
  currency: string;
  setCurrency: (currency: string) => void;
  isHydrated: boolean;
  availableCurrencies: Currency[];
  isLoading: boolean;
  baseCurrency: string; // Company's base currency
  exchangeRates: ExchangeRates | null;
  convertAmount: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  formatAmount: (amount: number, fromCurrency?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  isHydrated: false,
  availableCurrencies: [],
  isLoading: false,
  baseCurrency: DEFAULT_CURRENCY,
  exchangeRates: null,
  convertAmount: (amount) => amount,
  formatAmount: (amount) => amount.toString(),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_CURRENCY);
  const [isHydrated, setIsHydrated] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);

  // Fetch user's currency preference from backend
  const fetchUserCurrency = useCallback(async () => {
    try {
      const data = await api<{
        displayCurrency: string;
        baseCurrency: string;
        isCustom: boolean;
      }>("/currencies/user/currency-preference");

      setCurrencyState(data.displayCurrency);
      setBaseCurrency(data.baseCurrency);

      // Also save to localStorage for offline access
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const settings = raw ? JSON.parse(raw) : {};
        settings.currency = data.displayCurrency;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (err) {
        console.error("Erreur lors de la sauvegarde locale", err);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de la devise utilisateur", err);
      // Fallback to localStorage if API fails
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const savedCurrency = parsed.currency ?? DEFAULT_CURRENCY;
          setCurrencyState(savedCurrency);
        }
      } catch (e) {
        console.error("Erreur localStorage fallback", e);
      }
    }
  }, []);

  // Fetch available currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      const data = await api<{
        currencies: Currency[];
        defaultCurrency: string;
      }>("/currencies");

      setAvailableCurrencies(data.currencies);
    } catch (err) {
      console.error("Erreur lors de la récupération des devises", err);
      // Fallback to a basic list
      setAvailableCurrencies([
        { code: "EUR", symbol: "€", name: "Euro" },
        { code: "USD", symbol: "$", name: "US Dollar" },
        { code: "GBP", symbol: "£", name: "British Pound" },
      ]);
    }
  }, []);

  // Fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    try {
      const data = await api<{
        baseCurrency: string;
        rates: ExchangeRates;
      }>("/currencies/exchange-rates");

      setExchangeRates(data.rates);
    } catch (err) {
      console.error("Erreur lors de la récupération des taux de change", err);
      // Set default rate of 1:1 as fallback
      setExchangeRates({});
    }
  }, []);

  // Hydrate from backend after mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUserCurrency(),
        fetchCurrencies(),
        fetchExchangeRates(),
      ]);
      setIsLoading(false);
      setIsHydrated(true);
    };

    init();
  }, [fetchUserCurrency, fetchCurrencies, fetchExchangeRates]);

  const setCurrency = useCallback(async (newCurrency: string) => {
    if (!newCurrency || typeof newCurrency !== "string") {
      console.warn("Devise invalide:", newCurrency);
      return;
    }

    // Optimistic update
    setCurrencyState(newCurrency);

    // Save to localStorage immediately
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const settings = raw ? JSON.parse(raw) : {};
      settings.currency = newCurrency;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error("Erreur lors de la sauvegarde locale", err);
    }

    // Sync with backend
    try {
      // Pass object directly - api-client will handle stringification
      await api("/currencies/user/currency-preference", {
        method: "PUT",
        body: { currency: newCurrency } as { currency: string },
      });
    } catch (err) {
      console.error("Erreur lors de la sauvegarde backend de la devise", err);
      // Revert on error
      await fetchUserCurrency();
    }
  }, [fetchUserCurrency]);

  // Convert amount between currencies
  const convertAmount = useCallback((
    amount: number,
    fromCurrency?: string,
    toCurrency?: string
  ): number => {
    const from = fromCurrency || baseCurrency;
    const to = toCurrency || currency;

    // If same currency, no conversion needed
    if (from === to) return amount;

    // If no rates available, return original amount
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
      return amount;
    }

    // Get the rate from baseCurrency to target currency
    const rate = exchangeRates[to];

    if (!rate) {
      console.warn(`Taux de change non disponible pour ${from} → ${to}`);
      return amount;
    }

    // If from currency is not base currency, we need to convert via base
    if (from !== baseCurrency) {
      const fromRate = exchangeRates[from];
      if (!fromRate) {
        console.warn(`Taux de change non disponible pour ${from}`);
        return amount;
      }
      // Convert from source to base, then base to target
      return (amount / fromRate) * rate;
    }

    // Direct conversion from base currency
    return amount * rate;
  }, [baseCurrency, currency, exchangeRates]);

  // Format amount with currency symbol (with optional conversion)
  const formatAmount = useCallback((
    amount: number,
    fromCurrency?: string
  ): string => {
    const convertedAmount = fromCurrency
      ? convertAmount(amount, fromCurrency, currency)
      : amount;

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(convertedAmount);
  }, [currency, convertAmount]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      isHydrated,
      availableCurrencies,
      isLoading,
      baseCurrency,
      exchangeRates,
      convertAmount,
      formatAmount,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency doit être utilisé dans un CurrencyProvider");
  }
  return context;
}
