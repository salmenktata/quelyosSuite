import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'

export interface HeroSlide {
  id: number
  name: string
  title: string
  subtitle?: string
  description?: string
  image_url?: string
  cta_text: string
  cta_link: string
  cta_secondary_text?: string
  cta_secondary_link?: string
  sequence: number
  active: boolean
  start_date?: string
  end_date?: string
}

export function useHeroSlides() {
  return useQuery({
    queryKey: ['heroSlides'],
    queryFn: async () => {
      const response = await odooRpc<{ slides: HeroSlide[] }>('/api/ecommerce/hero-slides')
      return response.slides || []
    },
  })
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<HeroSlide>) => odooRpc('/api/ecommerce/hero-slides/create', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<HeroSlide> & { id: number }) =>
      odooRpc(`/api/ecommerce/hero-slides/${id}/update`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => odooRpc(`/api/ecommerce/hero-slides/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}

export function useReorderHeroSlides() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slideIds: number[]) =>
      odooRpc('/api/ecommerce/hero-slides/reorder', { slide_ids: slideIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}
