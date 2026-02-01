/**
 * Rapports KPI Maintenance - GMAO
 *
 * Fonctionnalités :
 * - KPI globaux détaillés : MTBF, MTTR, uptime
 * - Statistiques équipements et demandes
 * - Analyse performance maintenance
 * - Export rapports (future feature)
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices'
import { BarChart2, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Package, Clock, Bell, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMaintenanceDashboard } from '@/hooks/useMaintenanceDashboard'

export default function Reports() {
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
            { label: 'GMAO', href: '/maintenance' },
            { label: 'Rapports' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                KPI & Rapports Maintenance
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Analyse de performance GMAO
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
          >
            Actualiser
          </Button>
        </div>

        <PageNotice config={maintenanceNotices.reports} className="mb-2" />

        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des KPI.
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

        {/* Vue d'ensemble Équipements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            Équipements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">Total Équipements</p>
              <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">
                {kpi?.equipment.total || 0}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                Équipements sous surveillance
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-2">Équipements Critiques</p>
              <p className="text-4xl font-bold text-orange-900 dark:text-orange-100">
                {kpi?.equipment.critical || 0}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Nécessitent attention prioritaire
              </p>
            </div>
          </div>
        </div>

        {/* Vue d'ensemble Demandes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            Demandes d'Intervention
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Demandes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpi?.requests.total || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">En Cours</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                {kpi?.requests.pending || 0}
                <Clock className="w-6 h-6" />
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400 mb-2">Urgences</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                {kpi?.requests.emergency || 0}
                <Bell className="w-6 h-6 animate-pulse" />
              </p>
            </div>
          </div>
        </div>

        {/* Indicateurs de Performance Détaillés */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
            Indicateurs de Performance (KPI)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* MTBF */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                  MTBF Moyen
                </p>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <p className="text-4xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                {kpi?.kpi.avg_mtbf_hours.toFixed(1) || '0.0'}
                <span className="text-xl text-indigo-600 dark:text-indigo-400 ml-2">h</span>
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-500">
                Mean Time Between Failures
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Temps moyen entre deux pannes
              </p>
            </div>

            {/* MTTR */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  MTTR Moyen
                </p>
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                {kpi?.kpi.avg_mttr_hours.toFixed(1) || '0.0'}
                <span className="text-xl text-yellow-600 dark:text-yellow-400 ml-2">h</span>
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                Mean Time To Repair
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Temps moyen de réparation
              </p>
            </div>

            {/* Uptime */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Taux Uptime
                </p>
                {(kpi?.kpi.avg_uptime_percentage || 100) >= 95 ? (
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                )}
              </div>
              <p className="text-4xl font-bold text-green-900 dark:text-green-100 mb-2">
                {kpi?.kpi.avg_uptime_percentage.toFixed(1) || '100.0'}
                <span className="text-xl text-green-600 dark:text-green-400 ml-2">%</span>
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                Disponibilité moyenne
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Temps de fonctionnement effectif
              </p>
            </div>
          </div>
        </div>

        {/* Interprétation KPI */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
            💡 Interprétation des KPI
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <p>
              <strong>MTBF élevé</strong> = Les équipements tombent rarement en panne (bon signe)
            </p>
            <p>
              <strong>MTTR faible</strong> = Les pannes sont réparées rapidement (efficacité)
            </p>
            <p>
              <strong>Uptime {'>'}95%</strong> = Disponibilité excellente des équipements
            </p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/maintenance/equipment')}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-amber-500 dark:hover:border-amber-600 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analyser Équipements
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Voir détails par équipement
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/maintenance/costs')}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-green-500 dark:hover:border-green-600 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <BarChart2 className="w-8 h-8 text-green-600 dark:text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analyser Coûts
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Voir répartition des coûts
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  )
}
