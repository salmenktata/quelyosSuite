import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'

export interface PromoBanner {
  id: number
  name: string
  title: string
  description: string
  tag: string
  tag_color: string
  button_bg: string
  button_text: string
  button_link: string
  gradient: string
  image_url?: string
  sequence: number
  active: boolean
}

export function usePromoBanners() {
  return useQuery({
    queryKey: ['promoBanners'],
    queryFn: async () => {
      const response = await odooRpc<{ banners: PromoBanner[] }>('/api/ecommerce/promo-banners')
      return response.banners || []
    },
  })
}

export function useCreatePromoBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<PromoBanner>) => odooRpc('/api/ecommerce/promo-banners/create', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}

export function useUpdatePromoBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PromoBanner> & { id: number }) =>
      odooRpc(`/api/ecommerce/promo-banners/${id}/update`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}

export function useDeletePromoBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => odooRpc(`/api/ecommerce/promo-banners/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}

export function useReorderPromoBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bannerIds: number[]) =>
      odooRpc('/api/ecommerce/promo-banners/reorder', { banner_ids: bannerIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}
