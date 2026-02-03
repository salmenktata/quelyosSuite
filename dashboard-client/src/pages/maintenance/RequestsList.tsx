/**
 * Liste Demandes d'Intervention - GMAO
 *
 * Fonctionnalités :
 * - Liste complète des demandes de maintenance
 * - Filtrage par type (corrective/préventive) et statut
 * - Visualisation priorité, coût et durée
 * - Création nouvelle demande
 * - Accès détail demande
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices/maintenance-notices'
import { Plus, ClipboardList, AlertCircle, RefreshCw, Bell, Clock, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests'
import { useState } from 'react'

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  '0': { label: 'Très faible', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  '1': { label: 'Faible', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  '2': { label: 'Normale', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '3': { label: 'Haute', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default function RequestsList() {
  const navigate = useNavigate()
  const [maintenanceType, setMaintenanceType] = useState<'corrective' | 'preventive' | undefined>()
  const { data, isLoading, isError, refetch } = useMaintenanceRequests({
    maintenance_type: maintenanceType,
  })

  const requests = data?.data || []

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={10} columns={6} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'GMAO', href: '/maintenance' },
            { label: 'Demandes' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Demandes d'Intervention
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez les interventions de maintenance
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/maintenance/requests/new')}
          >
            Nouvelle Demande
          </Button>
        </div>

        <PageNotice config={maintenanceNotices.requests} className="mb-2" />

        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des demandes.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Type :
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMaintenanceType(undefined)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  maintenanceType === undefined
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setMaintenanceType('corrective')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  maintenanceType === 'corrective'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Correctives
              </button>
              <button
                onClick={() => setMaintenanceType('preventive')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  maintenanceType === 'preventive'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Préventives
              </button>
            </div>
          </div>
        </div>

        {/* Table Demandes */}
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucune demande
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Commencez par créer votre première demande d'intervention.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/maintenance/requests/new')}
            >
              Créer une Demande
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Demande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Équipement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Durée (h)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Coût
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {request.is_emergency && (
                            <Bell className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {request.equipment_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.maintenance_type === 'preventive'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}
                        >
                          {request.maintenance_type === 'preventive' ? 'Préventive' : 'Corrective'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_LABELS[request.priority]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {PRIORITY_LABELS[request.priority]?.label || request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {request.stage_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {request.actual_duration_hours.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          {request.total_cost.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
