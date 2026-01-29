/**
 * Hook pour lister les sessions POS
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export interface POSSessionItem {
  id: number
  name: string
  configId: number
  configName: string
  userId: number
  userName: string
  state: 'opened' | 'closed'
  openedAt: string
  closedAt?: string
  openingCash: number
  closingCash?: number
  orderCount: number
  totalAmount: number
}

async function fetchSessions(): Promise<POSSessionItem[]> {
  const response = await api.post('/api/pos/sessions', {})
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du chargement des sessions')
  }
  return response.data.data?.sessions || []
}

export function usePOSSessions() {
  return useQuery({
    queryKey: ['pos', 'sessions'],
    queryFn: fetchSessions,
  })
}
