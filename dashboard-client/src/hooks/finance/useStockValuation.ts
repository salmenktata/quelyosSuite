import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/finance/api'
import type { StockValuationResponse } from '@/types/stock'

interface UseStockValuationParams {
  warehouse_id?: number
  category_id?: number
  date?: string
}

/**
 * Hook pour récupérer la valorisation du stock
 * Cache 5 minutes par défaut
 */
export function useStockValuation(params?: UseStockValuationParams) {
  return useQuery({
    queryKey: ['stock', 'valuation', params],
    queryFn: () => financeApi.getStockValuation(params) as Promise<StockValuationResponse>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
  })
}
