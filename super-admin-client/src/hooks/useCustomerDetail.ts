import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.getCustomer(id),
    enabled: !!id,
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        name?: string
        email?: string
        phone?: string
        mobile?: string
        street?: string
        city?: string
        zip?: string
      }
    }) => api.updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
