import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import {
  useAnalyticsStats,
  useRevenueChart,
  useOrdersChart,
  useConversionFunnel,
  useTopCategories,
} from '../hooks/useAnalytics'
import { Breadcrumbs, Skeleton } from '../components/common'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function Analytics() {
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('30d')

  const { data, isLoading, error } = useAnalyticsStats()
  const { data: revenueData, isLoading: revenueLoading } = useRevenueChart({ period })
  const { data: ordersData, isLoading: ordersLoading } = useOrdersChart({ period })
  const { data: funnelData, isLoading: funnelLoading } = useConversionFunnel({ period })
  const { data: topCategoriesData, isLoading: topCategoriesLoading } = useTopCategories({ limit: 5 })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Brouillon'
      case 'sent':
        return 'Envoyé'
      case 'sale':
        return 'Confirmé'
      case 'done':
        return 'Terminé'
      case 'cancel':
        return 'Annulé'
      default:
        return state
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Analytiques' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytiques</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Vue d'ensemble des statistiques de votre boutique
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton count={4} height={120} />
            </div>
            <Skeleton height={300} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">
            Erreur lors du chargement des statistiques
          </div>
        ) : data?.data ? (
          <>
            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Chiffre d'affaires */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Chiffre d'affaires
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatPrice(data.data.totals.revenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {data.data.totals.confirmed_orders} commande{data.data.totals.confirmed_orders > 1 ? 's' : ''} confirmée{data.data.totals.confirmed_orders > 1 ? 's' : ''}
                </p>
              </div>

              {/* Commandes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Commandes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {data.data.totals.orders}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {data.data.totals.pending_orders} en attente
                </p>
              </div>

              {/* Clients */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Clients
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {data.data.totals.customers}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <svg
                      className="w-6 h-6 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>
                <Link
                  to="/customers"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
                >
                  Voir tous les clients →
                </Link>
              </div>

              {/* Produits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Produits
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {data.data.totals.products}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <svg
                      className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                  {data.data.totals.out_of_stock_products} en rupture
                </p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Évolution & Tendances
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('7d')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === '7d'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  7 jours
                </button>
                <button
                  onClick={() => setPeriod('30d')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === '30d'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  30 jours
                </button>
                <button
                  onClick={() => setPeriod('12m')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === '12m'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  12 mois
                </button>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              {/* Revenue Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Évolution du chiffre d'affaires
                </h3>
                {revenueLoading ? (
                  <Skeleton height={300} />
                ) : revenueData?.data && revenueData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="period"
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value?: number) => value ? `${(value / 1000).toFixed(0)}k€` : ''}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                        formatter={(value?: number) =>
                          value ? new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(value) : '-'
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Chiffre d'affaires"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Aucune donnée disponible
                  </div>
                )}
              </div>

              {/* Orders Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Évolution des commandes
                </h3>
                {ordersLoading ? (
                  <Skeleton height={300} />
                ) : ordersData?.data && ordersData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ordersData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="period"
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="confirmed"
                        stackId="1"
                        name="Confirmées"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        stackId="1"
                        name="En attente"
                        stroke="#F59E0B"
                        fill="#F59E0B"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="cancelled"
                        stackId="1"
                        name="Annulées"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Aucune donnée disponible
                  </div>
                )}
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tunnel de conversion
                </h3>
                {funnelLoading ? (
                  <Skeleton height={300} />
                ) : funnelData?.data && funnelData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData.data} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        width={150}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                        formatter={(value?: number, _name?: string, props?: any) => [
                          value && props ? `${value} (${props.payload.percentage}%)` : '-',
                          'Nombre',
                        ]}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {funnelData.data.map((entry, index) => (
                          <Bar key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Aucune donnée disponible
                  </div>
                )}
              </div>

              {/* Top Categories */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top 5 catégories
                </h3>
                {topCategoriesLoading ? (
                  <Skeleton height={300} />
                ) : topCategoriesData?.data && topCategoriesData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topCategoriesData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="name"
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value?: number) => value ? `${(value / 1000).toFixed(0)}k€` : ''}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB',
                        }}
                        formatter={(value?: number) =>
                          value ? new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(value) : '-'
                        }
                      />
                      <Bar dataKey="revenue" name="Chiffre d'affaires" fill="#6366F1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dernières commandes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Dernières commandes
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.data.recent_orders.length > 0 ? (
                    data.data.recent_orders.map((order) => (
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors block"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {order.customer?.name || 'Client inconnu'} •{' '}
                              {formatDate(order.date_order)}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatPrice(order.amount_total)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getStateLabel(order.state)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Aucune commande récente
                    </p>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/orders"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Voir toutes les commandes →
                  </Link>
                </div>
              </div>

              {/* Top produits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Produits les plus vendus
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.data.top_products.length > 0 ? (
                    data.data.top_products.map((product, index) => (
                      <div
                        key={product.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 text-center">
                            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          </div>
                          <div className="flex-1 ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {product.qty_sold} unité{product.qty_sold > 1 ? 's' : ''} vendue{product.qty_sold > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatPrice(product.revenue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Aucune vente enregistrée
                    </p>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/products"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Voir tous les produits →
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  )
}
