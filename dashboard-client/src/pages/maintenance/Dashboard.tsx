/**
 * Dashboard GMAO - Vue d'ensemble Maintenance
 *
 * Fonctionnalités :
 * - KPI globaux : MTBF, MTTR, taux uptime
 * - Statistiques équipements (total, critiques)
 * - Statistiques demandes (total, en cours, urgences)
 * - Navigation rapide vers équipements et demandes
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices/maintenance-notices'
import { Wrench, AlertCircle, RefreshCw, Clock, TrendingUp, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMaintenanceDashboard } from '@/hooks/useMaintenanceDashboard'

export default function MaintenanceDashboard() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMaintenanceDashboard()

  const kpi = data?.data

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={4} />
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
            { label: 'GMAO' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tableau de bord GMAO
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Vue d'ensemble de la gestion de maintenance
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Wrench className="w-4 h-4" />}
            onClick={() => navigate('/maintenance/equipment')}
          >
            Équipements
          </Button>
        </div>

        <PageNotice config={maintenanceNotices.dashboard} className="mb-2" />

        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des données.
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

        {/* Statistiques Équipements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Équipements Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {kpi?.equipment.total || 0}
                </p>
              </div>
              <Package className="w-12 h-12 text-amber-600 dark:text-amber-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Équipements Critiques</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-500 mt-2">
                  {kpi?.equipment.critical || 0}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600 dark:text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Demandes en Cours</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-2">
                  {kpi?.requests.pending || 0}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-600 dark:text-blue-500" />
            </div>
          </div>
        </div>

        {/* KPI Maintenance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Indicateurs de Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">MTBF Moyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {kpi?.kpi.avg_mtbf_hours.toFixed(1) || '0.0'} h
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Temps moyen entre pannes
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">MTTR Moyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {kpi?.kpi.avg_mttr_hours.toFixed(1) || '0.0'} h
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Temps moyen de réparation
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taux Uptime</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {kpi?.kpi.avg_uptime_percentage.toFixed(1) || '100.0'}%
                </p>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Disponibilité moyenne
              </p>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/maintenance/equipment')}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-amber-500 dark:hover:border-amber-600 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <Wrench className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gérer les Équipements
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Consulter et maintenir vos équipements
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/maintenance/requests')}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-600 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Demandes d'Intervention
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Gérer les interventions de maintenance
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  )
}
