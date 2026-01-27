import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './toastStore';

// Type simplifié pour la comparaison (ne nécessite que les champs essentiels)
export interface ComparisonProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url?: string;
  images?: { id: string | number; url: string; alt: string }[];
  currency?: { id: number; name: string; symbol: string };
  // Autres champs optionnels peuvent être ajoutés si nécessaire
  category?: { id: number; name: string } | null;
  in_stock?: boolean;
  avg_rating?: number;
  review_count?: number;
  description?: string;
  compare_at_price?: number;
}

interface ComparisonState {
  products: ComparisonProduct[];
  maxProducts: number;

  // Actions
  addProduct: (product: ComparisonProduct) => boolean;
  removeProduct: (productId: number) => void;
  clearComparison: () => void;
  isInComparison: (productId: number) => boolean;
  canAdd: () => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      products: [],
      maxProducts: 4,

      addProduct: (product: ComparisonProduct) => {
        const { products, maxProducts, isInComparison } = get();

        if (isInComparison(product.id)) {
          return false;
        }

        if (products.length >= maxProducts) {
          useToastStore.getState().addToast('warning', `Vous ne pouvez comparer que ${maxProducts} produits maximum`, 4000);
          return false;
        }

        set({ products: [...products, product] });
        return true;
      },

      removeProduct: (productId: number) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
      },

      clearComparison: () => {
        set({ products: [] });
      },

      isInComparison: (productId: number) => {
        return get().products.some((p) => p.id === productId);
      },

      canAdd: () => {
        return get().products.length < get().maxProducts;
      },
    }),
    {
      name: 'quelyos-comparison-storage',
    }
  )
);
