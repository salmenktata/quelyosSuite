/**
 * Hooks Scoring Risque Impayé & Relances IA
 *
 * Hooks TanStack Query pour consommer API scoring risque ML + relances
 *
 * Endpoints backend :
 * - POST /api/finance/customer-risk/score : Score risque client 0-100
 * - POST /api/finance/customer-risk/list : Liste scores tous clients
 * - POST /api/finance/reminders/sequences : Séquences relances configurées
 * - POST /api/finance/reminders/stats : Statistiques relances
 *
 * @example
 * const { data: score } = useCustomerRiskScore({ partnerId: 123 })
 * const { data: scores } = useCustomerRiskScores({ category: 'high' })
 * const { data: sequences } = useReminderSequences()
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// Types
interface CustomerRiskScore {
  score: number // 0-100
  category: 'low' | 'medium' | 'high' | 'critical'
  last_computed: string | null // ISO date
  confidence: number // 0-100
  features: {
    avg_payment_delay: number
    late_payment_rate: number
    total_overdue: number
    relationship_months: number
    reminder_count: number
  }
}

interface CustomerRiskScoreListItem {
  id: number
  partner_id: number
  partner_name: string
  score: number
  category: 'low' | 'medium' | 'high' | 'critical'
  total_overdue: number
  avg_payment_delay: number
  late_payment_rate: number
  confidence: number
  last_computed: string | null
}

interface ReminderSequence {
  id: number
  name: string
  days_after_due: number
  risk_score_min: number
  action_email: boolean
  action_sms: boolean
  action_call: boolean
  action_suspend_delivery: boolean
  action_notify_legal: boolean
  email_tone: 'friendly' | 'neutral' | 'formal' | 'strict'
  email_send_time: 'morning' | 'afternoon' | 'optimal_ml'
  ab_testing_enabled: boolean
  total_sent: number
  total_opened: number
  total_paid: number
  conversion_rate: number
}

interface ReminderStats {
  total_sent: number
  total_opened: number
  total_paid: number
  avg_conversion_rate: number
  by_tone: Record<string, { sent: number; conversion: number }>
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

/**
 * Hook score risque client individuel
 *
 * @param params.partnerId - ID client
 * @param params.forceRecompute - Force recalcul (sinon cache)
 * @returns Score 0-100 + catégorie + features
 */
export function useCustomerRiskScore(params: { partnerId: number; forceRecompute?: boolean }) {
  return useQuery({
    queryKey: ['customer-risk-score', params.partnerId, params.forceRecompute],
    queryFn: async (): Promise<CustomerRiskScore> => {
      const response = await apiClient.post<ApiResponse<CustomerRiskScore>>(
        '/finance/customer-risk/score',
        {
          partner_id: params.partnerId,
          force_recompute: params.forceRecompute || false,
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur calcul score risque')
      }

      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // Cache 10 min (score stable)
    enabled: !!params.partnerId,
  })
}

/**
 * Hook liste scores risque tous clients
 *
 * @param params.category - Filtrer par catégorie (low/medium/high/critical)
 * @param params.minScore - Score minimum
 * @param params.limit - Nombre résultats
 * @param params.offset - Pagination
 * @returns Liste scores triés par score desc
 */
export function useCustomerRiskScores(
  params: {
    category?: 'low' | 'medium' | 'high' | 'critical'
    minScore?: number
    limit?: number
    offset?: number
  } = {}
) {
  return useQuery({
    queryKey: ['customer-risk-scores', params],
    queryFn: async (): Promise<{ scores: CustomerRiskScoreListItem[]; count: number }> => {
      const response = await apiClient.post<
        ApiResponse<{ scores: CustomerRiskScoreListItem[]; count: number }>
      >('/finance/customer-risk/list', {
        category: params.category,
        min_score: params.minScore,
        limit: params.limit || 50,
        offset: params.offset || 0,
      })

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur récupération scores')
      }

      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  })
}

/**
 * Hook séquences relances configurées
 *
 * @returns Liste séquences triées par jours après échéance
 */
export function useReminderSequences() {
  return useQuery({
    queryKey: ['reminder-sequences'],
    queryFn: async (): Promise<{ sequences: ReminderSequence[]; count: number }> => {
      const response = await apiClient.post<
        ApiResponse<{ sequences: ReminderSequence[]; count: number }>
      >('/finance/reminders/sequences', {})

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur récupération séquences')
      }

      return response.data.data
    },
    staleTime: 15 * 60 * 1000, // Cache 15 min (config stable)
  })
}

/**
 * Hook statistiques relances globales
 *
 * @returns Stats totales + par ton email
 */
export function useReminderStats() {
  return useQuery({
    queryKey: ['reminder-stats'],
    queryFn: async (): Promise<ReminderStats> => {
      const response = await apiClient.post<ApiResponse<ReminderStats>>(
        '/finance/reminders/stats',
        {}
      )

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur récupération stats')
      }

      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // Cache 10 min
  })
}
