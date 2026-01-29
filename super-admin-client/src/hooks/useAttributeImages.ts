import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// Types pour les images par valeur d'attribut
export interface AttributeValueWithImages {
  ptav_id: number
  name: string
  html_color: string | null
  image_count: number
  first_image_url: string | null
}

export interface AttributeLineWithImages {
  id: number
  attribute_id: number
  attribute_name: string
  display_type: string
  values: AttributeValueWithImages[]
}

export interface AttributeImage {
  id: number
  name: string
  url: string
  url_medium: string
  url_small: string
  sequence: number
}

/**
 * Hook pour récupérer les lignes d'attributs avec compteur d'images par valeur
 * Utilisé pour afficher l'interface de gestion des images par attribut
 */
export function useProductAttributeImages(productId: number | undefined) {
  return useQuery({
    queryKey: ['productAttributeImages', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.getProductAttributeImages(productId)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load attribute images')
      }
      return response.data.attribute_lines as AttributeLineWithImages[]
    },
    enabled: !!productId,
  })
}

/**
 * Hook pour récupérer les images d'une valeur d'attribut spécifique
 * Ex: toutes les images pour "Rouge" sur un produit
 */
export function useAttributeValueImages(
  productId: number | undefined,
  ptavId: number | undefined
) {
  return useQuery({
    queryKey: ['attributeValueImages', productId, ptavId],
    queryFn: async () => {
      if (!productId || !ptavId) throw new Error('Product ID and PTAV ID required')
      const response = await api.getAttributeValueImages(productId, ptavId)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load images')
      }
      return {
        images: response.data.images as AttributeImage[],
        ptavId: response.data.ptav_id,
        ptavName: response.data.ptav_name,
      }
    },
    enabled: !!productId && !!ptavId,
  })
}

/**
 * Hook pour uploader des images sur une valeur d'attribut
 */
export function useUploadAttributeValueImages(
  productId: number | undefined,
  ptavId: number | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (images: Array<{ name: string; image_1920: string }>) => {
      if (!productId || !ptavId) throw new Error('Product ID and PTAV ID required')
      const response = await api.uploadAttributeValueImages(productId, ptavId, images)
      if (!response.success) {
        throw new Error(response.error || 'Failed to upload images')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeValueImages', productId, ptavId] })
      queryClient.invalidateQueries({ queryKey: ['productAttributeImages', productId] })
      queryClient.invalidateQueries({ queryKey: ['productVariants', productId] })
    },
  })
}

/**
 * Hook pour supprimer une image d'une valeur d'attribut
 */
export function useDeleteAttributeValueImage(
  productId: number | undefined,
  ptavId: number | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (imageId: number) => {
      if (!productId || !ptavId) throw new Error('Product ID and PTAV ID required')
      const response = await api.deleteAttributeValueImage(productId, ptavId, imageId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete image')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeValueImages', productId, ptavId] })
      queryClient.invalidateQueries({ queryKey: ['productAttributeImages', productId] })
      queryClient.invalidateQueries({ queryKey: ['productVariants', productId] })
    },
  })
}

/**
 * Hook pour réordonner les images d'une valeur d'attribut
 */
export function useReorderAttributeValueImages(
  productId: number | undefined,
  ptavId: number | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (imageIds: number[]) => {
      if (!productId || !ptavId) throw new Error('Product ID and PTAV ID required')
      const response = await api.reorderAttributeValueImages(productId, ptavId, imageIds)
      if (!response.success) {
        throw new Error(response.error || 'Failed to reorder images')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeValueImages', productId, ptavId] })
    },
  })
}
