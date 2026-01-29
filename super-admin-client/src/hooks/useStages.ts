import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useStages() {
  return useQuery({
    queryKey: ['crm-stages'],
    queryFn: async () => {
      const response = await api.getStages()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch stages')
      }
      return response.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
