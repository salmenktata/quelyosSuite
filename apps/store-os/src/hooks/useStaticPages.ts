import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backendRpc } from '@/lib/backend-rpc'

export interface StaticPage {
  id: number
  name: string
  slug: string
  title: string
  subtitle?: string
  content: string
  layout: 'default' | 'with_sidebar' | 'full_width' | 'narrow'
  show_sidebar: boolean
  sidebar_content?: string
  header_image_url?: string
  show_header_image: boolean
  meta_title?: string
  meta_description?: string
  show_in_footer: boolean
  footer_column?: 'company' | 'help' | 'legal'
  show_in_menu: boolean
  menu_position: number
  active: boolean
  views_count?: number
  published_date?: string
}

export function useStaticPages() {
  return useQuery({
    queryKey: ['staticPages'],
    queryFn: async () => {
      const response = await backendRpc<{ pages: StaticPage[] }>('/api/ecommerce/pages')
      return response.data?.pages || []
    },
  })
}

export function useCreateStaticPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<StaticPage>) => {
      const response = await backendRpc('/api/ecommerce/pages/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staticPages'] }),
  })
}

export function useUpdateStaticPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<StaticPage> & { id: number }) => {
      const response = await backendRpc(`/api/ecommerce/pages/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staticPages'] }),
  })
}

export function useDeleteStaticPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await backendRpc(`/api/ecommerce/pages/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staticPages'] }),
  })
}
