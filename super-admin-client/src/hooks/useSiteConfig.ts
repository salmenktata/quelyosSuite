import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@quelyos/logger'
import { backendRpc } from '@/lib/backend-rpc'

// URL de l'API (même config que api.ts)
const API_URL = import.meta.env.VITE_API_URL || ''

export interface SiteConfig {
  // Fonctionnalités
  compare_enabled: boolean
  wishlist_enabled: boolean
  reviews_enabled: boolean
  newsletter_enabled: boolean
  // Contact
  whatsapp_number: string
  contact_email: string
  contact_phone: string
  // Livraison
  shipping_standard_days: string
  shipping_express_days: string
  free_shipping_threshold: number
  // Retours
  return_delay_days: number
  refund_delay_days: string
  // Garantie
  warranty_years: number
  // Paiement
  payment_methods: string[]
  // Catalogue (optionnel pour compatibilité)
  catalog_settings?: {
    viewers_count_enabled: boolean
    sort_options: string[]
    pagination_options: number[]
  }
}

export interface UpdateSiteConfigParams {
  // Fonctionnalités
  compare_enabled?: boolean
  wishlist_enabled?: boolean
  reviews_enabled?: boolean
  newsletter_enabled?: boolean
  // Contact
  whatsapp_number?: string
  contact_email?: string
  contact_phone?: string
  // Livraison
  shipping_standard_days?: string
  shipping_express_days?: string
  free_shipping_threshold?: number
  // Retours
  return_delay_days?: number
  refund_delay_days?: string
  // Garantie
  warranty_years?: number
  // Paiement
  payment_methods?: string[]
  // Catalogue
  catalog_settings?: {
    viewers_count_enabled: boolean
    sort_options: string[]
    pagination_options: number[]
  }
}

/**
 * Hook pour récupérer la configuration du site
 * Utilise un GET direct car l'endpoint est de type HTTP (pas JSON-RPC)
 */
export function useSiteConfig() {
  return useQuery<SiteConfig>({
    queryKey: ['site-config'],
    queryFn: async () => {
      // L'endpoint est JSON-RPC (POST)
      // Le backend retourne {success: true, config: {...}}
      const result = await backendRpc<{ success: boolean; config: SiteConfig }>('/api/ecommerce/site-config')

      if (result.success && result.data) {
        return result.data.config
      }

      throw new Error(result.error || 'Erreur lors de la récupération de la configuration')
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook pour mettre à jour la configuration du site (ADMIN UNIQUEMENT)
 * L'endpoint est de type JSON-RPC (POST)
 */
export function useUpdateSiteConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateSiteConfigParams) => {
      // Récupérer le session_id pour l'authentification
      const sessionId = localStorage.getItem('session_id')

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (sessionId && sessionId !== 'null' && sessionId !== 'undefined') {
        headers['X-Session-Id'] = sessionId
      }

      // L'endpoint update est de type JSON-RPC avec auth='public'
      // L'authentification se fait via le header X-Session-Id (pas de cookies)
      const response = await fetch(`${API_URL}/api/ecommerce/site-config/update`, {
        method: 'POST',
        headers,
        credentials: 'omit',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: params,
          id: Math.random(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const json = await response.json()

      if (json.error) {
        throw new Error(json.error.data?.message || json.error.message || 'Erreur API')
      }

      if (!json.result?.success) {
        throw new Error(json.result?.error || 'Erreur lors de la mise à jour')
      }

      return json.result
    },
    onSuccess: (data) => {
      // Invalider le cache de la configuration pour forcer le rechargement
      queryClient.invalidateQueries({ queryKey: ['site-config'] })

      // Mettre à jour directement le cache avec les nouvelles données
      if (data.data) {
        queryClient.setQueryData(['site-config'], data.data)
      }

      logger.info('Configuration mise à jour:', data.data)
    },
    onError: (error) => {
      logger.error('Erreur mise à jour configuration:', error)
    },
  })
}
