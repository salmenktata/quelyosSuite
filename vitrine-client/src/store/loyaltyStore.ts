import { create } from 'zustand';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface LoyaltyTier {
  id: number;
  name: string;
  points_threshold: number;
  discount_percentage: number;
  color: string;
}

interface LoyaltyTransaction {
  id: number;
  points: number;
  description: string;
  type: string;
  date: string;
  order_id?: number;
  order_name?: string;
}

interface LoyaltyProgram {
  points_per_euro: number;
  points_to_euro_rate: number;
  min_order_amount: number;
}

interface LoyaltyBalance {
  balance: number;
  lifetime_points: number;
  tier: LoyaltyTier | null;
  next_tier: {
    id: number;
    name: string;
    points_threshold: number;
    points_needed: number;
  } | null;
  transactions: LoyaltyTransaction[];
  program: LoyaltyProgram | null;
}

interface LoyaltyStore {
  balance: LoyaltyBalance | null;
  tiers: LoyaltyTier[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTiers: () => Promise<void>;
  redeemPoints: (points: number, orderId?: number) => Promise<{ success: boolean; discount_amount?: number; new_balance?: number; message?: string; error?: string }>;
  calculatePoints: (amount: number) => Promise<{ points: number; program_active: boolean }>;
  clearError: () => void;
}

export const useLoyaltyStore = create<LoyaltyStore>((set, get) => ({
  balance: null,
  tiers: [],
  loading: false,
  error: null,

  fetchBalance: async () => {
    try {
      set({ loading: true, error: null });

      const response = await backendClient.getLoyaltyBalance();

      if (response.success && response.data) {
        set({ balance: response.data as unknown as LoyaltyBalance, loading: false });
      } else {
        set({ error: response.message || 'Failed to fetch loyalty balance', loading: false });
      }
    } catch (error: unknown) {
      logger.error('Error fetching loyalty balance:', _error);
      set({
        error: _error instanceof Error ? _error.message : 'An error occurred while fetching loyalty balance',
        loading: false
      });
    }
  },

  fetchTiers: async () => {
    try {
      const response = await backendClient.getLoyaltyTiers();

      if (response.success && response.data) {
        set({ tiers: response.data.tiers as unknown as LoyaltyTier[] });
      }
    } catch (error: unknown) {
      logger.error('Error fetching loyalty tiers:', _error);
    }
  },

  redeemPoints: async (points: number, orderId?: number) => {
    try {
      set({ loading: true, error: null });

      const response = await backendClient.redeemLoyaltyPoints(points, orderId);

      if (response.success && response.data) {
        // Refresh balance after redemption
        await get().fetchBalance();

        set({ loading: false });

        return {
          success: true,
          discount_amount: response.data.discount_amount,
          new_balance: response.data.new_balance,
          message: response.data.message,
        };
      } else {
        set({
          error: response.message || 'Failed to redeem points',
          loading: false
        });

        return {
          success: false,
          error: response.message || 'Failed to redeem points',
        };
      }
    } catch (error: unknown) {
      logger.error('Error redeeming points:', _error);
      set({
        error: _error instanceof Error ? _error.message : 'An error occurred while redeeming points',
        loading: false
      });

      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'An error occurred while redeeming points',
      };
    }
  },

  calculatePoints: async (amount: number) => {
    try {
      const response = await backendClient.calculateLoyaltyPoints(amount);

      if (response.success && response.data) {
        return {
          points: response.data.points,
          program_active: response.data.program_active,
        };
      }

      return { points: 0, program_active: false };
    } catch (error: unknown) {
      logger.error('Error calculating points:', _error);
      return { points: 0, program_active: false };
    }
  },

  clearError: () => set({ error: null }),
}));
