/**
 * Page de gestion des raisons de changement de stock (OCA)
 * Module OCA: stock_change_qty_reason
 */

import { Layout } from '../../components/Layout'
import { Breadcrumbs, Badge } from '../../components/common'
import { useStockChangeReasons } from '../../hooks/useStock'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { StockChangeReason } from '@/types/stock'

export default function StockChangeReasons() {
  const { data, isLoading, error } = useStockChangeReasons()

  // Debug logs
  console.log('[StockChangeReasons] data:', data)
  console.log('[StockChangeReasons] isLoading:', isLoading)
  console.log('[StockChangeReasons] error:', error)

  const reasons = data?.success ? data.data.reasons : []
  const isModuleInstalled = data?.success !== false || data?.error_code !== 'MODULE_NOT_INSTALLED'

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Stock', href: '/stock' },
            { label: 'Raisons de Changement', href: '/stock/change-reasons' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Raisons de Changement de Stock</h1>
            <p className="mt-1 text-sm text-gray-500">
              Module OCA stock_change_qty_reason
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
                  Le module OCA "stock_change_qty_reason" n'est pas installé. Installez-le pour utiliser cette fonctionnalité.
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
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reasons.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                      Aucune raison configurée. Créez-en depuis Configuration → Stock → Raisons de Changement.
                    </td>
                  </tr>
                )}
                {reasons.map((reason: StockChangeReason) => (
                  <tr key={reason.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reason.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reason.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reason.active ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && isModuleInstalled && reasons.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Astuce :</strong> Utilisez ces raisons lors des ajustements de stock pour suivre les causes des variations
              (casse, vol, erreur d'inventaire, etc.).
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
