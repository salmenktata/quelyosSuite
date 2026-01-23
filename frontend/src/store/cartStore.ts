/**
 * Store Zustand pour la gestion du panier
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { odooClient } from '@/lib/odoo/client';
import type { Cart, CartLine } from '@/types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (lineId: number, quantity: number) => Promise<boolean>;
  removeItem: (lineId: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
  getCartCount: () => number;
  clearError: () => void;
}

const emptyCart: Cart = {
  id: null,
  lines: [],
  amount_untaxed: 0,
  amount_tax: 0,
  amount_total: 0,
  currency: { id: 0, name: '', symbol: '€' },
  line_count: 0,
  item_count: 0,
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: emptyCart,
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await odooClient.getCart();

          if (response.success) {
            set({
              cart: response.cart || emptyCart,
              isLoading: false,
            });
          } else {
            set({
              error: response.error || 'Échec de récupération du panier',
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error('Fetch cart error:', error);
          set({
            error: error.message || 'Erreur lors de la récupération du panier',
            isLoading: false,
          });
        }
      },

      addToCart: async (productId: number, quantity = 1) => {
        set({ isLoading: true, error: null });

        try {
          const response = await odooClient.addToCart(productId, quantity);

          if (response.success && response.cart) {
            set({
              cart: response.cart,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: response.error || 'Échec d\'ajout au panier',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error('Add to cart error:', error);
          set({
            error: error.message || 'Erreur lors de l\'ajout au panier',
            isLoading: false,
          });
          return false;
        }
      },

      updateQuantity: async (lineId: number, quantity: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await odooClient.updateCartLine(lineId, quantity);

          if (response.success && response.cart) {
            set({
              cart: response.cart,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: response.error || 'Échec de mise à jour',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error('Update quantity error:', error);
          set({
            error: error.message || 'Erreur lors de la mise à jour',
            isLoading: false,
          });
          return false;
        }
      },

      removeItem: async (lineId: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await odooClient.removeCartLine(lineId);

          if (response.success && response.cart) {
            set({
              cart: response.cart,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: response.error || 'Échec de suppression',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          console.error('Remove item error:', error);
          set({
            error: error.message || 'Erreur lors de la suppression',
            isLoading: false,
          });
          return false;
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await odooClient.clearCart();

          if (response.success) {
            set({
              cart: emptyCart,
              isLoading: false,
            });
          } else {
            set({
              error: response.error || 'Échec de vidage du panier',
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error('Clear cart error:', error);
          set({
            error: error.message || 'Erreur lors du vidage du panier',
            isLoading: false,
          });
        }
      },

      getCartCount: () => {
        const cart = get().cart;
        return cart ? cart.item_count : 0;
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'cart-storage',
      // Ne persister que le panier
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);
