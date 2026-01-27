/**
 * Page de gestion des inventaires OCA
 * Module OCA: stock_inventory
 */

import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Badge } from '../../components/common'
import { useStockInventoriesOCA } from '../../hooks/useStock'
import { AlertCircle, Calendar, MapPin } from 'lucide-react'
import type { StockInventoryOCA } from '@/types/stock'

export default function InventoriesOCA() {
  const [limit] = useState(20)
  const [offset] = useState(0)

  const { data, isLoading, error } = useStockInventoriesOCA({ limit, offset })

  const inventories = data?.success ? data.data.inventories : []
  const total = data?.success ? data.data.total : 0
  const isModuleInstalled = data?.success !== false || data?.error_code !== 'MODULE_NOT_INSTALLED'

  const getStateBadge = (state: string) => {
    const stateMap: Record<string, { variant: 'secondary' | 'warning' | 'success', label: string }> = {
      draft: { variant: 'secondary', label: 'Brouillon' },
      confirm: { variant: 'warning', label: 'En cours' },
      done: { variant: 'success', label: 'Validé' },
    }
    return stateMap[state] || { variant: 'secondary', label: state }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Stock', href: '/stock' },
            { label: 'Inventaires OCA', href: '/stock/inventories-oca' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventaires OCA</h1>
            <p className="mt-1 text-sm text-gray-500">
              Module OCA stock_inventory - Gestion améliorée des inventaires
            </p>
          </div>
        </div>

        {!isModuleInstalled && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Module OCA non installé</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Le module OCA "stock_inventory" n'est pas installé. Installez-le pour utiliser cette fonctionnalité.
                </p>
                <p className="mt-2 text-sm text-yellow-700">
                  <code className="bg-yellow-100 px-2 py-1 rounded">./scripts/install-oca-stock.sh</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">Erreur: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && isModuleInstalled && (
          <>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Total: <span className="font-medium text-gray-900">{total}</span> inventaires
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emplacement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      État
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                        Aucun inventaire. Créez-en depuis Stock → Inventaires.
                      </td>
                    </tr>
                  )}
                  {inventories.map((inventory: StockInventoryOCA) => {
                    const stateBadge = getStateBadge(inventory.state)
                    return (
                      <tr key={inventory.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {inventory.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inventory.date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(inventory.date).toLocaleDateString('fr-FR')}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inventory.location_name ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {inventory.location_name}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={stateBadge.variant}>{stateBadge.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!isLoading && !error && isModuleInstalled && inventories.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Astuce :</strong> Le module OCA stock_inventory restaure les fonctionnalités d'inventaire
              groupé, permettant de compter plusieurs produits simultanément.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
