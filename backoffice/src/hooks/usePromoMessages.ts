import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '../lib/odoo-rpc'

export interface PromoMessage {
  id: number
  name: string
  text: string
  icon: 'truck' | 'gift' | 'star' | 'clock'
  sequence: number
  active: boolean
  start_date?: string
  end_date?: string
}

export function usePromoMessages() {
  return useQuery({
    queryKey: ['promoMessages'],
    queryFn: async () => {
      const response = await odooRpc<{ messages: PromoMessage[] }>('/api/ecommerce/promo-messages')
      return response
    },
  })
}

export function useCreatePromoMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<PromoMessage>) =>
      odooRpc('/api/ecommerce/promo-messages/create', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoMessages'] })
    },
  })
}

export function useUpdatePromoMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PromoMessage> & { id: number }) =>
      odooRpc(`/api/ecommerce/promo-messages/${id}/update`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoMessages'] })
    },
  })
}

export function useDeletePromoMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      odooRpc(`/api/ecommerce/promo-messages/${id}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoMessages'] })
    },
  })
}

export function useReorderPromoMessages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageIds: number[]) =>
      odooRpc('/api/ecommerce/promo-messages/reorder', { message_ids: messageIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoMessages'] })
    },
  })
}
