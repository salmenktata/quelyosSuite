/**
 * Approbations Factures - Workflow validation conditionnelle
 *
 * Fonctionnalités:
 * - Liste factures en attente validation user connecté
 * - Workflows conditionnels : montant, type, client à risque
 * - Actions : Approuver (+ validation auto) ou Rejeter (+ raison)
 * - Historique approbations
 * - Règles : Montant > 5K€ = Manager, Achats > 10K€ = CFO
 * - Notifications email/SMS approvers
 */
import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable, PageNotice } from '@/components/common'
import { CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logger } from '@quelyos/logger'
import { financeNotices } from '@/lib/notices/finance-notices'

type PendingApproval = {
  id: number
  name: string
  customer: {
    id: number | null
    name: string | null
  }
  amountTotal: number
  currency: string
  requestedBy: {
    id: number | null
    name: string | null
  }
  requestedDate: string | null
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<{
        success: boolean
        data: { approvals: PendingApproval[]; total: number }
        error?: string
      }>('/finance/approvals/pending')

      if (response.data.success && response.data.data) {
        setApprovals(response.data.data.approvals)
      } else {
        setError(response.data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      logger.error('Erreur fetch approvals:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const handleApprove = async (invoiceId: number, invoiceName: string) => {
    const comment = prompt(`Approuver facture ${invoiceName} ?\n\nCommentaire (optionnel) :`)
    if (comment === null) return // Annulé

    try {
      const response = await apiClient.post<{
        success: boolean
        message?: string
      }>(`/finance/invoices/${invoiceId}/approve`, {
        comment: comment || '',
      })

      if (response.data.success) {
        alert(response.data.message || 'Facture approuvée et validée')
        fetchApprovals()
      }
    } catch (err) {
      logger.error('Erreur approbation:', err)
      alert('Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (invoiceId: number, invoiceName: string) => {
    const reason = prompt(`Rejeter facture ${invoiceName} ?\n\nRaison du rejet (OBLIGATOIRE) :`)
    if (!reason || reason.trim() === '') {
      alert('Raison du rejet obligatoire')
      return
    }

    try {
      const response = await apiClient.post<{
        success: boolean
        message?: string
      }>(`/finance/invoices/${invoiceId}/reject`, {
        reason,
      })

      if (response.data.success) {
        alert(response.data.message || 'Facture rejetée')
        fetchApprovals()
      }
    } catch (err) {
      logger.error('Erreur rejet:', err)
      alert('Erreur lors du rejet')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <SkeletonTable rows={5} columns={5} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Approbations' },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Approbations Factures
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Factures en attente de votre validation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                  {approvals.length}
                </span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                En attente
              </p>
            </div>
            <Button
              variant="secondary"
              icon={<RefreshCw />}
              onClick={fetchApprovals}
            >
              Actualiser
            </Button>
          </div>
        </div>

        <PageNotice config={financeNotices.approvals} className="![animation:none]" />

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!error && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Facture
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Client
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Demandé par
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date Demande
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {approvals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <CheckCircle className="h-12 w-12 text-green-500" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Aucune facture en attente d&apos;approbation
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    approvals.map((approval) => (
                      <tr
                        key={approval.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {approval.name}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {approval.customer.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right">
                          <span className={`${
                            approval.amountTotal >= 5000
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {formatCurrency(approval.amountTotal, approval.currency)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {approval.requestedBy.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {approval.requestedDate ? formatDate(approval.requestedDate) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(approval.id, approval.name)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                              title="Approuver"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approuver
                            </button>
                            <button
                              onClick={() => handleReject(approval.id, approval.name)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                              title="Rejeter"
                            >
                              <XCircle className="h-4 w-4" />
                              Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Workflows */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Règles Workflows Approbation
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <li>• <strong>Montant ≥ 5000€</strong> : Validation Manager obligatoire</li>
            <li>• <strong>Achats ≥ 10000€</strong> : Validation CFO obligatoire</li>
            <li>• <strong>Client à risque élevé</strong> : Double validation Manager + CFO</li>
            <li>• <strong>Approbation</strong> : Valide automatiquement la facture</li>
            <li>• <strong>Rejet</strong> : Facture reste en brouillon, créateur notifié</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
