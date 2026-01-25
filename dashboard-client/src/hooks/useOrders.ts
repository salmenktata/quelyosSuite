import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useOrders(params?: {
  limit?: number
  offset?: number
  status?: string
  search?: string
  date_from?: string
  date_to?: string
}) {
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

export function useOrderTracking(orderId: number) {
  return useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: () => api.getShippingTracking(orderId),
    enabled: !!orderId,
  })
}

export function useUpdateOrderTracking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      pickingId,
      trackingRef,
      carrierId,
    }: {
      orderId: number
      pickingId: number
      trackingRef: string
      carrierId?: number
    }) =>
      api.updateOrderTracking(orderId, {
        picking_id: pickingId,
        tracking_ref: trackingRef,
        carrier_id: carrierId,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-tracking', variables.orderId] })
    },
  })
}

export function useOrderHistory(orderId: number) {
  return useQuery({
    queryKey: ['order-history', orderId],
    queryFn: () => api.getOrderHistory(orderId),
    enabled: !!orderId,
  })
}

export function useSendQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => api.sendQuotationEmail(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => api.createInvoiceFromOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useUnlockOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => api.unlockOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export function useShippingTracking(orderId: number) {
  return useQuery({
    queryKey: ['shipping-tracking', orderId],
    queryFn: () => api.getShippingTracking(orderId),
    enabled: !!orderId,
  })
}
