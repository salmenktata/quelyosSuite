/**
 * Hook pour les statistiques factures clients (optimisé backend)
 *
 * Utilise TanStack Query pour cache et invalidation intelligente.
 * Réutilisable par modules Finance/CRM/Dashboard.
 *
 * @example
 * const { data: stats, isLoading } = useInvoiceStats()
 * console.log(stats.totalOverdue) // Enfin calculé ! 🎉
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface InvoiceStats {
  totalInvoiced: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  count: number
  avgAmount: number
}

interface ApiResponse {
  success: boolean
  data: InvoiceStats
  error?: string
}

/**
 * Récupère les statistiques factures depuis l'endpoint backend optimisé
 */
export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async (): Promise<InvoiceStats> => {
      const response = await apiClient.post<ApiResponse>('/finance/invoices/stats', {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des stats')
      }

      return response.data.data
    },
    staleTime: 2 * 60 * 1000, // Cache 2 minutes (stats changent peu fréquemment)
    gcTime: 5 * 60 * 1000, // Garbage collection après 5 minutes
    refetchOnWindowFocus: true, // Refresh au focus fenêtre
  })
}
