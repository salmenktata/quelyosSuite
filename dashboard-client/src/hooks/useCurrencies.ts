import { useQuery } from '@tanstack/react-query';
import { odooRpc } from '../lib/odoo-rpc';

export interface Currency {
  id: number;
  name: string;
  symbol: string;
  active: boolean;
  position: 'before' | 'after';
}

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const response = await odooRpc<{ data: Currency[]; total: number }>('/api/ecommerce/currencies', {});
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch currencies');
      }
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 60, // Cache 1h (devises changent rarement)
  });
}
