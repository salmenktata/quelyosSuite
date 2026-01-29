import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useDeliveryMethods() {
  return useQuery({
    queryKey: ['delivery-methods'],
    queryFn: () => api.getDeliveryMethods(),
  })
}

export function useDeliveryMethod(id: number) {
  return useQuery({
    queryKey: ['delivery-method', id],
    queryFn: () => api.getDeliveryMethod(id),
    enabled: !!id,
  })
}

export function useCreateDeliveryMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; fixed_price: number; free_over?: number }) =>
      api.createDeliveryMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-methods'] })
    },
  })
}

export function useUpdateDeliveryMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        name?: string
        fixed_price?: number
        free_over?: number | null
        active?: boolean
      }
    }) => api.updateDeliveryMethod(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-method', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['delivery-methods'] })
    },
  })
}

export function useDeleteDeliveryMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.deleteDeliveryMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-methods'] })
    },
  })
}
