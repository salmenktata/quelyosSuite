import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCustomers(params?: { limit?: number; offset?: number; search?: string }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => api.getCustomers(params),
  })
}
