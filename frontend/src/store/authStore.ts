/**
 * Store Zustand pour la gestion de l'authentification
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { odooClient } from '@/lib/odoo/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<boolean>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await odooClient.login(email, password);

          if (response.success && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              error: response.error || 'Échec de connexion',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de la connexion',
            isLoading: false,
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await odooClient.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          // Forcer la déconnexion même en cas d'erreur
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await odooClient.register(data);

          if (response.success && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              error: response.error || 'Échec de l\'inscription',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de l\'inscription',
            isLoading: false,
          });
          return false;
        }
      },

      checkSession: async () => {
        set({ isLoading: true });

        try {
          const response = await odooClient.checkSession();

          if (response.authenticated && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Session check error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      // Ne persister que les données essentielles
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
