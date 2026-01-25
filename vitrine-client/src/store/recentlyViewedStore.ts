/**
 * recentlyViewedStore - Store pour produits récemment consultés
 * Persiste dans localStorage, garde les 10 derniers produits
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentProduct {
  id: number;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  viewed_at: number; // timestamp
}

interface RecentlyViewedState {
  products: RecentProduct[];
  addProduct: (product: Omit<RecentProduct, 'viewed_at'>) => void;
  clearOld: () => void;
  clear: () => void;
}

const MAX_PRODUCTS = 10;
const MAX_AGE_DAYS = 7;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        set((state) => {
          // Retirer le produit s'il existe déjà
          const filtered = state.products.filter((p) => p.id !== product.id);

          // Ajouter en premier
          const newProducts = [
            { ...product, viewed_at: Date.now() },
            ...filtered,
          ].slice(0, MAX_PRODUCTS);

          return { products: newProducts };
        });
      },

      // Nettoyer les produits trop anciens (> 7 jours)
      clearOld: () => {
        const now = Date.now();
        const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

        set((state) => ({
          products: state.products.filter(
            (p) => now - p.viewed_at < maxAge
          ),
        }));
      },

      clear: () => set({ products: [] }),
    }),
    {
      name: 'quelyos-recently-viewed',
      version: 1,
    }
  )
);

export default useRecentlyViewedStore;
