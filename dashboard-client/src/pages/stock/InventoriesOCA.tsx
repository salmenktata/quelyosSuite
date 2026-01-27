/**
 * Page de gestion des inventaires OCA
 * Module OCA: stock_inventory
 *
 * Fonctionnalités :
 * - Liste des inventaires physiques avec état (brouillon, en cours, validé)
 * - Inventaires par lots, validation multi-niveaux, historique détaillé
 * - Inventaires tournants pour contrôle continu du stock
 * - Validation avec recomptage des écarts importants
 */

import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Badge, SkeletonTable, PageNotice, Button } from '../../components/common'
import { useStockInventoriesOCA } from '../../hooks/useStock'
import { stockNotices } from '@/lib/notices'
import { AlertCircle, Calendar, MapPin } from 'lucide-react'
import type { StockInventoryOCA } from '@/types/stock'

export default function InventoriesOCA() {
  const [limit] = useState(20)
  const [offset] = useState(0)

  const { data, isLoading, error, refetch } = useStockInventoriesOCA({ limit, offset })

  const inventories = data?.success ? data.data.inventories : []
  const total = data?.success ? data.data.total : 0
  const isModuleInstalled = data?.success !== false || data?.error_code !== 'MODULE_NOT_INSTALLED'

  const getStateBadge = (state: string) => {
    const stateMap: Record<string, { variant: 'neutral' | 'warning' | 'success', label: string }> = {
      draft: { variant: 'neutral', label: 'Brouillon' },
      in_progress: { variant: 'warning', label: 'En cours' },
      done: { variant: 'success', label: 'Terminé' },
      cancelled: { variant: 'neutral', label: 'Annulé' },
    }
    return stateMap[state] || { variant: 'neutral', label: state }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Inventaires OCA' },
          ]}
        />

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Inventaires OCA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Module OCA stock_inventory - Gestion améliorée des inventaires
          </p>
        </div>

        <PageNotice config={stockNotices.inventoriesOCA} className="mb-6" />

        {!isModuleInstalled && (
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Module OCA non installé</h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Le module OCA "stock_inventory" n'est pas installé. Installez-le pour utiliser cette fonctionnalité.
                </p>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">./scripts/install-oca-stock.sh</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              Erreur lors du chargement des inventaires
            </p>
            <Button variant="secondary" onClick={() => refetch && refetch()}>
              Réessayer
            </Button>
          </div>
        ) : !isModuleInstalled ? null : (
          <>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total: <span className="font-medium text-gray-900 dark:text-white">{total}</span> inventaires
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Emplacement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lignes
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      État
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {inventories.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        Aucun inventaire. Créez-en depuis Stock → Inventaires.
                      </td>
                    </tr>
                  )}
                  {inventories.map((inventory: StockInventoryOCA) => {
                    const stateBadge = getStateBadge(inventory.state)
                    return (
                      <tr key={inventory.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {inventory.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {inventory.date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(inventory.date).toLocaleDateString('fr-FR')}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {inventory.location_name ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {inventory.location_name}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {inventory.user_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                          {inventory.line_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
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
      </div>
    </Layout>
  )
}
