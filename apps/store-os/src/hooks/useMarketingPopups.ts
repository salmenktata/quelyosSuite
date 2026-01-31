import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backendRpc } from '@/lib/backend-rpc'

export interface MarketingPopup {
  id: number
  name: string
  popup_type: 'newsletter' | 'promotion' | 'announcement' | 'exit_intent' | 'welcome'
  title: string
  subtitle?: string
  content?: string
  image_url?: string
  cta_text: string
  cta_link: string
  cta_color: string
  show_close_button: boolean
  close_text: string
  trigger_type: 'immediate' | 'delay' | 'scroll' | 'exit_intent'
  trigger_delay: number
  trigger_scroll_percent: number
  target_pages: 'all' | 'home' | 'products' | 'cart' | 'custom'
  custom_pages?: string
  show_once_per_session: boolean
  show_once_per_user: boolean
  cookie_duration_days: number
  start_date?: string
  end_date?: string
  position: 'center' | 'bottom_right' | 'bottom_left' | 'top_banner'
  overlay_opacity: number
  max_width: number
  background_color: string
  text_color: string
  sequence: number
  active: boolean
  views_count?: number
  clicks_count?: number
  conversion_rate?: number
}

export function useMarketingPopups() {
  return useQuery({
    queryKey: ['marketingPopups'],
    queryFn: async () => {
      const response = await backendRpc<{ popups: MarketingPopup[] }>('/api/ecommerce/popups')
      return response.data?.popups || []
    },
  })
}

export function useCreateMarketingPopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<MarketingPopup>) => {
      const response = await backendRpc('/api/ecommerce/popups/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketingPopups'] }),
  })
}

export function useUpdateMarketingPopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MarketingPopup> & { id: number }) => {
      const response = await backendRpc(`/api/ecommerce/popups/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketingPopups'] }),
  })
}

export function useDeleteMarketingPopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await backendRpc(`/api/ecommerce/popups/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketingPopups'] }),
  })
}
