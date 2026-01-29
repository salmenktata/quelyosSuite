import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendRpc } from '../lib/backend-rpc';

export interface Pricelist {
  id: number;
  name: string;
  currency_id: number;
  currency_name: string;
  currency_symbol: string;
  active: boolean;
  discount_policy: string;
}

export interface PricelistItem {
  id: number;
  applied_on: string;
  compute_price: string;
  fixed_price?: number;
  percent_price?: number;
  price_discount?: number;
  min_quantity: number;
  product_id?: number;
  product_name?: string;
  category_id?: number;
  category_name?: string;
}

export interface PricelistDetail extends Omit<Pricelist, 'discount_policy'> {
  items: PricelistItem[];
  item_count: number;
  discount_policy?: string;
}

interface PricelistsParams {
  active_only?: boolean;
}

export function usePricelists(params: PricelistsParams = {}) {
  return useQuery({
    queryKey: ['pricelists', params],
    queryFn: async () => {
      const response = await backendRpc<{ data: Pricelist[]; total: number }>('/api/ecommerce/pricelists', params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pricelists');
      }
      // L'API retourne { data: [...], total: X }, on retourne juste le tableau
      return response.data?.data || [];
    },
  });
}

export function usePricelistDetail(pricelistId: number) {
  return useQuery({
    queryKey: ['pricelist', pricelistId],
    queryFn: async () => {
      const response = await backendRpc(`/api/ecommerce/pricelists/${pricelistId}`, {});
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pricelist detail');
      }
      return response.data as PricelistDetail;
    },
    enabled: !!pricelistId,
  });
}

export function useAssignPricelistToCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, pricelistId }: { customerId: number; pricelistId: number }) => {
      const response = await backendRpc(`/api/ecommerce/customers/${customerId}/assign-pricelist`, {
        pricelist_id: pricelistId,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to assign pricelist');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export interface CreatePricelistParams {
  name: string;
  currency_id: number;
  discount_policy?: string;
  active?: boolean;
}

export function useCreatePricelist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePricelistParams) => {
      const response = await backendRpc('/api/ecommerce/pricelists/create', params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create pricelist');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricelists'] });
    },
  });
}

export interface UpdatePricelistParams {
  name?: string;
  currency_id?: number;
  discount_policy?: string;
  active?: boolean;
}

export function useUpdatePricelist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pricelistId, params }: { pricelistId: number; params: UpdatePricelistParams }) => {
      const response = await backendRpc(`/api/ecommerce/pricelists/${pricelistId}/update`, params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update pricelist');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricelists'] });
      queryClient.invalidateQueries({ queryKey: ['pricelist', variables.pricelistId] });
    },
  });
}

export interface CreatePricelistItemParams {
  applied_on: '3_global' | '2_product_category' | '1_product' | '0_product_variant';
  compute_price: 'fixed' | 'percentage' | 'formula';
  fixed_price?: number;
  percent_price?: number;
  price_discount?: number;
  min_quantity?: number;
  product_tmpl_id?: number;
  categ_id?: number;
  date_start?: string;
  date_end?: string;
}

export function useCreatePricelistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pricelistId, params }: { pricelistId: number; params: CreatePricelistItemParams }) => {
      const response = await backendRpc(`/api/ecommerce/pricelists/${pricelistId}/items/create`, params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create pricelist item');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricelist', variables.pricelistId] });
    },
  });
}

export function useDeletePricelist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pricelistId: number) => {
      const response = await backendRpc(`/api/ecommerce/pricelists/${pricelistId}/delete`, {});
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete pricelist');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricelists'] });
    },
  });
}

export interface UpdatePricelistItemParams {
  applied_on?: '3_global' | '2_product_category' | '1_product' | '0_product_variant';
  compute_price?: 'fixed' | 'percentage' | 'formula';
  fixed_price?: number;
  percent_price?: number;
  price_discount?: number;
  min_quantity?: number;
  product_tmpl_id?: number;
  categ_id?: number;
  date_start?: string;
  date_end?: string;
}

export function useUpdatePricelistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pricelistId,
      itemId,
      params,
    }: {
      pricelistId: number;
      itemId: number;
      params: UpdatePricelistItemParams;
    }) => {
      const response = await backendRpc(`/api/ecommerce/pricelists/${pricelistId}/items/${itemId}/update`, params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update pricelist item');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricelist', variables.pricelistId] });
    },
  });
}

export function useDeletePricelistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pricelistId, itemId }: { pricelistId: number; itemId: number }) => {
      const response = await backendRpc(`/api/ecommerce/pricelists/${pricelistId}/items/${itemId}/delete`, {});
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete pricelist item');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricelist', variables.pricelistId] });
    },
  });
}
