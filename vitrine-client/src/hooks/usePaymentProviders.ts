'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { backendClient } from '@/lib/backend/client';

export interface PaymentProvider {
  id: number;
  code: 'stripe' | 'flouci' | 'konnect';
  name: string;
  state: 'disabled' | 'test' | 'enabled';
  imageUrl?: string;
}

export interface InitPaymentData {
  provider_id: number;
  amount: number;
  currency_code: string;
  order_reference: string;
  customer_data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  return_url: string;
}

export interface InitPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionRef?: string;
  transactionId?: number;
  error?: string;
}

/**
 * Hook to fetch active payment providers for checkout
 */
export function useActivePaymentProviders() {
  return useQuery({
    queryKey: ['active-payment-providers'],
    queryFn: async () => {
      const response = await backendClient.getPaymentProviders();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch payment providers');
      }

      return response.providers as unknown as PaymentProvider[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to initialize payment with selected provider
 */
export function useInitPayment() {
  return useMutation({
    mutationFn: async (data: InitPaymentData): Promise<InitPaymentResponse> => {
      const response = await backendClient.initPayment(data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to initialize payment');
      }

      return response;
    },
  });
}
