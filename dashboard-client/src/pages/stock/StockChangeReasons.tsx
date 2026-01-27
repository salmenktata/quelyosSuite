/**
 * Page de gestion des raisons de changement de stock (OCA)
 * Module OCA: stock_change_qty_reason
 *
 * Fonctionnalités :
 * - Liste des raisons standardisées de changement de stock
 * - Traçabilité des motifs d'ajustement (casse, vol, péremption, inventaire)
 * - Analyse des pertes et démarque inconnue
 * - Configuration des raisons actives/inactives
 */

import { Layout } from '../../components/Layout'
import { Breadcrumbs, Badge, SkeletonTable, PageNotice, Button } from '../../components/common'
import { useStockChangeReasons } from '../../hooks/useStock'
import { stockNotices } from '@/lib/notices'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { StockChangeReason } from '@/types/stock'

export default function StockChangeReasons() {
  const { data, isLoading, error, refetch } = useStockChangeReasons()

  const reasons = data?.success ? data.data.reasons : []
  const isModuleInstalled = data?.success !== false || data?.error_code !== 'MODULE_NOT_INSTALLED'

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Raisons de Changement' },
          ]}
        />

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Raisons de Changement de Stock
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Module OCA stock_change_qty_reason - Traçabilité des ajustements
          </p>
        </div>

        <PageNotice config={stockNotices.changeReasons} className="mb-6" />

        {!isModuleInstalled && (
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Module OCA non installé</h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Le module OCA "stock_change_qty_reason" n'est pas installé. Installez-le pour utiliser cette fonctionnalité.
                </p>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">./scripts/install-oca-stock.sh</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} columns={3} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              Erreur lors du chargement des raisons de changement
            </p>
            <Button variant="secondary" onClick={() => refetch && refetch()}>
              Réessayer
            </Button>
          </div>
        ) : !isModuleInstalled ? null : (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilisations
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reasons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucune raison configurée. Créez-en depuis Configuration → Stock → Raisons de Changement.
                    </td>
                  </tr>
                )}
                {reasons.map((reason: StockChangeReason) => (
                  <tr key={reason.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {reason.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {reason.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {reason.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {reason.usage_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {reason.active ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Inactif</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
