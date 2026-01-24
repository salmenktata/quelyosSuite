import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ProductsQueryParams, ProductCreateData, ProductUpdateData } from '../types'

export function useProducts(params?: ProductsQueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.getProducts(params),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductCreateData) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateData }) =>
      api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.deleteProduct(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products'] })

      // Snapshot previous value
      const previousProducts = queryClient.getQueriesData({ queryKey: ['products'] })

      // Optimistically remove from list
      queryClient.setQueriesData({ queryKey: ['products'] }, (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        const data = old as { data?: { products?: Array<{ id: number }>; total?: number } }
        if (!data.data?.products) return old
        return {
          ...data,
          data: {
            ...data.data,
            products: data.data.products.filter((p) => p.id !== id),
            total: (data.data.total || 0) - 1,
          },
        }
      })

      return { previousProducts }
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useArchiveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, archive }: { id: number; archive: boolean }) =>
      api.archiveProduct(id, archive),
    onMutate: async ({ id, archive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products'] })

      // Snapshot previous value
      const previousProducts = queryClient.getQueriesData({ queryKey: ['products'] })

      // Optimistically update
      queryClient.setQueriesData({ queryKey: ['products'] }, (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        const data = old as { data?: { products?: Array<{ id: number; active: boolean }> } }
        if (!data.data?.products) return old
        return {
          ...data,
          data: {
            ...data.data,
            products: data.data.products.map((p) =>
              p.id === id ? { ...p, active: !archive } : p
            ),
          },
        }
      })

      return { previousProducts }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDuplicateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name?: string }) =>
      api.duplicateProduct(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useExportProducts() {
  return useMutation({
    mutationFn: (params?: { category_id?: number; search?: string }) =>
      api.exportProducts(params),
  })
}

export function useImportProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      products: Array<{
        name: string
        price?: number
        standard_price?: number
        description?: string
        default_code?: string
        barcode?: string
        weight?: number
        category?: string
      }>
      update_existing?: boolean
    }) => api.importProducts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useTaxes() {
  return useQuery({
    queryKey: ['taxes'],
    queryFn: () => api.getTaxes(),
  })
}

export function useUom() {
  return useQuery({
    queryKey: ['uom'],
    queryFn: () => api.getUom(),
  })
}

export function useProductTypes() {
  return useQuery({
    queryKey: ['productTypes'],
    queryFn: () => api.getProductTypes(),
  })
}

export function useProductTags() {
  return useQuery({
    queryKey: ['productTags'],
    queryFn: () => api.getProductTags(),
  })
}

export function useCreateProductTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: number }) =>
      api.createProductTag(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTags'] })
    },
  })
}
