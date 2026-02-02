"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { logger } from '@quelyos/logger';

export interface TableDataOptions<T> {
  /** Fonction de fetch des données */
  fetchFn: () => Promise<T[]>;
  /** Dépendances pour le refetch */
  deps?: unknown[];
  /** Fonction de filtrage personnalisée */
  filterFn?: (item: T, query: string) => boolean;
  /** Fonction de tri personnalisée */
  sortFn?: (a: T, b: T, sortBy: string, sortDir: "asc" | "desc") => number;
  /** Activer le cache (30s par défaut) */
  enableCache?: boolean;
  /** Clé de cache (si enableCache = true) */
  cacheKey?: string;
}

export interface TableDataState<T> {
  data: T[];
  filteredData: T[];
  sortedData: T[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: string | null;
  sortDir: "asc" | "desc";
  refetch: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSort: (sortBy: string, sortDir?: "asc" | "desc") => void;
}

// Cache simple pour éviter les refetch
const tableCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 secondes

/**
 * Hook universel pour gérer les données tabulaires avec tri, filtrage et cache
 *
 * Élimine le besoin de gérer manuellement:
 * - États loading/error/data
 * - Logique de fetch/refetch
 * - Filtrage et recherche
 * - Tri des colonnes
 * - Cache des données
 *
 * @example
 * ```ts
 * const {
 *   sortedData,
 *   loading,
 *   searchQuery,
 *   setSearchQuery
 * } = useTableData({
 *   fetchFn: () => api('/transactions'),
 *   filterFn: (tx, query) => tx.description.includes(query),
 *   enableCache: true,
 *   cacheKey: 'transactions'
 * });
 * ```
 */
export function useTableData<T = unknown>(
  options: TableDataOptions<T>
): TableDataState<T> {
  const {
    fetchFn,
    deps = [],
    filterFn,
    sortFn,
    enableCache = false,
    cacheKey = "default",
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Fonction de fetch avec cache optionnel
  const fetch = useCallback(
    async (force = false) => {
      // Vérifier le cache si activé
      if (enableCache && !force && cacheKey) {
        const cached = tableCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data as T[]);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();
        setData(result);

        // Mettre en cache si activé
        if (enableCache && cacheKey) {
          tableCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
        }
      } catch (_err) {
        logger.error("[useTableData] Error:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, enableCache, cacheKey]
  );

  // Créer une clé stable pour les dépendances
  const depsKey = useMemo(() => JSON.stringify(deps), [deps]);

  // Fetch initial et refetch quand deps changent
  useEffect(() => {
    fetch();
  }, [fetch, depsKey]);

  // Données filtrées
  const filteredData = useMemo(() => {
    if (!searchQuery || !filterFn) return data;
    return data.filter((item) => filterFn(item, searchQuery));
  }, [data, searchQuery, filterFn]);

  // Données triées
  const sortedData = useMemo(() => {
    if (!sortBy || !sortFn) return filteredData;

    return [...filteredData].sort((a, b) => sortFn(a, b, sortBy, sortDir));
  }, [filteredData, sortBy, sortDir, sortFn]);

  // Fonction de changement de tri
  const setSort = useCallback(
    (newSortBy: string, newSortDir?: "asc" | "desc") => {
      if (newSortBy === sortBy) {
        // Toggle direction si même colonne
        setSortDir((prev) => (newSortDir !== undefined ? newSortDir : prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(newSortBy);
        setSortDir(newSortDir || "asc");
      }
    },
    [sortBy]
  );

  return {
    data,
    filteredData,
    sortedData,
    loading,
    error,
    searchQuery,
    sortBy,
    sortDir,
    refetch: () => fetch(true),
    setSearchQuery,
    setSort,
  };
}

/**
 * Invalider le cache d'une table spécifique
 */
export function invalidateTableCache(cacheKey: string) {
  tableCache.delete(cacheKey);
}

/**
 * Invalider tout le cache des tables
 */
export function invalidateAllTableCache() {
  tableCache.clear();
}
