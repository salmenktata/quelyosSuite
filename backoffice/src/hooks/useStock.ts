import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface LowStockAlert {
  id: number
  name: string
  sku: string
  current_stock: number
  threshold: number
  diff: number
  image_url: string | null
  list_price: number
  category: string
}

export function useLowStockAlerts(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['low-stock-alerts', params],
    queryFn: () => api.getLowStockAlerts(params),
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  })
}
