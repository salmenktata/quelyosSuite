"use client";

import { useState, useEffect } from "react";

/**
 * Hook pour debouncer une valeur
 * Réduit les re-renders lors de la saisie utilisateur
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour debouncer une fonction callback
 * Utile pour les actions comme la sauvegarde auto ou les appels API
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);

    const id = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(id);
  };
}
