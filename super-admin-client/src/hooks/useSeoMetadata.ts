import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backendRpc } from '@/lib/backend-rpc'

export interface SeoMetadata {
  id: number
  name: string
  page_type: 'home' | 'product' | 'category' | 'static' | 'collection'
  slug: string
  meta_title: string
  meta_description: string
  og_title?: string
  og_description?: string
  og_image_url?: string
  og_type: 'website' | 'article' | 'product'
  twitter_card: 'summary' | 'summary_large_image' | 'product'
  twitter_title?: string
  twitter_description?: string
  twitter_image_url?: string
  schema_type: 'WebPage' | 'Product' | 'Article' | 'Organization' | 'FAQPage'
  noindex: boolean
  nofollow: boolean
  canonical_url?: string
  keywords?: string
  focus_keyword?: string
  active: boolean
  seo_score?: number
}

export function useSeoMetadataList() {
  return useQuery({
    queryKey: ['seoMetadata'],
    queryFn: async () => {
      const response = await backendRpc<{ metadata: SeoMetadata[] }>('/api/ecommerce/seo-metadata')
      return response.data?.metadata || []
    },
  })
}

export function useCreateSeoMetadata() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<SeoMetadata>) => {
      const response = await backendRpc('/api/ecommerce/seo-metadata/create', data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seoMetadata'] }),
  })
}

export function useUpdateSeoMetadata() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SeoMetadata> & { id: number }) => {
      const response = await backendRpc(`/api/ecommerce/seo-metadata/${id}/update`, data)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seoMetadata'] }),
  })
}

export function useDeleteSeoMetadata() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await backendRpc(`/api/ecommerce/seo-metadata/${id}/delete`)
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression')
      }
      return response
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seoMetadata'] }),
  })
}
