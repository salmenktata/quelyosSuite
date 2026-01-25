import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useAnalyticsStats() {
  return useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => api.getAnalyticsStats(),
    refetchInterval: 60000, // Rafraîchir toutes les 60 secondes
  })
}

export function useRevenueChart(params?: { period?: string; start_date?: string; end_date?: string; group_by?: string }) {
  return useQuery({
    queryKey: ['revenue-chart', params],
    queryFn: () => api.getRevenueChart(params),
    refetchInterval: 60000,
  })
}

export function useOrdersChart(params?: { period?: string }) {
  return useQuery({
    queryKey: ['orders-chart', params],
    queryFn: () => api.getOrdersChart(params),
    refetchInterval: 60000,
  })
}

export function useConversionFunnel(params?: { period?: string }) {
  return useQuery({
    queryKey: ['conversion-funnel', params],
    queryFn: () => api.getConversionFunnel(params),
    refetchInterval: 60000,
  })
}

export function useTopCategories(params?: { limit?: number }) {
  return useQuery({
    queryKey: ['top-categories', params],
    queryFn: () => api.getTopCategories(params),
  })
}
