/**
 * Hooks Cash Flow Forecasting & DSO
 *
 * Hooks TanStack Query pour consommer API prédiction trésorerie ML + DSO
 *
 * Endpoints backend :
 * - POST /api/finance/cash-flow/predict : Prédiction 30/60/90j avec breakdown semaines
 * - POST /api/finance/dso/calculate : Calcul Days Sales Outstanding (DSO)
 * - POST /api/finance/cash-flow/history : Historique prédictions vs réalité
 *
 * @example
 * const { data, isLoading } = useCashFlowForecast({ horizonDays: 90 })
 * const { data: dso } = useDSO()
 * const { data: history } = useCashFlowHistory({ limit: 10 })
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// Types
interface CashFlowPrediction {
  id: number
  predicted_inflow: number
  predicted_outflow: number
  predicted_balance: number
  confidence_score: number
  weeks: Array<{
    week_start: string // ISO date
    predicted_inflow: number
    predicted_outflow: number
    predicted_balance: number
    is_at_risk: boolean
  }>
}

interface DSOData {
  dso: number // Days
  receivables: number
  revenue: number
  period_days: number
  benchmark: {
    industry_avg: number
    status: 'good' | 'warning' | 'critical'
  }
}

interface ForecastHistory {
  forecasts: Array<{
    id: number
    date: string // ISO date
    horizon_days: number
    predicted_balance: number
    actual_balance: number | null
    accuracy: number | null
    confidence_score: number
  }>
  avg_accuracy: number
  count: number
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
 * Hook prédiction cash flow ML (30/60/90 jours)
 *
 * @param params.horizonDays - Horizon prédiction (30, 60 ou 90 jours)
 * @returns Prédiction inflow/outflow/balance + breakdown hebdomadaire
 */
export function useCashFlowForecast(params: { horizonDays?: 30 | 60 | 90 } = {}) {
  const horizonDays = params.horizonDays || 30

  return useQuery({
    queryKey: ['cash-flow-forecast', horizonDays],
    queryFn: async (): Promise<CashFlowPrediction> => {
      const response = await apiClient.post<ApiResponse<CashFlowPrediction>>(
        '/finance/cash-flow/predict',
        { horizon_days: horizonDays }
      )

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur prédiction cash flow')
      }

      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min (prédictions ML coûteuses)
    enabled: [30, 60, 90].includes(horizonDays),
  })
}

/**
 * Hook calcul DSO (Days Sales Outstanding)
 *
 * DSO = (Créances clients / CA) × Nb jours période
 *
 * @param params.partnerId - ID client spécifique (optionnel, sinon global)
 * @returns DSO + créances + CA + benchmark industrie
 */
export function useDSO(params: { partnerId?: number } = {}) {
  return useQuery({
    queryKey: ['dso', params.partnerId],
    queryFn: async (): Promise<DSOData> => {
      const response = await apiClient.post<ApiResponse<DSOData>>(
        '/finance/dso/calculate',
        params.partnerId ? { partner_id: params.partnerId } : {}
      )

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur calcul DSO')
      }

      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // Cache 10 min (calcul comptable)
  })
}

/**
 * Hook historique prédictions cash flow (pour tracking précision)
 *
 * @param params.limit - Nombre de prédictions à récupérer (défaut : 10)
 * @returns Liste prédictions avec précision mesurée
 */
export function useCashFlowHistory(params: { limit?: number } = {}) {
  const limit = params.limit || 10

  return useQuery({
    queryKey: ['cash-flow-history', limit],
    queryFn: async (): Promise<ForecastHistory> => {
      const response = await apiClient.post<ApiResponse<ForecastHistory>>(
        '/finance/cash-flow/history',
        { limit }
      )

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur récupération historique')
      }

      return response.data.data
    },
    staleTime: 15 * 60 * 1000, // Cache 15 min (historique stable)
  })
}
