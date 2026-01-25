import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencyStore {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
}

const DEFAULT_CURRENCY: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'United States dollar',
};

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      selectedCurrency: DEFAULT_CURRENCY,
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
    }),
    {
      name: 'currency-storage',
    }
  )
);

/**
 * Helper pour formater un montant avec la devise sélectionnée
 */
export function formatPrice(amount: number, currency?: Currency): string {
  const curr = currency || useCurrencyStore.getState().selectedCurrency;

  if (curr.code === 'before') {
    return `${curr.symbol}${amount.toFixed(2)}`;
  } else {
    return `${amount.toFixed(2)} ${curr.symbol}`;
  }
}
