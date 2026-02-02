"use client";

import { useState, useEffect } from "react";

/**
 * Hook pour debouncer une valeur
 * Réduit les re-renders lors de la saisie utilisateur
 *
 * @param value - Valeur à debouncer
 * @param delay - Délai en ms (par défaut 300ms)
 * @returns Valeur debouncée
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * // Utiliser debouncedSearch pour le filtrage
 * const filtered = data.filter(item =>
 *   item.name.includes(debouncedSearch)
 * );
 * ```
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
 *
 * @param callback - Fonction à debouncer
 * @param delay - Délai en ms (par défaut 300ms)
 * @param deps - Dépendances du callback
 * @returns Fonction debouncée
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback(
 *   async (text) => {
 *     await api.post('/save', { text });
 *   },
 *   500,
 *   [api]
 * );
 *
 * <input onChange={(e) => debouncedSave(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300,
  _deps: unknown[] = []
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
