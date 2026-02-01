/**
 * Planning Maintenance - GMAO
 *
 * Fonctionnalités :
 * - Vue calendrier des interventions planifiées
 * - Filtrage par type de maintenance
 * - Liste chronologique des demandes avec date planifiée
 * - Création nouvelle intervention
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices/maintenance-notices'
import { Calendar as CalendarIcon, Plus, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests'
import { useMemo } from 'react'

export default function Calendar() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMaintenanceRequests()

  // Filtrer et trier par date planifiée
  const scheduledRequests = useMemo(() => {
    const requests = data?.data || []
    return requests
      .filter((r) => r.schedule_date)
      .sort((a, b) => {
        if (!a.schedule_date || !b.schedule_date) return 0
        return new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime()
      })
  }, [data])

  // Grouper par date
  const requestsByDate = useMemo(() => {
    const grouped: Record<string, typeof scheduledRequests> = {}
    scheduledRequests.forEach((request) => {
      if (!request.schedule_date) return
      const dateKey = new Date(request.schedule_date).toLocaleDateString('fr-FR')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(request)
    })
    return grouped
  }, [scheduledRequests])

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={10} columns={3} />
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
            { label: 'Planning' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Planning Maintenance
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {scheduledRequests.length} intervention{scheduledRequests.length > 1 ? 's' : ''} planifiée{scheduledRequests.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/maintenance/requests/new')}
          >
            Planifier Intervention
          </Button>
        </div>

        <PageNotice config={maintenanceNotices.calendar} className="mb-2" />

        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des interventions.
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

        {/* Planning */}
        {scheduledRequests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucune intervention planifiée
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Planifiez votre première intervention de maintenance.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/maintenance/requests/new')}
            >
              Planifier Intervention
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(requestsByDate).map(([date, requests]) => (
              <div
                key={date}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-3 border-b border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {date} - {requests.length} intervention{requests.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/maintenance/requests/${request.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {request.name}
                            </p>
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                request.maintenance_type === 'preventive'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              }`}
                            >
                              {request.maintenance_type === 'preventive' ? 'Préventive' : 'Corrective'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{request.equipment_name}</span>
                            <span>•</span>
                            <span>{request.stage_name}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {request.actual_duration_hours.toFixed(1)}h
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
