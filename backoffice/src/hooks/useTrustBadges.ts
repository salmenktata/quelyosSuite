import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '../lib/odoo-rpc'

export interface TrustBadge {
  id: number
  name: string
  title: string
  subtitle?: string
  icon: 'creditcard' | 'delivery' | 'shield' | 'support'
  sequence: number
  active: boolean
}

export function useTrustBadges() {
  return useQuery({
    queryKey: ['trustBadges'],
    queryFn: async () => {
      const response = await odooRpc<{ badges: TrustBadge[] }>('/api/ecommerce/trust-badges')
      return response
    },
  })
}

export function useCreateTrustBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TrustBadge>) =>
      odooRpc('/api/ecommerce/trust-badges/create', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustBadges'] })
    },
  })
}

export function useUpdateTrustBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TrustBadge> & { id: number }) =>
      odooRpc(`/api/ecommerce/trust-badges/${id}/update`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustBadges'] })
    },
  })
}

export function useDeleteTrustBadge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      odooRpc(`/api/ecommerce/trust-badges/${id}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustBadges'] })
    },
  })
}

export function useReorderTrustBadges() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (badgeIds: number[]) =>
      odooRpc('/api/ecommerce/trust-badges/reorder', { badge_ids: badgeIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustBadges'] })
    },
  })
}
