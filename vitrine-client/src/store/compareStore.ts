import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@quelyos/types';
import { logger } from '@/lib/logger';

interface CompareState {
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: number) => void;
  clearAll: () => void;
  isInComparison: (productId: number) => boolean;
  canAddMore: () => boolean;
}

const MAX_PRODUCTS = 4; // Maximum 4 produits à comparer

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product: Product) => {
        const { products, canAddMore, isInComparison } = get();

        if (!canAddMore()) {
          logger.warn('Cannot add more than 4 products to comparison');
          return;
        }

        if (isInComparison(product.id)) {
          logger.warn('Product already in comparison');
          return;
        }

        set({ products: [...products, product] });
      },

      removeProduct: (productId: number) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
      },

      clearAll: () => {
        set({ products: [] });
      },

      isInComparison: (productId: number) => {
        return get().products.some((p) => p.id === productId);
      },

      canAddMore: () => {
        return get().products.length < MAX_PRODUCTS;
      },
    }),
    {
      name: 'quelyos-compare-storage',
    }
  )
);
