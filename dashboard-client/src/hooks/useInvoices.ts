/**
 * Hook factures clients - Version TanStack Query optimisée
 *
 * Améliorations Phase 1 :
 * ✅ Migration TanStack Query (cache automatique)
 * ✅ Optimistic updates (UI réactive)
 * ✅ Sonner Toast (remplace alert())
 * ✅ Stats backend (totalOverdue calculé)
 * ✅ Invalidation granulaire
 *
 * @example
 * const { data: invoices, isLoading } = useInvoices({ status: 'posted' })
 * const validateMutation = useValidateInvoice()
 * validateMutation.mutate(123)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { tokenService } from '@/lib/tokenService'
import type { Invoice } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

export interface UseInvoicesParams {
  status?: string
  paymentState?: string
  dateFrom?: string
  dateTo?: string
  customerId?: number
  limit?: number
  offset?: number
}

interface InvoicesResponse {
  success: boolean
  data: {
    invoices: Invoice[]
    total: number
    limit: number
    offset: number
  }
  error?: string
}

interface ActionResponse {
  success: boolean
  data?: unknown
  error?: string
  message?: string
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Liste des factures avec filtres et pagination
 * Cache automatique 2 minutes, invalidation sur mutations
 */
export function useInvoices(params: UseInvoicesParams = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await apiClient.post<InvoicesResponse>('/finance/invoices', params)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement des factures')
      }

      return response.data.data
    },
    staleTime: 2 * 60 * 1000, // Cache 2 min
    gcTime: 5 * 60 * 1000, // Garbage collection 5 min
  })
}

/**
 * Détail d'une facture
 */
export function useInvoice(invoiceId: number) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await apiClient.post<InvoicesResponse>(`/finance/invoices/${invoiceId}`, {})

      if (!response.data.success) {
        throw new Error(response.data.error || 'Facture introuvable')
      }

      return response.data.data
    },
    enabled: !!invoiceId, // Ne lance query que si ID fourni
    staleTime: 1 * 60 * 1000, // 1 min (détail change plus souvent)
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Valider une facture (brouillon → validée)
 * Optimistic update + toast notifications
 */
export function useValidateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiClient.post<ActionResponse>(
        `/finance/invoices/${invoiceId}/validate`,
        {}
      )

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur validation')
      }

      return response.data
    },

    // Optimistic update : UI change avant confirmation serveur
    onMutate: async (invoiceId) => {
      const toastId = toast.loading('Validation en cours...', { id: `validate-${invoiceId}` })

      // Annuler queries en cours pour éviter écrasement
      await queryClient.cancelQueries({ queryKey: ['invoices'] })
      await queryClient.cancelQueries({ queryKey: ['invoice', invoiceId] })

      // Snapshot état actuel (pour rollback si erreur)
      const previousInvoices = queryClient.getQueryData(['invoices'])
      const previousInvoice = queryClient.getQueryData(['invoice', invoiceId])

      // Update optimiste : changer state immédiatement
      queryClient.setQueriesData<{ invoices: Invoice[] }>({ queryKey: ['invoices'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          invoices: old.invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, state: 'posted' } : inv
          ),
        }
      })

      return { previousInvoices, previousInvoice, toastId }
    },

    onSuccess: (_data, _invoiceId, context) => {
      toast.success('Facture validée avec succès', { id: context?.toastId })
    },

    onError: (error, _invoiceId, context) => {
      // Rollback optimistic update
      if (context?.previousInvoices) {
        queryClient.setQueryData(['invoices'], context.previousInvoices)
      }
      if (context?.previousInvoice) {
        queryClient.setQueryData(['invoice', _invoiceId], context.previousInvoice)
      }

      toast.error(`Erreur: ${error.message}`, { id: context?.toastId })
    },

    onSettled: (_data, _error, invoiceId) => {
      // Invalider cache pour forcer refresh (même si optimistic update)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] }) // Stats aussi !
    },
  })
}

/**
 * Envoyer facture par email
 */
export function useSendInvoiceEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiClient.post<ActionResponse>(
        `/finance/invoices/${invoiceId}/send-email`,
        {}
      )

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur envoi email')
      }

      return response.data
    },

    onMutate: (invoiceId) => {
      return toast.loading('Envoi email...', { id: `email-${invoiceId}` })
    },

    onSuccess: (_data, _invoiceId, toastId) => {
      toast.success('Email envoyé avec succès', { id: toastId })
    },

    onError: (error, _invoiceId, toastId) => {
      toast.error(`Erreur: ${error.message}`, { id: toastId })
    },

    onSettled: (_data, _error, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    },
  })
}

/**
 * Télécharger PDF facture
 */
export function useDownloadInvoicePDF() {
  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const toastId = toast.loading('Génération PDF...', { id: `pdf-${invoiceId}` })

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/finance/invoices/${invoiceId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${tokenService.getAccessToken() || ''}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Erreur téléchargement PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF téléchargé', { id: toastId })
      return { success: true }
    },

    onError: (error, invoiceId) => {
      toast.error(`Erreur: ${error.message}`, { id: `pdf-${invoiceId}` })
    },
  })
}

/**
 * Annuler une facture
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiClient.post<ActionResponse>(
        `/finance/invoices/${invoiceId}/cancel`,
        {}
      )

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur annulation')
      }

      return response.data
    },

    onMutate: (invoiceId) => {
      return toast.loading('Annulation...', { id: `cancel-${invoiceId}` })
    },

    onSuccess: (_data, _invoiceId, toastId) => {
      toast.success('Facture annulée', { id: toastId })
    },

    onError: (error, _invoiceId, toastId) => {
      toast.error(`Erreur: ${error.message}`, { id: toastId })
    },

    onSettled: (_data, _error, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
    },
  })
}

/**
 * Relance bulk emails (asynchrone)
 */
export function useBulkRemindInvoices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceIds: number[]) => {
      const response = await apiClient.post<ActionResponse>('/finance/invoices/bulk-remind', {
        invoiceIds,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur relances bulk')
      }

      return response.data
    },

    onMutate: () => {
      return toast.loading('Envoi relances en cours...', { id: 'bulk-remind', duration: 10000 })
    },

    onSuccess: (data, _variables, toastId) => {
      const message = data.message || 'Relances envoyées'
      toast.success(message, { id: toastId })
    },

    onError: (error, _variables, toastId) => {
      toast.error(`Erreur: ${error.message}`, { id: toastId })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formater montant avec devise
 */
export function formatAmount(amount: number, currency = '€'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === '€' ? 'EUR' : 'USD',
  }).format(amount)
}

/**
 * Calculer jours de retard
 */
export function calculateDaysOverdue(dueDate: string | Date): number {
  const due = new Date(dueDate)
  const today = new Date()
  const diff = today.getTime() - due.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}
