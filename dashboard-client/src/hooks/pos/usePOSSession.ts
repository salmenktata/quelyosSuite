/**
 * Hook pour la gestion des sessions POS
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { usePOSSessionStore } from '../../stores/pos'
import type { POSSession, POSConfig, POSZReport } from '../../types/pos'

// ============================================================================
// TYPES
// ============================================================================

interface OpenSessionParams {
  configId: number
  openingCash: number
}

interface CloseSessionParams {
  sessionId: number
  closingCash: number
  note?: string
}

interface SessionResponse {
  session: POSSession
  config: POSConfig
}

// ============================================================================
// MUTATIONS
// ============================================================================

async function openSession(params: OpenSessionParams): Promise<SessionResponse> {
  const response = await api.post<{ success: boolean; error?: string; data: SessionResponse }>('/api/pos/session/open', {
    config_id: params.configId,
    opening_cash: params.openingCash,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Impossible d\'ouvrir la session')
  }
  return response.data.data!
}

async function closeSession(params: CloseSessionParams): Promise<POSZReport> {
  const response = await api.post<{ success: boolean; error?: string; data: POSZReport }>('/api/pos/session/close', {
    session_id: params.sessionId,
    closing_cash: params.closingCash,
    note: params.note,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Impossible de fermer la session')
  }
  return response.data.data!
}

// ============================================================================
// HOOKS
// ============================================================================

export function useOpenSession() {
  const queryClient = useQueryClient()
  const { setSession, setConfig } = usePOSSessionStore()

  return useMutation({
    mutationFn: openSession,
    onSuccess: (data) => {
      // Store session in Zustand
      setSession(data.session)
      setConfig(data.config)
      // Invalidate configs to update hasOpenSession
      queryClient.invalidateQueries({ queryKey: ['pos-configs'] })
    },
  })
}

export function useCloseSession() {
  const queryClient = useQueryClient()
  const { clearSession } = usePOSSessionStore()

  return useMutation({
    mutationFn: closeSession,
    onSuccess: () => {
      clearSession()
      queryClient.invalidateQueries({ queryKey: ['pos-configs'] })
      queryClient.invalidateQueries({ queryKey: ['pos-sessions'] })
    },
  })
}

export function usePOSActiveSession() {
  const { session, config, isSessionOpen, canMakeSales, connectionStatus } = usePOSSessionStore()

  return {
    session,
    config,
    isOpen: isSessionOpen(),
    canMakeSales: canMakeSales(),
    connectionStatus,
  }
}
