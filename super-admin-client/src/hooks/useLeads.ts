import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useLeads(params?: { limit?: number; offset?: number; search?: string }) {
  return useQuery({
    queryKey: ['crm-leads', params],
    queryFn: async () => {
      const response = await api.getLeads(params)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch leads')
      }
      return {
        leads: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0, limit: 20, offset: 0 }
      }
    },
  })
}
