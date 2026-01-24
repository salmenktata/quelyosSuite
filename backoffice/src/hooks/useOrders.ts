import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useOrders(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => api.getOrders(params),
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'confirm' | 'cancel' | 'done' }) =>
      api.updateOrderStatus(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}
