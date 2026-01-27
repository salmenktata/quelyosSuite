import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useLead(id?: number) {
  return useQuery({
    queryKey: ['crm-lead', id],
    queryFn: async () => {
      if (!id) throw new Error('Lead ID is required')
      const response = await api.getLead(id)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch lead')
      }
      return response.data
    },
    enabled: !!id,
  })
}
