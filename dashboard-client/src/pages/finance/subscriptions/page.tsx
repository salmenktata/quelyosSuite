/**
 * Gestion Abonnements Récurrents - Facturation automatique périodique
 *
 * Fonctionnalités:
 * - Liste abonnements clients actifs/inactifs
 * - Statuts : actif, en attente, fermé, annulé
 * - Prochaines dates de renouvellement
 * - Montants récurrents (mensuel, annuel, etc.)
 * - Actions : Voir détail, Annuler, Renouveler maintenant
 * - Création nouvel abonnement
 * - Historique factures générées par abonnement
 */
import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable, PageNotice } from '@/components/common'
import { Plus, Calendar, DollarSign, RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logger } from '@quelyos/logger'
import { financeNotices } from '@/lib/notices/finance-notices'

type Subscription = {
  id: number
  name: string
  code: string
  customer: {
    id: number
    name: string
    email?: string
  }
  startDate: string
  endDate?: string
  nextRenewal?: string
  recurringInterval: number
  recurringRule: 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurringAmount: number
  status: string
  stageName: string
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {}
      if (filterStatus !== 'all') {
        params.status = filterStatus
      }

      const response = await apiClient.get<{
        success: boolean
        data: { subscriptions: Subscription[]; total: number }
        error?: string
      }>('/finance/subscriptions', { params })

      if (response.data.success && response.data.data) {
        setSubscriptions(response.data.data.subscriptions)
      } else {
        setError(response.data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      logger.error('Erreur fetch subscriptions:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const handleCancel = async (subscriptionId: number, subscriptionName: string) => {
    if (!confirm(`Annuler l'abonnement ${subscriptionName} ?\n\nCela stoppera la facturation automatique future.`)) {
      return
    }

    try {
      const response = await apiClient.post<{
        success: boolean
        message?: string
      }>(`/finance/subscriptions/${subscriptionId}/cancel`)

      if (response.data.success) {
        alert(response.data.message || 'Abonnement annulé')
        fetchSubscriptions()
      }
    } catch (err) {
      logger.error('Erreur annulation:', err)
      alert('Erreur lors de l\'annulation')
    }
  }

  const handleRenewNow = async (subscriptionId: number, subscriptionName: string) => {
    if (!confirm(`Renouveler immédiatement ${subscriptionName} ?\n\nUne facture sera générée maintenant.`)) {
      return
    }

    try {
      const response = await apiClient.post<{
        success: boolean
        data?: { invoice: { id: number; name: string } }
        message?: string
      }>(`/finance/subscriptions/${subscriptionId}/renew-now`)

      if (response.data.success && response.data.data) {
        alert(`${response.data.message}\n\nFacture ${response.data.data.invoice.name} créée`)
        fetchSubscriptions()
      }
    } catch (err) {
      logger.error('Erreur renouvellement:', err)
      alert('Erreur lors du renouvellement')
    }
  }

  const getStatusBadge = (status: string, stageName: string) => {
    if (status === 'progress') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="h-3 w-3" />
          Actif
        </span>
      )
    }
    if (status === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
          <X className="h-3 w-3" />
          Fermé
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
        {stageName}
      </span>
    )
  }

  const getRecurrenceLabel = (rule: string, interval: number) => {
    const labels = {
      daily: 'jour',
      weekly: 'semaine',
      monthly: 'mois',
      yearly: 'an',
    }
    const label = labels[rule as keyof typeof labels] || rule
    return interval === 1 ? `Chaque ${label}` : `Tous les ${interval} ${label}s`
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <SkeletonTable rows={8} columns={6} />
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
            { label: 'Abonnements' },
          ]}
        />

        <PageNotice config={financeNotices.subscriptions} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Abonnements Récurrents
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gestion des abonnements clients avec facturation automatique
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus />}
            onClick={() => window.location.href = '/invoicing/subscriptions/new'}
          >
            Nouvel Abonnement
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          {['all', 'active', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' && 'Tous'}
              {status === 'active' && 'Actifs'}
              {status === 'closed' && 'Fermés'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => fetchSubscriptions()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
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
                      Abonnement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Récurrence
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Prochain Renouvellement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        Aucun abonnement trouvé
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                        onClick={() => window.location.href = `/finance/subscriptions/${sub.id}`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {sub.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{sub.code}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">{sub.customer.name}</p>
                            {sub.customer.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{sub.customer.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {getRecurrenceLabel(sub.recurringRule, sub.recurringInterval)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                          {formatCurrency(sub.recurringAmount, '€')}
                        </td>
                        <td className="px-4 py-3">
                          {sub.nextRenewal ? (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(sub.nextRenewal)}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(sub.status, sub.stageName)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {sub.status === 'progress' && (
                              <>
                                <button
                                  onClick={() => handleRenewNow(sub.id, sub.name)}
                                  className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                                  title="Renouveler maintenant"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancel(sub.id, sub.name)}
                                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  title="Annuler"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
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

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                Facturation Automatique
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-400">
                Les abonnements actifs génèrent automatiquement des factures à chaque échéance (cron quotidien).
                Vous pouvez aussi renouveler manuellement avec le bouton "Renouveler maintenant".
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
