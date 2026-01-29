import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/finance/api'
import type { StockTurnoverResponse, TurnoverStatus } from '@/types/stock'

interface UseStockTurnoverParams {
  start_date?: string
  end_date?: string
  category_id?: number
  status_filter?: TurnoverStatus
  limit?: number
  offset?: number
}

/**
 * Hook pour récupérer le rapport de rotation du stock
 * Cache 5 minutes par défaut
 */
export function useStockTurnover(params?: UseStockTurnoverParams) {
  return useQuery({
    queryKey: ['stock', 'turnover', params],
    queryFn: () => financeApi.getStockTurnover(params) as Promise<StockTurnoverResponse>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
  })
}
