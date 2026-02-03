import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AbandonedCartsQueryParams } from '@/types'

export function useAbandonedCarts(params?: AbandonedCartsQueryParams) {
  return useQuery({
    queryKey: ['abandoned-carts', params],
    queryFn: () => api.getAbandonedCarts(params),
  })
}

export function useSendCartReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cartId: number) => api.sendCartReminder(cartId),
    onSuccess: () => {
      // Invalider la liste des paniers abandonnés pour rafraîchir après envoi
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] })
    },
  })
}

export function useCartRecoveryStats(params?: { period?: string }) {
  return useQuery({
    queryKey: ['cart-recovery-stats', params],
    queryFn: () => api.getCartRecoveryStats(params),
  })
}
