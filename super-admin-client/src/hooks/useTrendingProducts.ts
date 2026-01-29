import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TrendingProduct {
  id: number;
  name: string;
  image_url: string | null;
  price: number;
  is_trending: boolean;
  trending_score: number;
  social_mentions: number;
  is_bestseller?: boolean;
  is_featured?: boolean;
}

interface TrendingProductsResponse {
  success: boolean;
  products: TrendingProduct[];
  total: number;
  error?: string;
}

interface TrendingProductsParams {
  limit?: number;
  offset?: number;
  trending_only?: boolean;
  search?: string;
}

export function useTrendingProducts(params: TrendingProductsParams = {}) {
  return useQuery({
    queryKey: ['trending-products', params],
    queryFn: async () => {
      const response = await api.post<TrendingProductsResponse>(
        '/api/admin/trending-products',
        params
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la récupération');
      }
      return response.data;
    },
  });
}

export function useToggleTrending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.post<{ success: boolean; is_trending: boolean; error?: string }>(
        `/api/admin/trending-products/${productId}/toggle`,
        {}
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-products'] });
    },
  });
}

export function useUpdateTrendingData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: number;
      data: {
        is_trending?: boolean;
        trending_score?: number;
        social_mentions?: number;
      };
    }) => {
      const response = await api.post<{ success: boolean; product: TrendingProduct; error?: string }>(
        `/api/admin/trending-products/${productId}/update`,
        data
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-products'] });
    },
  });
}
