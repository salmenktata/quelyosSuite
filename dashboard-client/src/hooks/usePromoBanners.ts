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
      return response.data?.banners || []
    },
  })
}

export function useCreatePromoBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<PromoBanner>) => {
      const response = await odooRpc('/api/ecommerce/promo-banners/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}

export function useUpdatePromoBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PromoBanner> & { id: number }) => {
      const response = await odooRpc(`/api/ecommerce/promo-banners/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}

export function useDeletePromoBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await odooRpc(`/api/ecommerce/promo-banners/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}

export function useReorderPromoBanners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bannerIds: number[]) => {
      const response = await odooRpc('/api/ecommerce/promo-banners/reorder', { banner_ids: bannerIds })
      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'ordre")
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promoBanners'] }),
  })
}
