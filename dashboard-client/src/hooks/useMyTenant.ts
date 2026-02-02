/**
 * Hook pour la gestion du tenant de l'utilisateur connecté.
 *
 * Permet au client de personnaliser son thème sans être admin.
 *
 * Fournit:
 * - useMyTenant(): Récupère le tenant de l'utilisateur connecté
 * - useUpdateMyTenant(): Met à jour le tenant (thème, logo, contact, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@quelyos/logger'
import { tokenService } from '@/lib/tokenService'
import type { TenantConfig, TenantFormData } from './useTenants'

const API_URL = import.meta.env.VITE_API_URL || ''

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const accessToken = tokenService.getAccessToken()
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const tenantDomain = window.location.hostname
  if (tenantDomain) {
    headers['X-Tenant-Domain'] = tenantDomain
  }

  return headers
}

function hasValidSession(): boolean {
  return tokenService.isAuthenticated()
}

/**
 * Récupère le tenant de l'utilisateur connecté
 */
export function useMyTenant() {
  const query = useQuery<TenantConfig>({
    queryKey: ['my-tenant'],
    enabled: hasValidSession(),
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/ecommerce/tenant/my`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'omit',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }
        if (response.status === 404) {
          throw new Error('Aucun tenant associé à votre compte.')
        }
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération du tenant')
      }

      return data.tenant as TenantConfig
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  return {
    ...query,
    tenant: query.data,
  }
}

/**
 * Met à jour le tenant de l'utilisateur connecté
 */
export function useUpdateMyTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<TenantFormData>) => {
      const response = await fetch(`${API_URL}/api/ecommerce/tenant/my/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'omit',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour')
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tenant'] })
      logger.info('Tenant mis à jour avec succès')
    },
    onError: (error) => {
      logger.error('Erreur mise à jour tenant:', error)
    },
  })
}
