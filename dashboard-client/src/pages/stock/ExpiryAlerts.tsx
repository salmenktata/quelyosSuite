/**
 * Page : Alertes d'Expiration
 *
 * Affiche les lots/numéros de série avec dates d'expiration proches ou dépassées.
 * Groupement par statut : Expiré, À retirer, Alerte, Bientôt
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { useExpiryAlerts } from '@/hooks/useStockAdvanced'
import { ExpiryAlertsParams, ExpiryStatus } from '@/types/stock'
import { formatDate } from '@/lib/format'

export default function ExpiryAlerts() {
  const [params, setParams] = useState<ExpiryAlertsParams>({
    days_threshold: 30,
    status_filter: 'all',
    has_stock_only: true,
    limit: 100,
  })

  const { data, isLoading, error } = useExpiryAlerts(params)

  const getStatusBadge = (status: ExpiryStatus) => {
    const styles = {
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      removal: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      alert: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      ok: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }

    const labels = {
      expired: 'Expiré',
      removal: 'À retirer',
      alert: 'Alerte',
      ok: 'OK',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <Layout title="Alertes d'Expiration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Alertes d'Expiration
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Lots et numéros de série proches de l'expiration
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seuil d'alerte (jours)
              </label>
              <input
                type="number"
                value={params.days_threshold}
                onChange={(e) =>
                  setParams({ ...params, days_threshold: parseInt(e.target.value) || 30 })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={1}
                max={365}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrer par statut
              </label>
              <select
                value={params.status_filter}
                onChange={(e) =>
                  setParams({
                    ...params,
                    status_filter: e.target.value as 'alert' | 'removal' | 'expired' | 'all',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous</option>
                <option value="expired">Expirés uniquement</option>
                <option value="removal">À retirer uniquement</option>
                <option value="alert">Alertes uniquement</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={params.has_stock_only}
                  onChange={(e) =>
                    setParams({ ...params, has_stock_only: e.target.checked })
                  }
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Uniquement avec stock
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Expirés</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                {data.stats.expired_count}
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                À retirer
              </p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                {data.stats.removal_count}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Alertes</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                {data.stats.alert_count}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Bientôt (≤ {data.days_threshold}j)
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {data.stats.ok_but_soon_count}
              </p>
            </div>
          </div>
        )}

        {/* Listes par statut */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Erreur : {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-6">
            {/* Expirés */}
            {data.alerts.expired.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-3">
                  🚨 Expirés ({data.alerts.expired.length})
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Lot
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Date expiration
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Jours dépassés
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.alerts.expired.map((lot) => (
                        <tr key={lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {lot.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.product_name}
                            {lot.product_sku && (
                              <span className="text-gray-400 ml-2">({lot.product_sku})</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {lot.stock_qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.expiration_date ? formatDate(lot.expiration_date) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {Math.abs(lot.days_until_expiry)} jours
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* À retirer */}
            {data.alerts.removal.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-orange-700 dark:text-orange-300 mb-3">
                  ⚠️ À retirer du stock ({data.alerts.removal.length})
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Lot
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Date expiration
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Jours restants
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.alerts.removal.map((lot) => (
                        <tr key={lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {lot.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {lot.stock_qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.expiration_date ? formatDate(lot.expiration_date) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              {lot.days_until_expiry} jours
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Alertes */}
            {data.alerts.alert.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 mb-3">
                  🔔 Alertes actives ({data.alerts.alert.length})
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Lot
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Date expiration
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Jours restants
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.alerts.alert.map((lot) => (
                        <tr key={lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {lot.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {lot.stock_qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.expiration_date ? formatDate(lot.expiration_date) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-yellow-600 dark:text-yellow-400 font-medium">
                            {lot.days_until_expiry} jours
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(lot.expiry_status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OK mais bientôt */}
            {data.alerts.ok_but_soon.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
                  📅 À surveiller (≤ {data.days_threshold} jours) ({data.alerts.ok_but_soon.length}
                  )
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Lot
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Date expiration
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Jours restants
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.alerts.ok_but_soon.map((lot) => (
                        <tr key={lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {lot.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {lot.stock_qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {lot.expiration_date ? formatDate(lot.expiration_date) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400 font-medium">
                            {lot.days_until_expiry} jours
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Aucune alerte */}
            {data.stats.total === 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
                <p className="text-green-800 dark:text-green-200 text-lg font-medium">
                  ✅ Aucune alerte d'expiration
                </p>
                <p className="text-green-600 dark:text-green-300 mt-2">
                  Tous les lots sont conformes aux délais de péremption
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
