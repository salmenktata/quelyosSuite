import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useFeaturedProducts(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['featured-products', params],
    queryFn: () => api.getFeaturedProducts(params),
  })
}

export function useAvailableProducts(params?: { limit?: number; offset?: number; search?: string }) {
  return useQuery({
    queryKey: ['available-products', params],
    queryFn: () => api.getAvailableProductsForFeatured(params),
  })
}

export function useAddFeaturedProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: number) => api.addFeaturedProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-products'] })
      queryClient.invalidateQueries({ queryKey: ['available-products'] })
    },
  })
}

export function useRemoveFeaturedProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: number) => api.removeFeaturedProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-products'] })
      queryClient.invalidateQueries({ queryKey: ['available-products'] })
    },
  })
}

export function useReorderFeaturedProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productIds: number[]) => api.reorderFeaturedProducts(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-products'] })
    },
  })
}
