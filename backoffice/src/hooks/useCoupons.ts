import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CouponCreate } from '../types'

export function useCoupons(params?: { limit?: number; offset?: number; active_only?: boolean }) {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: () => api.getCoupons(params),
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
