import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number
      data: {
        name?: string
        partner_id?: number
        stage_id?: number
        expected_revenue?: number
        probability?: number
        date_deadline?: string
        description?: string
        email?: string
        phone?: string
        mobile?: string
      }
    }) => {
      const response = await api.updateLead(id, data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update lead')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-lead', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
    },
  })
}
