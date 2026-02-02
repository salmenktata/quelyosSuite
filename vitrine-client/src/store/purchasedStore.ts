import { create } from 'zustand';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface PurchasedState {
  productIds: Set<number>;
  isLoaded: boolean;
  isLoading: boolean;

  fetchPurchasedProducts: () => Promise<void>;
  hasPurchased: (productId: number) => boolean;
  clear: () => void;
}

export const usePurchasedStore = create<PurchasedState>()((set, get) => ({
  productIds: new Set(),
  isLoaded: false,
  isLoading: false,

  fetchPurchasedProducts: async () => {
    if (get().isLoaded || get().isLoading) return;

    set({ isLoading: true });
    try {
      const response = await backendClient.getUserPurchasedProducts();
      if (response.success && response.data) {
        set({
          productIds: new Set(response.data.product_ids),
          isLoaded: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (_error) {
      logger.error('Error fetching purchased products:', error);
      set({ isLoading: false });
    }
  },

  hasPurchased: (productId: number) => {
    return get().productIds.has(productId);
  },

  clear: () => {
    set({ productIds: new Set(), isLoaded: false });
  },
}));
