import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { odooClient } from '@/lib/odoo/client';

interface WishlistState {
  items: number[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: number) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<boolean>;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchWishlist: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await odooClient.getWishlist();
          if (response.success && response.products) {
            set({ 
              items: response.products.map((p: any) => p.id),
              isLoading: false 
            });
          } else {
            set({ error: response.error || 'Failed to fetch wishlist', isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      addToWishlist: async (productId: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await odooClient.addToWishlist(productId);
          if (response.success) {
            set((state) => ({
              items: [...state.items, productId],
              isLoading: false,
            }));
            return true;
          } else {
            set({ error: response.error || 'Failed to add to wishlist', isLoading: false });
            return false;
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      removeFromWishlist: async (productId: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await odooClient.removeFromWishlist(productId);
          if (response.success) {
            set((state) => ({
              items: state.items.filter((id) => id !== productId),
              isLoading: false,
            }));
            return true;
          } else {
            set({ error: response.error || 'Failed to remove from wishlist', isLoading: false });
            return false;
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      isInWishlist: (productId: number) => {
        return get().items.includes(productId);
      },

      clearWishlist: () => {
        set({ items: [], error: null });
      },
    }),
    {
      name: 'quelyos-wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
