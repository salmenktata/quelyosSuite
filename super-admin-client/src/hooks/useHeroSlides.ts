import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backendRpc } from '@/lib/backend-rpc'

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
      const response = await backendRpc<{ slides: HeroSlide[] }>('/api/ecommerce/hero-slides')
      return response.data?.slides || []
    },
  })
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<HeroSlide>) => {
      const response = await backendRpc('/api/ecommerce/hero-slides/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<HeroSlide> & { id: number }) => {
      const response = await backendRpc(`/api/ecommerce/hero-slides/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await backendRpc(`/api/ecommerce/hero-slides/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}

export function useReorderHeroSlides() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (slideIds: number[]) => {
      const response = await backendRpc('/api/ecommerce/hero-slides/reorder', { slide_ids: slideIds })
      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'ordre")
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroSlides'] }),
  })
}
