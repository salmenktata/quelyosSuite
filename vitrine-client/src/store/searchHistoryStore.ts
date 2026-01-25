/**
 * searchHistoryStore - Store pour l'historique des recherches
 * Persiste dans localStorage, garde les 10 dernières recherches
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

interface SearchHistoryState {
  searches: SearchHistoryItem[];
  addSearch: (query: string, resultCount?: number) => void;
  removeSearch: (query: string) => void;
  clearHistory: () => void;
  getRecentSearches: (limit?: number) => SearchHistoryItem[];
}

const MAX_SEARCHES = 10;
const MAX_AGE_DAYS = 30;

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      searches: [],

      addSearch: (query, resultCount) => {
        const normalized = query.trim();
        if (normalized.length < 2) return;

        set((state) => {
          // Retirer la recherche si elle existe déjà (case-insensitive)
          const filtered = state.searches.filter(
            (s) => s.query.toLowerCase() !== normalized.toLowerCase()
          );

          // Ajouter en premier avec timestamp
          const newSearches = [
            { query: normalized, timestamp: Date.now(), resultCount },
            ...filtered,
          ].slice(0, MAX_SEARCHES);

          return { searches: newSearches };
        });
      },

      removeSearch: (query) => {
        set((state) => ({
          searches: state.searches.filter(
            (s) => s.query.toLowerCase() !== query.toLowerCase()
          ),
        }));
      },

      clearHistory: () => set({ searches: [] }),

      getRecentSearches: (limit = 5) => {
        const now = Date.now();
        const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

        // Filtrer les recherches trop anciennes
        return get()
          .searches.filter((s) => now - s.timestamp < maxAge)
          .slice(0, limit);
      },
    }),
    {
      name: 'quelyos-search-history',
      version: 1,
    }
  )
);

export default useSearchHistoryStore;
