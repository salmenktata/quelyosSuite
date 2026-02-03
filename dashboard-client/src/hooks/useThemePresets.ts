/**
 * Hook pour la gestion des presets de thèmes dynamiques.
 *
 * Remplace les presets hardcodés par un fetch dynamique depuis l'API.
 * Permet aux admins de créer/modifier des presets sans toucher au code.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@quelyos/logger'
import { tokenService } from '@/lib/tokenService'

const API_URL = import.meta.env.VITE_BACKEND_URL || ''

export interface ThemePresetColors {
  primary: string
  primaryDark: string
  primaryLight: string
  secondary: string
  secondaryDark: string
  secondaryLight: string
  accent: string
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  ring: string
}

export interface ThemePreset {
  id: string
  code: string
  label: string
  description: string
  colors: ThemePresetColors
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'open-sans' | 'lato'
  darkMode: {
    enabled: boolean
    defaultDark: boolean
  }
}

export interface ThemePresetFormData {
  name: string
  code: string
  description?: string
  sequence?: number
  active?: boolean
  public?: boolean
  tenantIds?: number[]

  // Couleurs
  colors?: ThemePresetColors

  // Ou couleurs individuelles (snake_case pour API)
  primary_color?: string
  primary_dark?: string
  primary_light?: string
  secondary_color?: string
  secondary_dark?: string
  secondary_light?: string
  accent_color?: string
  background_color?: string
  foreground_color?: string
  muted_color?: string
  muted_foreground?: string
  border_color?: string
  ring_color?: string

  // Typographie
  fontFamily?: string
  font_family?: string

  // Dark mode
  darkMode?: {
    enabled?: boolean
    defaultDark?: boolean
  }
  enable_dark_mode?: boolean
  default_dark?: boolean
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const accessToken = tokenService.getAccessToken()
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  return headers
}

/**
 * Récupère les presets de thèmes disponibles.
 * Inclut presets publics + presets privés du tenant (si tenant_id fourni).
 */
export function useThemePresets(tenantId?: number) {
  return useQuery<ThemePreset[]>({
    queryKey: ['theme-presets', tenantId],
    queryFn: async () => {
      const url = tenantId
        ? `${API_URL}/api/ecommerce/theme-presets?tenant_id=${tenantId}`
        : `${API_URL}/api/ecommerce/theme-presets`

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des presets')
      }

      return data.presets || []
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    retry: 1,
  })
}

/**
 * Crée un nouveau preset (admin seulement)
 */
export function useCreateThemePreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ThemePresetFormData) => {
      const response = await fetch(`${API_URL}/api/ecommerce/theme-presets/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'omit',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }
        if (response.status === 403) {
          throw new Error('Accès réservé aux administrateurs.')
        }
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création')
      }

      return result.preset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      logger.info('Preset créé avec succès')
    },
    onError: (error) => {
      logger.error('Erreur création preset:', error)
    },
  })
}

/**
 * Met à jour un preset existant (admin seulement)
 */
export function useUpdateThemePreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<ThemePresetFormData> }) => {
      const response = await fetch(`${API_URL}/api/ecommerce/theme-presets/${id}/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'omit',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }
        if (response.status === 403) {
          throw new Error('Accès réservé aux administrateurs.')
        }
        if (response.status === 404) {
          throw new Error('Preset non trouvé.')
        }
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour')
      }

      return result.preset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      logger.info('Preset mis à jour avec succès')
    },
    onError: (error) => {
      logger.error('Erreur mise à jour preset:', error)
    },
  })
}

/**
 * Supprime un preset (admin seulement)
 */
export function useDeleteThemePreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await fetch(`${API_URL}/api/ecommerce/theme-presets/${id}/delete`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'omit',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }
        if (response.status === 403) {
          throw new Error('Accès réservé aux administrateurs.')
        }
        if (response.status === 404) {
          throw new Error('Preset non trouvé.')
        }
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      logger.info('Preset supprimé avec succès')
    },
    onError: (error) => {
      logger.error('Erreur suppression preset:', error)
    },
  })
}
