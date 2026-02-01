/**
 * Hook pour le dashboard POS
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { POSDashboard, POSSessionSummary, POSZReport } from '../../types/pos'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const posDashboardKeys = {
  all: ['pos-dashboard'] as const,
  stats: (period?: string) => [...posDashboardKeys.all, 'stats', period] as const,
  sessions: () => [...posDashboardKeys.all, 'sessions'] as const,
  zReport: (sessionId: number) => [...posDashboardKeys.all, 'z-report', sessionId] as const,
}

// ============================================================================
// TYPES
// ============================================================================

interface DashboardParams {
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// FETCHERS
// ============================================================================

async function fetchDashboard(params: DashboardParams = {}): Promise<POSDashboard> {
  const response = await api.post<{ success: boolean; error?: string; data: POSDashboard }>('/api/pos/dashboard', {
    date_from: params.dateFrom,
    date_to: params.dateTo,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du chargement du dashboard')
  }
  return response.data.data!
}

async function fetchActiveSessions(): Promise<POSSessionSummary[]> {
  const response = await api.post<{ success: boolean; error?: string; data: POSSessionSummary[] }>('/api/pos/sessions/active', {})
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du chargement des sessions')
  }
  return response.data.data || []
}

async function fetchZReport(sessionId: number): Promise<POSZReport> {
  const response = await api.post<{ success: boolean; error?: string; data: POSZReport }>(`/api/pos/session/${sessionId}/report`, {})
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors de la génération du rapport')
  }
  return response.data.data!
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePOSDashboard(params: DashboardParams = {}) {
  const period = params.dateFrom && params.dateTo
    ? `${params.dateFrom}-${params.dateTo}`
    : 'today'

  return useQuery({
    queryKey: posDashboardKeys.stats(period),
    queryFn: () => fetchDashboard(params),
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}

export function usePOSActiveSessions() {
  return useQuery({
    queryKey: posDashboardKeys.sessions(),
    queryFn: fetchActiveSessions,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}

export function usePOSZReport(sessionId: number | null) {
  return useQuery({
    queryKey: posDashboardKeys.zReport(sessionId!),
    queryFn: () => fetchZReport(sessionId!),
    enabled: sessionId !== null,
  })
}
