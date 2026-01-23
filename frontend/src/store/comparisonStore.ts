import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  id: number;
  name: string;
  slug: string;
  list_price: number;
  image_url?: string;
}

interface ComparisonState {
  products: Product[];
  maxProducts: number;

  // Actions
  addProduct: (product: Product) => boolean;
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

      addProduct: (product: Product) => {
        const { products, maxProducts, isInComparison } = get();
        
        if (isInComparison(product.id)) {
          return false;
        }

        if (products.length >= maxProducts) {
          alert(\`Vous ne pouvez comparer que \${maxProducts} produits maximum\`);
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
