import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useProductImages(productId: number | undefined) {
  return useQuery({
    queryKey: ['productImages', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.getProductImages(productId)
      if (!response.data.success || !response.data) {
        throw new Error(response.data.error || 'Failed to load images')
      }
      return response.data.images || []
    },
    enabled: !!productId,
  })
}

export function useUploadProductImages(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (images: Array<{ name: string; image_1920: string }>) => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.uploadProductImages(productId, images)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to upload images')
      }
      return response
    },
    onSuccess: () => {
      // Invalider le cache des images pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

export function useDeleteProductImage(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (imageId: number) => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.deleteProductImage(productId, imageId)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete image')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

export function useReorderProductImages(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (imageIds: number[]) => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.reorderProductImages(productId, imageIds)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to reorder images')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', productId] })
    },
  })
}
