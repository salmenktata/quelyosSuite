import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'

export interface PromoMessage {
  id: number
  name: string
  text: string
  icon: 'truck' | 'gift' | 'star' | 'clock' | 'shield' | 'percent'
  sequence: number
  active: boolean
}

export function usePromoMessages() {
  return useQuery({
    queryKey: ['promoMessages'],
    queryFn: async () => {
      const response = await odooRpc<{ messages: PromoMessage[] }>('/api/ecommerce/promo-messages')
      return response.data?.messages || []
    },
  })
}

export function useCreatePromoMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<PromoMessage>) => {
      const response = await odooRpc('/api/ecommerce/promo-messages/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoMessages'] }),
  })
}

export function useUpdatePromoMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PromoMessage> & { id: number }) => {
      const response = await odooRpc(`/api/ecommerce/promo-messages/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoMessages'] }),
  })
}

export function useDeletePromoMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await odooRpc(`/api/ecommerce/promo-messages/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoMessages'] }),
  })
}

export function useReorderPromoMessages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (messageIds: number[]) => {
      const response = await odooRpc('/api/ecommerce/promo-messages/reorder', { message_ids: messageIds })
      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'ordre")
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoMessages'] }),
  })
}
