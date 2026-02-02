import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart } from '@quelyos/types';
import { backendClient } from '@/lib/backend/client';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (lineId: number, quantity: number) => Promise<boolean>;
  removeItem: (lineId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => Promise<boolean>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, _get) => ({
      cart: null,
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.getCart();
          if (response.success && response.cart) {
            set({ cart: response.cart, isLoading: false });
          } else {
            set({ error: response.error || 'Failed to fetch cart', isLoading: false });
          }
        } catch (error: unknown) {
          set({ error: _error instanceof Error ? _error.message : "Error", isLoading: false });
        }
      },

      addToCart: async (productId: number, quantity: number = 1) => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.addToCart(productId, quantity);
          if (response.success && response.cart) {
            set({ cart: response.cart, isLoading: false });
            return true;
          } else {
            set({ error: response.error || 'Failed to add to cart', isLoading: false });
            return false;
          }
        } catch (error: unknown) {
          set({ error: _error instanceof Error ? _error.message : "Error", isLoading: false });
          return false;
        }
      },

      updateQuantity: async (lineId: number, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.updateCartLine(lineId, quantity);
          if (response.success && response.cart) {
            set({ cart: response.cart, isLoading: false });
            return true;
          } else {
            set({ error: response.error || 'Failed to update quantity', isLoading: false });
            return false;
          }
        } catch (error: unknown) {
          set({ error: _error instanceof Error ? _error.message : "Error", isLoading: false });
          return false;
        }
      },

      removeItem: async (lineId: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.removeCartLine(lineId);
          if (response.success && response.cart) {
            set({ cart: response.cart, isLoading: false });
            return true;
          } else {
            set({ error: response.error || 'Failed to remove item', isLoading: false });
            return false;
          }
        } catch (error: unknown) {
          set({ error: _error instanceof Error ? _error.message : "Error", isLoading: false });
          return false;
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.clearCart();
          if (response.success) {
            set({ cart: null, isLoading: false });
            return true;
          } else {
            set({ error: response.error || 'Failed to clear cart', isLoading: false });
            return false;
          }
        } catch (error: unknown) {
          set({ error: _error instanceof Error ? _error.message : "Error", isLoading: false });
          return false;
        }
      },

      applyCoupon: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.validateCoupon(code);
          if (response.success && response.cart) {
            set({ cart: response.cart, isLoading: false });
            return { success: true, message: response.message };
          } else {
            set({ error: response.error || 'Failed to apply coupon', isLoading: false });
            return { success: false, message: response.error };
          }
        } catch (error: unknown) {
          const errorMessage = _error instanceof Error ? _error.message : "Error";
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      },

      removeCoupon: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.removeCoupon();
          if (response.success && response.cart) {
            set({ cart: response.cart, isLoading: false });
            return true;
          } else {
            set({ error: response.error || 'Failed to remove coupon', isLoading: false });
            return false;
          }
        } catch (error: unknown) {
          set({ error: _error instanceof Error ? _error.message : "Error", isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'quelyos-cart-storage',
      partialize: (state) => ({ cart: state.cart }), // Persist seulement le cart, pas isLoading/error
    }
  )
);
