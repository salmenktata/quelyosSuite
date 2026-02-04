/**
 * Hooks Rapprochement Bancaire Automatique
 *
 * Hooks TanStack Query pour consommer API réconciliation bancaire
 *
 * Endpoints backend :
 * - POST /api/finance/bank/transactions : Liste transactions à réconcilier
 * - POST /api/finance/bank/match-auto : Matching automatique
 * - POST /api/finance/bank/match-manual : Réconciliation manuelle
 * - POST /api/finance/bank/connections : Connexions bancaires
 * - POST /api/finance/bank/stats : Statistiques globales
 *
 * @example
 * const { data } = useBankTransactions({ state: 'pending' })
 * const matchAuto = useMatchAutomatically()
 * matchAuto.mutate({ transactionIds: [1, 2, 3] })
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

// Types
interface BankTransaction {
  id: number
  transaction_date: string // ISO date
  value_date: string | null
  label: string
  label_normalized: string
  amount: number
  currency: string
  transaction_type: 'debit' | 'credit'
  category: 'customer_payment' | 'supplier_payment' | 'fee' | 'transfer' | 'tax' | 'salary' | 'other'
  state: 'pending' | 'matched' | 'manual' | 'split' | 'excluded'
  source_type: 'stripe' | 'paypal' | 'open_banking' | 'manual'
  bank_account: string | null
  matched_invoice_id: number | null
  matched_invoice_name: string | null
  matching_confidence: number | null
}

interface BankConnection {
  id: number
  name: string
  provider: 'stripe' | 'paypal' | 'bridge' | 'powens' | 'bankin'
  state: 'draft' | 'active' | 'error' | 'disabled'
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'manual'
  auto_reconcile: boolean
  last_sync: string | null
  last_error: string | null
  total_transactions: number
  total_matched: number
  bank_account: string | null
}

interface BankStats {
  total_transactions: number
  pending: number
  matched_auto: number
  matched_manual: number
  excluded: number
  success_rate: number
  avg_confidence: number
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
 * Hook liste transactions bancaires
 */
export function useBankTransactions(params: {
  state?: 'pending' | 'matched' | 'manual' | 'split' | 'excluded'
  dateFrom?: string
  dateTo?: string
  bankAccountId?: number
  limit?: number
  offset?: number
} = {}) {
  return useQuery({
    queryKey: ['bank-transactions', params],
    queryFn: async () => {
      const response = await apiClient.post<
        ApiResponse<{
          transactions: BankTransaction[]
          count: number
          stats: { pending: number; matched: number; manual: number }
        }>
      >('/finance/bank/transactions', {
        state: params.state,
        date_from: params.dateFrom,
        date_to: params.dateTo,
        bank_account_id: params.bankAccountId,
        limit: params.limit || 50,
        offset: params.offset || 0,
      })

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur récupération transactions')
      }

      return response.data.data
    },
    staleTime: 2 * 60 * 1000, // Cache 2 min
  })
}

/**
 * Hook matching automatique
 */
export function useMatchAutomatically() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { transactionIds: number[] }) => {
      const response = await apiClient.post<
        ApiResponse<{
          total: number
          matched: number
          unmatched: number
          results: Array<{
            transaction_id: number
            matched: boolean
            invoice_id?: number
            invoice_name?: string
            confidence?: number
            message?: string
          }>
        }>
      >('/finance/bank/match-auto', {
        transaction_ids: data.transactionIds,
      })

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur matching automatique')
      }

      return response.data.data
    },
    onMutate: () => {
      toast.loading('Réconciliation automatique...', { id: 'match-auto' })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
      toast.success(
        `${data.matched}/${data.total} transactions réconciliées automatiquement`,
        { id: 'match-auto' }
      )
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur matching', {
        id: 'match-auto',
      })
    },
  })
}

/**
 * Hook matching manuel
 */
export function useMatchManually() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { transactionId: number; invoiceId: number }) => {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        '/finance/bank/match-manual',
        {
          transaction_id: data.transactionId,
          invoice_id: data.invoiceId,
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur réconciliation manuelle')
      }

      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
      toast.success(data.message)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur réconciliation')
    },
  })
}

/**
 * Hook connexions bancaires
 */
export function useBankConnections() {
  return useQuery({
    queryKey: ['bank-connections'],
    queryFn: async () => {
      const response = await apiClient.post<
        ApiResponse<{ connections: BankConnection[]; count: number }>
      >('/finance/bank/connections', {})

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur récupération connexions')
      }

      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  })
}

/**
 * Hook statistiques réconciliation
 */
export function useBankReconciliationStats() {
  return useQuery({
    queryKey: ['bank-reconciliation-stats'],
    queryFn: async () => {
      const response = await apiClient.post<ApiResponse<BankStats>>(
        '/finance/bank/stats',
        {}
      )

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Erreur récupération stats')
      }

      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  })
}
