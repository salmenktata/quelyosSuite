import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PaymentProvider {
  id: number;
  code: 'stripe' | 'flouci' | 'konnect';
  name: string;
  state: 'disabled' | 'test' | 'enabled';
  imageUrl?: string;
  // Flouci fields
  appToken?: string;
  appSecret?: string;
  timeout?: number;
  acceptCards?: boolean;
  // Konnect fields
  apiKey?: string;
  walletId?: string;
  lifespan?: number;
  theme?: 'light' | 'dark';
}

export interface UpdatePaymentProviderData {
  provider_id: number;
  state?: 'disabled' | 'test' | 'enabled';
  name?: string;
  // Flouci
  flouci_app_token?: string;
  flouci_app_secret?: string;
  flouci_timeout?: number;
  flouci_accept_cards?: boolean;
  // Konnect
  konnect_api_key?: string;
  konnect_wallet_id?: string;
  konnect_lifespan?: number;
  konnect_theme?: 'light' | 'dark';
}

export function usePaymentProviders() {
  return useQuery({
    queryKey: ['payment-providers'],
    queryFn: async () => {
      const response = await api.post<{ success: boolean; error?: string; providers: PaymentProvider[] }>('/api/admin/payment/providers', {});
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch payment providers');
      }
      return response.data.providers;
    },
  });
}

export function useUpdatePaymentProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePaymentProviderData) => {
      const response = await api.post<{ success: boolean; error?: string; provider: PaymentProvider }>('/api/admin/payment/provider/update', data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update payment provider');
      }
      return response.data.provider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
    },
  });
}

export function useTestPaymentProvider() {
  return useMutation({
    mutationFn: async (providerId: number) => {
      const response = await api.post<{ success: boolean; error?: string; message?: string }>('/api/admin/payment/provider/test', {
        provider_id: providerId,
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Connection test failed');
      }
      return response.data;
    },
  });
}
