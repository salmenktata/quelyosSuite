/**
 * Widget Rapprochement Bancaire
 *
 * Affiche statistiques réconciliation :
 * - Transactions à réconcilier
 * - Taux succès automatique
 * - Confiance moyenne matching
 * - Action rapide : lancer matching auto
 */

import { useBankReconciliationStats, useMatchAutomatically } from '@/hooks/useBankReconciliation'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BankReconciliationWidget() {
  const { data: stats, isLoading, error } = useBankReconciliationStats()
  const matchAuto = useMatchAutomatically()

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              Erreur chargement stats
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const successRate = stats.success_rate || 0
  const pendingCount = stats.pending || 0

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Rapprochement Bancaire
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stats.total_transactions} transactions importées
            </p>
          </div>
          <Link
            to="/finance/bank-reconciliation"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Gérer
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">À réconcilier</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {successRate.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taux succès</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.avg_confidence.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Confiance moy.</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {pendingCount} transaction{pendingCount > 1 ? 's' : ''} en attente
                </p>
              </div>
              <button
                onClick={() => {
                  // TODO: Récupérer IDs transactions pending
                  toast.info('Fonctionnalité en cours de développement')
                }}
                disabled={matchAuto.isPending}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${matchAuto.isPending ? 'animate-spin' : ''}`}
                />
                <span>Réconcilier auto</span>
              </button>
            </div>
          </div>
        )}

        {pendingCount === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Toutes les transactions sont réconciliées
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Auto : </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.matched_auto}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Manuel : </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.matched_manual}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Exclus : </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.excluded}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
