"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

type CacheEntry<T> = {
  data: T | null;
  timestamp: number;
  loading: boolean;
  error: string | null;
};

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 30000; // 30 secondes

/**
 * Hook pour gérer un cache global des appels API
 * Réduit drastiquement les appels API répétés entre pages
 */
export function useGlobalCache<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<CacheEntry<T>>(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached as CacheEntry<T>;
    }
    return { data: null, timestamp: 0, loading: true, error: null };
  });

  const fetch = useCallback(async (force = false) => {
    const cached = cache.get(key);
    const now = Date.now();

    // Utiliser le cache si valide et pas de force refresh
    if (!force && cached && cached.data && now - cached.timestamp < CACHE_DURATION) {
      setState(cached as CacheEntry<T>);
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const data = await fetcher();
      const newEntry: CacheEntry<T> = {
        data,
        timestamp: now,
        loading: false,
        error: null,
      };

      cache.set(key, newEntry);
      setState(newEntry);
    } catch (err) {
      const errorEntry: CacheEntry<T> = {
        data: null,
        timestamp: now,
        loading: false,
        error: err instanceof Error ? err.message : "Erreur de chargement",
      };

      cache.set(key, errorEntry);
      setState(errorEntry);
    }
  }, [key, fetcher]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: () => fetch(true),
  };
}

/**
 * Invalider une entrée du cache
 */
export function invalidateCache(key: string) {
  cache.delete(key);
}

/**
 * Invalider tout le cache
 */
export function invalidateAllCache() {
  cache.clear();
}

/**
 * Hook pré-configuré pour les comptes
 */
export function useAccounts() {
  return useGlobalCache("accounts", () => api("/company/accounts"));
}

/**
 * Hook pré-configuré pour les portefeuilles
 */
export function usePortfolios() {
  return useGlobalCache("portfolios", () => api("/company/portfolios"));
}

/**
 * Hook pré-configuré pour les catégories
 */
export function useCategories() {
  return useGlobalCache("categories", () => api("/company/categories"));
}
