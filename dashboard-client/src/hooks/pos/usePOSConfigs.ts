/**
 * Hook pour la gestion des configurations/terminaux POS
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { POSConfig } from '../../types/pos'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const posConfigKeys = {
  all: ['pos-configs'] as const,
  list: () => [...posConfigKeys.all, 'list'] as const,
  detail: (id: number) => [...posConfigKeys.all, 'detail', id] as const,
}

// ============================================================================
// FETCHERS
// ============================================================================

async function fetchPOSConfigs(): Promise<POSConfig[]> {
  const response = await api.post('/api/pos/configs', {})
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du chargement des terminaux')
  }
  return response.data.data || []
}

async function fetchPOSConfig(id: number): Promise<POSConfig> {
  const response = await api.post(`/api/pos/config/${id}`, {})
  if (!response.data.success) {
    throw new Error(response.data.error || 'Terminal non trouvé')
  }
  return response.data.data
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePOSConfigs() {
  return useQuery({
    queryKey: posConfigKeys.list(),
    queryFn: fetchPOSConfigs,
  })
}

export function usePOSConfig(id: number | null) {
  return useQuery({
    queryKey: posConfigKeys.detail(id!),
    queryFn: () => fetchPOSConfig(id!),
    enabled: id !== null,
  })
}

export function usePOSConfigsWithSession() {
  const { data: configs, ...rest } = usePOSConfigs()

  // Filter configs that have open sessions or are available
  const availableConfigs = configs?.filter(c => !c.hasOpenSession || c.currentSessionId) || []

  return {
    configs: availableConfigs,
    ...rest,
  }
}
