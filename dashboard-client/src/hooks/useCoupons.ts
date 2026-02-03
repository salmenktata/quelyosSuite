import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CouponCreate } from '@quelyos/types'

export function useCoupons(params?: { limit?: number; offset?: number; active_only?: boolean }) {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: () => api.getCoupons(params),
  })
}

export function useCoupon(id: number) {
  return useQuery({
    queryKey: ['coupon', id],
    queryFn: () => api.getCoupon(id),
    enabled: !!id,
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CouponCreate) => api.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        name?: string
        active?: boolean
        date_from?: string | null
        date_to?: string | null
        discount_type?: string
        discountvalue?: number
      }
    }) => api.updateCoupon(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coupon', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}
