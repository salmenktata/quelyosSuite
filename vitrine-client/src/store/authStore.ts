import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@quelyos/types';
import { backendClient } from '@/lib/backend/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<boolean>;
  checkSession: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
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
          const response = await backendClient.login(email, password);
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
              error: response.error || 'Login failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error: unknown) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await backendClient.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (_error: unknown) {
          // Même en cas d'erreur, on déconnecte localement
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      register: async (data: { name: string; email: string; password: string; phone?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.register(data);
          if (response.success) {
            // Auto-login après inscription
            const loginSuccess = await get().login(data.email, data.password);
            return loginSuccess;
          } else {
            set({
              error: response.error || 'Registration failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error: unknown) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          return false;
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const response = await backendClient.getSession();
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
        } catch (_error: unknown) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await backendClient.updateProfile(data);
          if (response.success) {
            // Rafraîchir le profil
            const profileResponse = await backendClient.getProfile();
            if (profileResponse.success && profileResponse.profile) {
              set({
                user: profileResponse.profile,
                isLoading: false,
              });
              return true;
            }
          }
          set({
            error: response.error || 'Profile update failed',
            isLoading: false,
          });
          return false;
        } catch (error: unknown) {
          set({
            error: error instanceof Error ? error.message : 'Profile update failed',
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: 'quelyos-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
