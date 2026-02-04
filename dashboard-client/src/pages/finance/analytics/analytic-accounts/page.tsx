/**
 * Comptabilité Analytique - Centres de coûts et axes analytiques
 *
 * Fonctionnalités:
 * - Liste comptes analytiques (projets, départements, produits)
 * - Visualisation soldes par compte (débit, crédit, balance)
 * - Création nouveaux comptes analytiques
 * - Ventilation factures sur plusieurs axes
 * - Rapports analytiques agrégés
 * - Suivi budgets par centre de coût
 * - Multi-axes (plans analytiques)
 */
import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable, PageNotice } from '@/components/common'
import { Plus, TrendingUp, TrendingDown, BarChart3, RefreshCw, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { logger } from '@quelyos/logger'
import { financeNotices } from '@/lib/notices/finance-notices'

type AnalyticAccount = {
  id: number
  name: string
  code: string
  plan: {
    id: number | null
    name: string | null
  }
  group: {
    id: number | null
    name: string | null
  }
  partner: {
    id: number | null
    name: string | null
  }
  balance: number
  debit: number
  credit: number
  active: boolean
}

export default function AnalyticAccountsPage() {
  const [accounts, setAccounts] = useState<AnalyticAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterPlanId, setFilterPlanId] = useState<string>('all')

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {}
      if (filterPlanId !== 'all') {
        params.planId = parseInt(filterPlanId)
      }

      const response = await apiClient.get<{
        success: boolean
        data: { accounts: AnalyticAccount[]; total: number }
        error?: string
      }>('/finance/analytic/accounts', { params })

      if (response.data.success && response.data.data) {
        setAccounts(response.data.data.accounts)
      } else {
        setError(response.data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      logger.error('Erreur fetch analytic accounts:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [filterPlanId])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const getTotalStats = () => {
    const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0)
    const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0)
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    return { totalDebit, totalCredit, totalBalance }
  }

  const stats = getTotalStats()

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
            { label: 'Analytique', href: '/finance/analytics' },
            { label: 'Comptes Analytiques' },
          ]}
        />

        <PageNotice config={financeNotices.analyticAccounts} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Comptabilité Analytique
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Centres de coûts, projets, départements et axes analytiques
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={<BarChart3 />}
              onClick={() => window.location.href = '/finance/analytics/analytic-reports'}
            >
              Rapports
            </Button>
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={() => alert('TODO: Modal création compte analytique')}
            >
              Nouveau Compte
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Débit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalDebit, '€')}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Crédit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalCredit, '€')}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                stats.totalBalance >= 0
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-orange-100 dark:bg-orange-900/30'
              }`}>
                <BarChart3 className={`h-6 w-6 ${
                  stats.totalBalance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Solde Global</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalBalance, '€')}
                </p>
              </div>
            </div>
          </div>
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
                onClick={() => fetchAccounts()}
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
                      Compte
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Groupe
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Débit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Crédit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Solde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        Aucun compte analytique trouvé
                      </td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr
                        key={account.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                        onClick={() => window.location.href = `/finance/analytics/analytic-accounts/${account.id}`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {account.name}
                            </p>
                            {account.code && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{account.code}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {account.plan.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {account.group.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right font-medium">
                          {formatCurrency(account.debit, '€')}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                          {formatCurrency(account.credit, '€')}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-bold ${
                          account.balance >= 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {formatCurrency(account.balance, '€')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 text-right">
                      {formatCurrency(stats.totalDebit, '€')}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 text-right">
                      {formatCurrency(stats.totalCredit, '€')}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${
                      stats.totalBalance >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {formatCurrency(stats.totalBalance, '€')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Comptabilité Analytique
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <li>• <strong>Centres de coûts</strong> : Répartition des dépenses par département, projet ou activité</li>
            <li>• <strong>Axes analytiques</strong> : Multi-dimensionnel (ex: Produit × Région × Client)</li>
            <li>• <strong>Ventilation</strong> : Allocation automatique ou manuelle des factures sur les axes</li>
            <li>• <strong>Reporting</strong> : Analyse rentabilité par axe, comparaison budgets vs réel</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
