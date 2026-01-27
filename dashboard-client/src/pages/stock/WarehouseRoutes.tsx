/**
 * Page : Routes d'Entrepôt
 *
 * Configuration des routes stock (réception/livraison en 1, 2 ou 3 étapes)
 * et visualisation des règles push/pull.
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { useStockRoutes } from '@/hooks/useStockAdvanced'
import { StockRoute } from '@/types/stock'

export default function WarehouseRoutes() {
  const { data, isLoading, error } = useStockRoutes()
  const [selectedType, setSelectedType] = useState<'all' | 'warehouse' | 'global'>('all')

  const filteredRoutes =
    data?.routes.filter((route) => selectedType === 'all' || route.route_type === selectedType) ||
    []

  const getRouteTypeBadge = (type: 'warehouse' | 'global') => {
    return type === 'warehouse' ? (
      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Entrepôt
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        Globale
      </span>
    )
  }

  return (
    <Layout title="Routes d'Entrepôt">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Routes d'Entrepôt
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configuration des flux de réception et livraison
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 À propos des routes stock
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>
              <strong>Routes globales :</strong> Buy (Acheter), Make to Order (Fabriquer sur
              commande)
            </li>
            <li>
              <strong>Routes d'entrepôt :</strong> Réception (1-3 étapes), Livraison (1-3 étapes)
            </li>
            <li>
              <strong>Règles push :</strong> Déplacements automatiques (ex: Input → Stock)
            </li>
            <li>
              <strong>Règles pull :</strong> Approvisionnement à la demande
            </li>
          </ul>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setSelectedType('warehouse')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'warehouse'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Entrepôts
            </button>
            <button
              onClick={() => setSelectedType('global')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'global'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Globales
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Erreur : {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          </div>
        )}

        {/* Liste des routes */}
        {data && !isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Entrepôts
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Règles Push
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Règles Pull
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Sélectionnable
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {route.name}
                      </div>
                      {!route.active && (
                        <span className="text-xs text-gray-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getRouteTypeBadge(route.route_type)}</td>
                    <td className="px-6 py-4">
                      {route.warehouses.length > 0 ? (
                        <div className="space-y-1">
                          {route.warehouses.map((wh) => (
                            <div
                              key={wh.id}
                              className="text-sm text-gray-600 dark:text-gray-300"
                            >
                              {wh.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium">
                        {route.push_rules_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium">
                        {route.pull_rules_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        {route.sale_selectable && (
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                            Ventes
                          </span>
                        )}
                        {route.product_selectable && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                            Produits
                          </span>
                        )}
                        {!route.sale_selectable && !route.product_selectable && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredRoutes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune route trouvée pour ce filtre
                </p>
              </div>
            )}
          </div>
        )}

        {/* Statistiques */}
        {data && (
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{data.total}</strong> routes configurées au total
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
