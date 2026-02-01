/**
 * Hook pour le catalogue produits POS
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { POSProduct, POSCategory } from '../../types/pos'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const posProductKeys = {
  all: ['pos-products'] as const,
  list: (params: ProductParams) => [...posProductKeys.all, 'list', params] as const,
  categories: () => [...posProductKeys.all, 'categories'] as const,
  byBarcode: (barcode: string) => [...posProductKeys.all, 'barcode', barcode] as const,
}

// ============================================================================
// TYPES
// ============================================================================

interface ProductParams {
  configId: number
  categoryId?: number
  search?: string
  limit?: number
  offset?: number
}

interface ProductsResponse {
  products: POSProduct[]
  total: number
  hasMore: boolean
}

// ============================================================================
// FETCHERS
// ============================================================================

async function fetchPOSProducts(params: ProductParams): Promise<ProductsResponse> {
  const response = await api.post<{ success: boolean; error?: string; data: ProductsResponse }>('/api/pos/products', {
    config_id: params.configId,
    category_id: params.categoryId,
    search: params.search,
    limit: params.limit || 50,
    offset: params.offset || 0,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du chargement des produits')
  }
  return response.data.data!
}

async function fetchPOSCategories(configId: number): Promise<POSCategory[]> {
  const response = await api.post<{ success: boolean; error?: string; data: POSCategory[] }>('/api/pos/categories', { config_id: configId })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du chargement des catégories')
  }
  return response.data.data || []
}

async function fetchProductByBarcode(configId: number, barcode: string): Promise<POSProduct | null> {
  const response = await api.post<{ success: boolean; error?: string; data: POSProduct | null }>('/api/pos/product/barcode', {
    config_id: configId,
    barcode,
  })
  if (!response.data.success) {
    return null
  }
  return response.data.data ?? null
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePOSProducts(params: ProductParams) {
  return useQuery({
    queryKey: posProductKeys.list(params),
    queryFn: () => fetchPOSProducts(params),
    enabled: params.configId > 0,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function usePOSProductsInfinite(params: Omit<ProductParams, 'offset'>) {
  return useInfiniteQuery({
    queryKey: posProductKeys.list({ ...params, offset: 0 }),
    queryFn: ({ pageParam = 0 }) => fetchPOSProducts({ ...params, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.reduce((acc, page) => acc + page.products.length, 0)
    },
    initialPageParam: 0,
    enabled: params.configId > 0,
  })
}

export function usePOSCategories(configId: number) {
  return useQuery({
    queryKey: posProductKeys.categories(),
    queryFn: () => fetchPOSCategories(configId),
    enabled: configId > 0,
  })
}

export function usePOSProductByBarcode(configId: number, barcode: string) {
  return useQuery({
    queryKey: posProductKeys.byBarcode(barcode),
    queryFn: () => fetchProductByBarcode(configId, barcode),
    enabled: configId > 0 && barcode.length > 0,
    staleTime: 0, // Always refetch for barcode
  })
}
