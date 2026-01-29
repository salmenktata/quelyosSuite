import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useUpdateLeadStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stage_id }: { id: number; stage_id: number }) => {
      const response = await api.updateLeadStage(id, stage_id)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update lead stage')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
    },
  })
}
