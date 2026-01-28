import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Badge, Skeleton } from '@/components/common'
import { useDashboardStats, useDashboardRecentOrders } from '@/hooks/useDashboard'
import { useProducts } from '@/hooks/useProducts'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  Star,
  ArrowRight,
  ShoppingBag,
  Users,
  BarChart3,
} from 'lucide-react'

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  return `Il y a ${diffDays} jours`
}

// Order status badge
const getStatusBadge = (state: string) => {
  const statusConfig: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' | 'info' }> = {
    draft: { label: 'Brouillon', variant: 'neutral' },
    sent: { label: 'Devis envoyé', variant: 'info' },
    sale: { label: 'Confirmée', variant: 'success' },
    done: { label: 'Terminée', variant: 'success' },
    cancel: { label: 'Annulée', variant: 'error' },
  }
  const config = statusConfig[state] || { label: state, variant: 'neutral' }
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>
}

// KPI Card Component
function KPICard({
  title,
  value,
  variation,
  icon: Icon,
  iconBg,
  loading,
}: {
  title: string
  value: string
  variation?: number
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <Skeleton height={80} />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {variation !== undefined && variation !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${variation > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {variation > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{variation > 0 ? '+' : ''}{variation}%</span>
              <span className="text-gray-400 dark:text-gray-500">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function StoreDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats()
  const { data: recentOrders, isLoading: isLoadingOrders } = useDashboardRecentOrders(5)
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 5 })

  const popularProducts = Array.isArray(productsData?.data?.products) ? productsData.data.products : []

  // Calculate alerts
  const alerts = {
    lowStock: stats?.products?.low_stock || 0,
    outOfStock: stats?.products?.out_of_stock || 0,
    pendingOrders: stats?.orders?.pending || 0,
  }

  const averageOrderValue = stats?.orders?.total && stats?.revenue?.total
    ? stats.revenue.total / stats.orders.total
    : 0

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Boutique' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tableau de bord Boutique
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Vue d'ensemble de votre activité e-commerce
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/store/products/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <Package className="w-4 h-4" />
              Nouveau produit
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Revenu du mois"
            value={formatCurrency(stats?.revenue?.total || 0)}
            variation={stats?.revenue?.variation}
            icon={DollarSign}
            iconBg="bg-emerald-500"
            loading={isLoadingStats}
          />
          <KPICard
            title="Commandes totales"
            value={String(stats?.orders?.total || 0)}
            variation={stats?.orders?.variation}
            icon={ShoppingCart}
            iconBg="bg-indigo-500"
            loading={isLoadingStats}
          />
          <KPICard
            title="Panier moyen"
            value={formatCurrency(averageOrderValue)}
            icon={ShoppingBag}
            iconBg="bg-violet-500"
            loading={isLoadingStats}
          />
          <KPICard
            title="Clients"
            value={String(stats?.customers?.total || 0)}
            variation={stats?.customers?.variation}
            icon={Users}
            iconBg="bg-blue-500"
            loading={isLoadingStats}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders - 2 columns */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Commandes récentes
              </h2>
              <Link
                to="/store/orders"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4 md:p-6">
              {isLoadingOrders ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} height={60} />
                  ))}
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/store/orders/${order.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.amount_total)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(order.state)}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatRelativeTime(order.date_order)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune commande récente</p>
                </div>
              )}
            </div>
          </div>

          {/* Alerts - 1 column */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alertes
              </h2>
            </div>
            <div className="p-4 md:p-6 space-y-3">
              {isLoadingStats ? (
                <div className="space-y-3">
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                </div>
              ) : (
                <>
                  {alerts.outOfStock > 0 && (
                    <Link
                      to="/stock?filter=out_of_stock"
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-800 dark:text-red-200">Rupture de stock</span>
                      </div>
                      <Badge variant="error" size="sm">{alerts.outOfStock}</Badge>
                    </Link>
                  )}

                  {alerts.lowStock > 0 && (
                    <Link
                      to="/stock?filter=low_stock"
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-amber-500" />
                        <span className="text-sm text-amber-800 dark:text-amber-200">Stock faible</span>
                      </div>
                      <Badge variant="warning" size="sm">{alerts.lowStock}</Badge>
                    </Link>
                  )}

                  {alerts.pendingOrders > 0 && (
                    <Link
                      to="/store/orders?status=pending"
                      className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-blue-800 dark:text-blue-200">Commandes en attente</span>
                      </div>
                      <Badge variant="info" size="sm">{alerts.pendingOrders}</Badge>
                    </Link>
                  )}

                  {alerts.outOfStock === 0 && alerts.lowStock === 0 && alerts.pendingOrders === 0 && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Aucune alerte</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Popular Products + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Produits populaires
              </h2>
              <Link
                to="/store/products"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4 md:p-6">
              {isLoadingProducts ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} height={50} />
                  ))}
                </div>
              ) : popularProducts.length > 0 ? (
                <div className="space-y-3">
                  {popularProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      to={`/store/products/${product.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(product.list_price || 0)}</p>
                        </div>
                      </div>
                      {(product as any).sales_count !== undefined && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {(product as any).sales_count} ventes
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun produit</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Analytics Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Actions rapides
              </h2>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-2 gap-4">
              <Link
                to="/store/products"
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
              >
                <Package className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Produits</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stats?.products?.total || 0} articles</span>
              </Link>
              <Link
                to="/store/orders"
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
              >
                <ShoppingCart className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Commandes</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stats?.orders?.pending || 0} en attente</span>
              </Link>
              <Link
                to="/store/categories"
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
              >
                <svg className="w-8 h-8 text-violet-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Catégories</span>
              </Link>
              <Link
                to="/store/settings"
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
              >
                <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Paramètres</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
