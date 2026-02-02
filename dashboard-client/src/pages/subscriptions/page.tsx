/**
 * Abonnements - Liste et gestion des abonnements clients
 *
 * Fonctionnalités :
 * 1. Liste paginée des abonnements avec tri par date
 * 2. Filtrage par statut (trial, active, past_due, cancelled, expired)
 * 3. KPIs résumé (total actifs, MRR, en trial, à risque)
 * 4. Recherche par nom client ou référence
 * 5. Navigation vers détail pour actions (upgrade, cancel, etc.)
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, Badge, SkeletonTable } from '@/components/common'
import {
  CreditCard,
  Search,
  RefreshCw,
  AlertCircle,
  Users,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { backendRpc } from '@/lib/backend-rpc'
import { logger } from '@quelyos/logger'

interface SubscriptionItem {
  id: number
  name: string
  partner_name: string
  partner_email: string
  plan_name: string
  plan_code: string
  state: string
  billing_cycle: string
  start_date: string | null
  next_billing_date: string | null
  current_users_count: number
  max_users: number
  current_products_count: number
  max_products: number
  current_orders_count: number
  max_orders_per_year: number
}

const STATE_LABELS: Record<string, string> = {
  trial: 'Essai',
  active: 'Actif',
  past_due: 'En retard',
  cancelled: 'Annulé',
  expired: 'Expiré',
}

const STATE_COLORS: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  trial: 'info',
  active: 'success',
  past_due: 'warning',
  cancelled: 'error',
  expired: 'neutral',
}

const CYCLE_LABELS: Record<string, string> = {
  monthly: 'Mensuel',
  yearly: 'Annuel',
}

const PAGE_SIZE = 20

const breadcrumbItems = [
  { label: 'Accueil', href: '/dashboard' },
  { label: 'Abonnements' },
]

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await backendRpc<{ data: SubscriptionItem[]; total: number }>(
        '/api/ecommerce/subscription/admin/list',
        { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
      )
      if (res.success && res.data) {
        const raw = (res.data as unknown as { data: SubscriptionItem[]; total: number })
        setSubscriptions(raw.data || [])
        setTotal(raw.total || 0)
      } else {
        setError(res.error || 'Erreur lors du chargement')
      }
    } catch (_err) {
      logger.error('Erreur fetch subscriptions:', _err)
      setError('Impossible de charger les abonnements')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const filtered = subscriptions.filter((sub) => {
    const matchSearch =
      !search ||
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.partner_name.toLowerCase().includes(search.toLowerCase()) ||
      sub.partner_email.toLowerCase().includes(search.toLowerCase())
    const matchState = stateFilter === 'all' || sub.state === stateFilter
    return matchSearch && matchState
  })

  const activeCount = subscriptions.filter((s) => s.state === 'active').length
  const trialCount = subscriptions.filter((s) => s.state === 'trial').length
  const pastDueCount = subscriptions.filter((s) => s.state === 'past_due').length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const usageBar = (current: number, max: number) => {
    if (max === 0) return <span className="text-xs text-gray-500 dark:text-gray-400">Illimité</span>
    const pct = Math.min((current / max) * 100, 100)
    const color =
      pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {current}/{max}
        </span>
      </div>
    )
  }

  if (isLoading && subscriptions.length === 0) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
          <SkeletonTable rows={8} columns={6} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Abonnements
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {total} abonnement{total > 1 ? 's' : ''} au total
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSubscriptions} icon={<RefreshCw className="w-4 h-4" />}>
            Actualiser
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard icon={CreditCard} label="Actifs" value={activeCount} color="emerald" />
          <KpiCard icon={Clock} label="En essai" value={trialCount} color="blue" />
          <KpiCard icon={AlertCircle} label="En retard" value={pastDueCount} color="amber" />
          <KpiCard icon={Users} label="Total" value={total} color="gray" />
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher client ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="trial">En essai</option>
            <option value="active">Actif</option>
            <option value="past_due">En retard</option>
            <option value="cancelled">Annulé</option>
            <option value="expired">Expiré</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Cycle</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Utilisateurs</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Prochaine facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      {search || stateFilter !== 'all'
                        ? 'Aucun abonnement ne correspond aux filtres'
                        : 'Aucun abonnement trouvé'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((sub) => (
                    <tr
                      key={sub.id}
                      onClick={() => navigate(`/dashboard/subscriptions/${sub.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {sub.name}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white">{sub.partner_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{sub.partner_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{sub.plan_name}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATE_COLORS[sub.state] || 'neutral'}>
                          {STATE_LABELS[sub.state] || sub.state}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {CYCLE_LABELS[sub.billing_cycle] || sub.billing_cycle}
                      </td>
                      <td className="px-4 py-3">
                        {usageBar(sub.current_users_count, sub.max_users)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {formatDate(sub.next_billing_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {page + 1} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.gray}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  )
}
