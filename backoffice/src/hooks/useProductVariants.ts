import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface AttributeValue {
  id: number
  name: string
  html_color?: string | null
  sequence?: number
}

export interface Attribute {
  id: number
  name: string
  display_type: 'radio' | 'pills' | 'select' | 'color'
  create_variant: 'always' | 'dynamic' | 'no_variant'
  values: AttributeValue[]
}

export interface AttributeLine {
  id: number
  attribute_id: number
  attribute_name: string
  display_type: string
  values: AttributeValue[]
}

export interface VariantImage {
  id: number
  url: string
  url_small: string
  sequence: number
}

export interface ProductVariant {
  id: number
  name: string
  display_name: string
  default_code: string
  barcode: string
  list_price: number
  standard_price: number
  qty_available: number
  image: string | null
  images?: VariantImage[]
  image_count?: number
  attribute_values: Array<{
    id: number
    name: string
    attribute_id: number
    attribute_name: string
  }>
}

export function useAllAttributes() {
  return useQuery({
    queryKey: ['attributes'],
    queryFn: async () => {
      const response = await api.getAllAttributes()
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load attributes')
      }
      return response.data.attributes as Attribute[]
    },
  })
}

export function useProductVariants(productId: number | undefined) {
  return useQuery({
    queryKey: ['productVariants', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.getProductVariants(productId)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load variants')
      }
      return {
        attributeLines: response.data.attribute_lines as AttributeLine[],
        variants: response.data.variants as ProductVariant[],
        variantCount: response.data.variant_count as number,
      }
    },
    enabled: !!productId,
  })
}

export function useAddProductAttribute(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { attribute_id: number; value_ids: number[] }) => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.addProductAttribute(productId, data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to add attribute')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

export function useUpdateProductAttribute(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { line_id: number; value_ids: number[] }) => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.updateProductAttribute(productId, data.line_id, {
        value_ids: data.value_ids,
      })
      if (!response.success) {
        throw new Error(response.error || 'Failed to update attribute')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

export function useDeleteProductAttribute(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lineId: number) => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.deleteProductAttribute(productId, lineId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete attribute')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

export function useUpdateProductVariant(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      variant_id: number
      list_price?: number
      standard_price?: number
      default_code?: string
      barcode?: string
    }) => {
      if (!productId) throw new Error('Product ID required')
      const { variant_id, ...updateData } = data
      const response = await api.updateProductVariant(productId, variant_id, updateData)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update variant')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

export function useUpdateVariantStock(productId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { variant_id: number; quantity: number }) => {
      if (!productId) throw new Error('Product ID required')
      const response = await api.updateVariantStock(productId, data.variant_id, data.quantity)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update variant stock')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}
