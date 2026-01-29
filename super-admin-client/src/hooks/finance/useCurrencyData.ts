import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export type ExchangeRates = {
  [currencyCode: string]: number;
};

/**
 * Hook to fetch user's currency preference with React Query
 * Deduplicated automatically across all components
 */
export function useUserCurrencyPreference() {
  return useQuery({
    queryKey: ["currency", "user-preference"],
    queryFn: () =>
      api.request<{
        displayCurrency: string;
        baseCurrency: string;
        isCustom: boolean;
      }>("/currencies/user/currency-preference"),
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch available currencies with React Query
 * Deduplicated automatically across all components
 */
export function useAvailableCurrencies() {
  return useQuery({
    queryKey: ["currency", "available"],
    queryFn: () =>
      api.request<{
        currencies: Currency[];
        defaultCurrency: string;
      }>("/currencies"),
    staleTime: 60 * 60 * 1000, // 1 hour - very rarely changes
    gcTime: 120 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch exchange rates with React Query
 * Deduplicated automatically across all components
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: ["currency", "exchange-rates"],
    queryFn: () =>
      api.request<{
        baseCurrency: string;
        rates: ExchangeRates;
      }>("/currencies/exchange-rates"),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
