/**
 * Dashboard Super Admin
 *
 * Fonctionnalités principales :
 * - KPIs globaux : MRR, ARR, Active Subscriptions, Churn Rate
 * - Tendances calculées dynamiquement depuis mrr_history
 * - Sparklines mini-graphes dans les KPI cards
 * - Charts : MRR History, Revenue by Plan, Tenant Growth
 * - Top Customers par MRR
 * - At-Risk Customers (prédiction churn)
 * - Recent Subscriptions
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react'
import {
  ChartWrapper,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from '@/components/charts/ChartComponents'
import { api } from '@/lib/api/gateway'
import { DashboardMetricsSchema, validateApiResponse } from '@/lib/validators'
import type { DashboardMetrics } from '@/lib/validators'

const COLORS = {
  starter: '#10b981',
  pro: '#3b82f6',
  enterprise: '#8b5cf6',
}

function computeTrend(history: Array<{ month: string; mrr: number }>): { value: number; label: string } {
  if (!history || history.length < 2) return { value: 0, label: '0%' }
  const current = history[history.length - 1].mrr
  const previous = history[history.length - 2].mrr
  if (previous === 0) return { value: 0, label: '0%' }
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return { value: pct, label: `${sign}${pct.toFixed(1)}%` }
}

export function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: async () => {
      const response = await api.request<DashboardMetrics>({ method: 'GET', path: '/api/super-admin/dashboard/metrics' })
      return validateApiResponse(DashboardMetricsSchema, response.data)
    },
    staleTime: 5 * 60 * 1000,
  })

  const trends = useMemo(() => {
    if (!metrics?.mrr_history?.length) return { mrr: { value: 0, label: '0%' }, arr: { value: 0, label: '0%' } }
    const mrrTrend = computeTrend(metrics.mrr_history)
    // ARR trend = same % as MRR (ARR = MRR * 12)
    return { mrr: mrrTrend, arr: mrrTrend }
  }, [metrics?.mrr_history])

  // Sparkline data: last 6 months of MRR
  const sparklineData = useMemo(() => {
    if (!metrics?.mrr_history) return []
    return metrics.mrr_history.slice(-6)
  }, [metrics?.mrr_history])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Impossible de charger les métriques</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard SaaS</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Vue globale de la plateforme Quelyos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="MRR"
          value={`${metrics.mrr.toLocaleString('fr-FR')} \u20AC`}
          icon={trends.mrr.value >= 0 ? TrendingUp : TrendingDown}
          trend={trends.mrr.label}
          color="teal"
          sparkline={sparklineData}
        />
        <KPICard
          title="ARR"
          value={`${metrics.arr.toLocaleString('fr-FR')} \u20AC`}
          icon={trends.arr.value >= 0 ? TrendingUp : TrendingDown}
          trend={trends.arr.label}
          color="blue"
          sparkline={sparklineData}
        />
        <KPICard
          title="Abonnements Actifs"
          value={metrics.active_subscriptions.toString()}
          icon={Users}
          trend={`${metrics.active_subscriptions} actifs`}
          color="emerald"
        />
        <KPICard
          title="Churn Rate"
          value={`${metrics.churn_rate.toFixed(1)}%`}
          icon={AlertTriangle}
          trend={`${metrics.churn_rate.toFixed(1)}% ce mois`}
          color={metrics.churn_rate > 5 ? 'red' : 'green'}
          trendInverted
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR History */}
        <ChartWrapper>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution MRR (12 mois)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.mrr_history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="mrr" stroke="#14b8a6" strokeWidth={2} name="MRR (\u20AC)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue par Plan</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.revenue_by_plan}
                  dataKey="revenue"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.plan}: ${entry.revenue}\u20AC`}
                >
                  {metrics.revenue_by_plan.map((entry) => (
                    <Cell key={entry.plan} fill={COLORS[entry.plan as keyof typeof COLORS] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top 10 Customers (MRR)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    MRR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.top_customers.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{tenant.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                        {tenant.plan?.toUpperCase() ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {tenant.mrr.toLocaleString('fr-FR')} {'\u20AC'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* At-Risk Customers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Customers à Risque
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Score Santé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    MRR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.at_risk_customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                      Aucun customer à risque
                    </td>
                  </tr>
                ) : (
                  metrics.at_risk_customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{customer.name}</td>
                      <td className="px-6 py-4 text-center">
                        <HealthScoreBadge score={customer.health_score || 50} />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            customer.health_status === 'critical'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          }`}
                        >
                          {customer.health_status === 'critical' ? 'Critique' : 'À risque'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {customer.mrr.toLocaleString('fr-FR')} {'\u20AC'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Derniers Abonnements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  État
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date Début
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  MRR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.recent_subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{sub.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {sub.plan?.toUpperCase() ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sub.state === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : sub.state === 'trial'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {sub.state}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                    {sub.mrr.toLocaleString('fr-FR')} {'\u20AC'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend: string
  color: string
  trendInverted?: boolean
  sparkline?: Array<{ month: string; mrr: number }>
}

function KPICard({ title, value, icon: Icon, trend, color, trendInverted, sparkline }: KPICardProps) {
  const isPositive = trend.startsWith('+')
  const trendColor = trendInverted
    ? isPositive
      ? 'text-red-600 dark:text-red-400'
      : 'text-green-600 dark:text-green-400'
    : isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'

  const bgColor = {
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
  }[color] || 'bg-gray-500'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className={`mt-2 text-sm font-medium ${trendColor}`}>{trend} ce mois</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {/* Sparkline */}
      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline}>
              <defs>
                <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#14b8a6"
                strokeWidth={1.5}
                fill={`url(#spark-${color})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function HealthScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${getColor()}`}>
      {score}
    </span>
  )
}
