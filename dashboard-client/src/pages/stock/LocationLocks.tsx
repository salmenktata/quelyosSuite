/**
 * Page de gestion du verrouillage d'emplacements (OCA)
 * Module OCA: stock_location_lockdown
 *
 * Fonctionnalités :
 * - Liste des emplacements verrouillés avec état actuel
 * - Verrouillage/déverrouillage d'emplacements pour inventaire ou maintenance
 * - Bloque tous les mouvements de stock sur zones verrouillées
 * - Traçabilité complète des verrouillages
 */

import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Badge, SkeletonTable, PageNotice, Button } from '../../components/common'
import { useLocationLocks, useLockLocation } from '../../hooks/useStock'
import { stockNotices } from '@/lib/notices'
import { AlertCircle, Lock, Unlock, MapPin } from 'lucide-react'
import type { LocationLock } from '@/types/stock'
import { logger } from '@quelyos/logger'

export default function LocationLocks() {
  const { data, isLoading, error, refetch } = useLocationLocks()
  const { mutate: lockLocation, isPending: isLocking } = useLockLocation()
  const [processingId, setProcessingId] = useState<number | null>(null)

  const locks = data?.success ? data.data.locks : []
  const isModuleInstalled = data?.success !== false || data?.error_code !== 'MODULE_NOT_INSTALLED'

  const handleToggleLock = (locationId: number, currentLockState: boolean, locationName: string) => {
    const action = currentLockState ? 'déverrouiller' : 'verrouiller'
    if (!confirm(`Voulez-vous ${action} l'emplacement "${locationName}" ?`)) {
      return
    }

    setProcessingId(locationId)
    lockLocation(
      { locationId, lock: !currentLockState },
      {
        onSuccess: () => {
          refetch()
          setProcessingId(null)
          logger.info('[LocationLocks] Location lock toggled')
        },
        onError: (error: any) => {
          alert(error.message || `Erreur lors du ${action}`)
          setProcessingId(null)
        },
      }
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Verrouillage Emplacements' },
          ]}
        />

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Verrouillage Emplacements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Module OCA stock_location_lockdown - Bloquer les mouvements pendant inventaire
          </p>
        </div>

        <PageNotice config={stockNotices.locationLocks} className="mb-6" />

        {!isModuleInstalled && (
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Module OCA non installé</h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Le module OCA "stock_location_lockdown" n'est pas installé. Installez-le pour utiliser cette fonctionnalité.
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
              Erreur lors du chargement des verrouillages
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        ) : !isModuleInstalled ? null : (
          <>
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total: <span className="font-medium text-gray-900 dark:text-white">{locks.length}</span> emplacements verrouillés
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
                      Emplacement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Raison
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      État
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {locks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        Aucun emplacement verrouillé. Verrouillez des emplacements pour bloquer les mouvements pendant un inventaire.
                      </td>
                    </tr>
                  )}
                  {locks.map((lock: LocationLock) => (
                    <tr key={lock.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {lock.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {lock.location_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {lock.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {lock.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {lock.date_start ? new Date(lock.date_start).toLocaleDateString('fr-FR') : '-'}
                        {lock.date_end && (
                          <> → {new Date(lock.date_end).toLocaleDateString('fr-FR')}</>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {lock.is_locked ? (
                          <Badge variant="warning">
                            <Lock className="h-3 w-3 mr-1" />
                            Verrouillé
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <Unlock className="h-3 w-3 mr-1" />
                            Déverrouillé
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
