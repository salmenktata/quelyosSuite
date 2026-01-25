import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'

export interface TrustBadge {
  id: number
  name: string
  title: string
  subtitle: string
  icon: 'creditcard' | 'delivery' | 'shield' | 'support' | 'return' | 'quality'
  sequence: number
  active: boolean
}

export function useTrustBadges() {
  return useQuery({
    queryKey: ['trustBadges'],
    queryFn: async () => {
      const response = await odooRpc<{ badges: TrustBadge[] }>('/api/ecommerce/trust-badges')
      return response.data?.badges || []
    },
  })
}

export function useCreateTrustBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TrustBadge>) => {
      const response = await odooRpc('/api/ecommerce/trust-badges/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trustBadges'] }),
  })
}

export function useUpdateTrustBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TrustBadge> & { id: number }) => {
      const response = await odooRpc(`/api/ecommerce/trust-badges/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trustBadges'] }),
  })
}

export function useDeleteTrustBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await odooRpc(`/api/ecommerce/trust-badges/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trustBadges'] }),
  })
}

export function useReorderTrustBadges() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (badgeIds: number[]) => {
      const response = await odooRpc('/api/ecommerce/trust-badges/reorder', { badge_ids: badgeIds })
      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'ordre")
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trustBadges'] }),
  })
}
