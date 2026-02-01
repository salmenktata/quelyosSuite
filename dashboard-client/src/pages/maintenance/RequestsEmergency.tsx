/**
 * Demandes Urgentes - GMAO
 *
 * Fonctionnalités :
 * - Liste filtrée des demandes urgentes uniquement
 * - Affichage prioritaire des interventions critiques
 * - Création rapide nouvelle demande urgente
 * - Impact temps d'arrêt visible
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices'
import { Bell, AlertCircle, RefreshCw, Plus, Clock, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests'

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  '0': { label: 'Très faible', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  '1': { label: 'Faible', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  '2': { label: 'Normale', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '3': { label: 'Haute', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const DOWNTIME_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: 'Aucun', color: 'text-gray-600 dark:text-gray-400' },
  low: { label: 'Faible', color: 'text-blue-600 dark:text-blue-400' },
  medium: { label: 'Moyen', color: 'text-yellow-600 dark:text-yellow-400' },
  high: { label: 'Élevé', color: 'text-orange-600 dark:text-orange-400' },
  critical: { label: 'Critique', color: 'text-red-600 dark:text-red-400' },
}

export default function RequestsEmergency() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMaintenanceRequests()

  // Filtrer uniquement les demandes urgentes
  const requests = (data?.data || []).filter((r) => r.is_emergency)

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
            { label: 'Urgences' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-red-600 dark:text-red-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Interventions Urgentes
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {requests.length} demande{requests.length > 1 ? 's' : ''} urgente{requests.length > 1 ? 's' : ''} en cours
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/maintenance/requests/new')}
          >
            Nouvelle Demande
          </Button>
        </div>

        <PageNotice config={maintenanceNotices.requestsEmergency} className="mb-2" />

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

        {/* Table Urgences */}
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Bell className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucune urgence en cours
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Toutes les interventions urgentes sont résolues.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/maintenance/requests')}
            >
              Voir toutes les demandes
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-3 border-b border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                ⚠️ Ces demandes nécessitent une intervention immédiate
              </p>
            </div>
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
                      Impact Arrêt
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
                      className="hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
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
                        <span className={`text-sm font-medium ${DOWNTIME_LABELS[request.downtime_impact].color}`}>
                          {DOWNTIME_LABELS[request.downtime_impact].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_LABELS[request.priority].color}`}>
                          {PRIORITY_LABELS[request.priority].label}
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
