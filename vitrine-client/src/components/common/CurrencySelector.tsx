'use client';

import { useState } from 'react';
import { useCurrencies, type Currency } from '@/hooks/useCurrencies';
import { useCurrencyStore } from '@/store/currencyStore';

export function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const { data: currencies, isLoading } = useCurrencies(true);

  const handleCurrencyChange = (currency: { code: string; symbol: string; name: string }) => {
    setSelectedCurrency(currency);
    setIsOpen(false);
  };

  if (isLoading || !currencies || currencies.length <= 1) {
    // Ne pas afficher le sélecteur s&apos;il n'y a qu&apos;une seule devise
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Sélectionner la devise"
      >
        <span className="font-semibold">{selectedCurrency.symbol}</span>
        <span className="hidden sm:inline">{selectedCurrency.code}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer au clic */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                Sélectionner la devise
              </p>
              <div className="space-y-1">
                {currencies.map((currency: Currency) => (
                  <button
                    key={currency.id}
                    onClick={() =>
                      handleCurrencyChange({
                        code: currency.name,
                        symbol: currency.symbol,
                        name: currency.full_name,
                      })
                    }
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCurrency.code === currency.name
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {currency.symbol} {currency.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {currency.full_name}
                        </div>
                      </div>
                      {selectedCurrency.code === currency.name && (
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
