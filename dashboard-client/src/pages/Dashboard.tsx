import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Badge, OdooImage, Skeleton } from '../components/common'
import { useAnalyticsStats } from '../hooks/useAnalytics'
import { useDashboardStats, useDashboardRecentOrders } from '../hooks/useDashboard'
import { DashboardKPIs } from '../components/dashboard/DashboardKPIs'
import { DashboardRecentOrders } from '../components/dashboard/DashboardRecentOrders'
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { AnalyticsStats } from '@/types'

type StockAlert = AnalyticsStats['stock_alerts'][number]

export default function Dashboard() {
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useAnalyticsStats()
  const { data: dashboardStats, isLoading: isLoadingStats } = useDashboardStats()
  const { data: recentOrders, isLoading: isLoadingOrders } = useDashboardRecentOrders(5)

  const stockAlerts: StockAlert[] = analyticsData?.data?.stock_alerts || []
  const totals = analyticsData?.data?.totals

  return (
    <Layout>
      <div className="p-4 md:p-8">
        {/* En-tête */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Tableau de bord
          </h1>
          <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
            Vue d'ensemble de votre activité e-commerce
          </p>
        </div>

        {/* KPIs principales */}
        <div className="mb-6 md:mb-8">
          <DashboardKPIs stats={dashboardStats} isLoading={isLoadingStats} />
        </div>

        {/* Grid 2 colonnes : Commandes récentes + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
          <DashboardRecentOrders orders={recentOrders} isLoading={isLoadingOrders} />
          <DashboardQuickActions />
        </div>

        {/* Alertes de stock */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" aria-hidden="true" />
              Alertes de stock
            </h3>
            {totals && (totals.out_of_stock_products > 0 || totals.low_stock_products > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                {totals.out_of_stock_products > 0 && (
                  <Badge variant="error" size="sm">
                    {totals.out_of_stock_products} en rupture
                  </Badge>
                )}
                {totals.low_stock_products > 0 && (
                  <Badge variant="warning" size="sm">
                    {totals.low_stock_products} stock faible
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="space-y-3">
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </div>
          ) : stockAlerts.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto text-green-500 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Tous les stocks sont corrects</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  to={`/products/${alert.id}/edit`}
                  className={`flex items-center gap-3 md:gap-4 p-3 rounded-lg transition-colors ${
                    alert.alert_level === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <OdooImage
                      src={alert.image}
                      alt={alert.name}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">
                      {alert.name}
                    </p>
                    {alert.default_code && (
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {alert.default_code}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.alert_level === 'critical' ? 'error' : 'warning'} size="sm">
                      {alert.alert_message}
                    </Badge>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
              {stockAlerts.length >= 10 && (
                <Link
                  to="/stock"
                  className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline py-2"
                >
                  Voir tous les produits en alerte →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* État du système */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            État du système
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">API Backend</span>
              <Badge variant={analyticsData?.success ? 'success' : 'warning'} size="sm">
                {analyticsData?.success ? 'Opérationnel' : 'À vérifier'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                Base de données
              </span>
              <Badge variant={analyticsData?.success ? 'success' : 'warning'} size="sm">
                {analyticsData?.success ? 'Connectée' : 'À vérifier'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Frontend</span>
              <Badge variant="success" size="sm">
                Opérationnel
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
