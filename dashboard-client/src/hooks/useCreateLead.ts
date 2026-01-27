import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      partner_id?: number
      stage_id?: number
      expected_revenue?: number
      probability?: number
      date_deadline?: string
      description?: string
      email?: string
      phone?: string
      mobile?: string
    }) => {
      const response = await api.createLead(data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to create lead')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
    },
  })
}
