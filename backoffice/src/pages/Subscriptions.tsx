import { useState, useMemo, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { useSubscriptions } from '../hooks/useSubscriptions'
import type { SubscriptionListItem } from '../types'
import { Button, Breadcrumbs, SkeletonTable } from '../components/common'
import { useToast } from '../contexts/ToastContext'
import { Link } from 'react-router-dom'
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type SortField = 'name' | 'partner_name' | 'plan_name' | 'start_date' | 'state'
type SortOrder = 'asc' | 'desc'
type StateFilter = 'all' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
type CycleFilter = 'all' | 'monthly' | 'yearly'

const stateLabels: Record<string, string> = {
  trial: 'Période d\'essai',
  active: 'Actif',
  past_due: 'Paiement en retard',
  cancelled: 'Annulé',
  expired: 'Expiré',
}

const stateColors: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  past_due: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

/**
 * Page de gestion des abonnements
 * Affiche la liste paginée des abonnements avec recherche, tri et filtres
 */
export default function Subscriptions() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('start_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const [cycleFilter, setCycleFilter] = useState<CycleFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const limit = 20

  const { data, isLoading, error } = useSubscriptions({
    limit,
    offset: page * limit,
  })

  const toast = useToast()

  // Gestion du tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filtrage et tri côté client des données
  const filteredAndSortedSubscriptions = useMemo(() => {
    if (!data?.data) return []
    let subscriptions = [...(data.data as SubscriptionListItem[])]

    // Filtrer par recherche
    if (search) {
      const searchLower = search.toLowerCase()
      subscriptions = subscriptions.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchLower) ||
          sub.partner_name.toLowerCase().includes(searchLower) ||
          sub.partner_email.toLowerCase().includes(searchLower) ||
          sub.plan_name.toLowerCase().includes(searchLower)
      )
    }

    // Filtrer par statut
    if (stateFilter !== 'all') {
      subscriptions = subscriptions.filter((sub) => sub.state === stateFilter)
    }

    // Filtrer par cycle
    if (cycleFilter !== 'all') {
      subscriptions = subscriptions.filter((sub) => sub.billing_cycle === cycleFilter)
    }

    // Trier
    return subscriptions.sort((a, b) => {
      let aValue: string | number = a[sortField] ?? ''
      let bValue: string | number = b[sortField] ?? ''

      // Conversion pour les dates
      if (sortField === 'start_date') {
        aValue = a.start_date ? new Date(a.start_date).getTime() : 0
        bValue = b.start_date ? new Date(b.start_date).getTime() : 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
    })
  }, [data?.data, search, stateFilter, cycleFilter, sortField, sortOrder])

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!data?.data) return { total: 0, active: 0, trial: 0, pastDue: 0 }

    const subscriptions = data.data as SubscriptionListItem[]
    return {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.state === 'active').length,
      trial: subscriptions.filter((s) => s.state === 'trial').length,
      pastDue: subscriptions.filter((s) => s.state === 'past_due').length,
    }
  }, [data?.data])

  // Gestion de la recherche
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleReset = () => {
    setSearch('')
    setSearchInput('')
    setStateFilter('all')
    setCycleFilter('all')
    setPage(0)
  }

  // Afficher erreur si API échoue
  useEffect(() => {
    if (error) {
      toast.error('Erreur lors du chargement des abonnements')
    }
  }, [error, toast])

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const hasActiveFilters = stateFilter !== 'all' || cycleFilter !== 'all' || search !== ''

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Abonnements' }]}
          />

          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Abonnements
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gérer les abonnements clients
                </p>
              </div>
              <Link to="/subscriptions/new">
                <Button variant="primary" icon={<PlusIcon className="w-5 h-5" />}>
                  Nouvel abonnement
                </Button>
              </Link>
            </div>
          </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.total}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {stats.active}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">En essai</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.trial}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">En retard</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.pastDue}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, client, plan..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchInput)
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleSearch(searchInput)}>
                Rechercher
              </Button>
              <Button
                variant="secondary"
                icon={<FunnelIcon className="w-5 h-5" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtres
                {hasActiveFilters && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full font-medium">
                    •
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" icon={<XMarkIcon className="w-5 h-5" />} onClick={handleReset}>
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtre Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Statut
                  </label>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value as StateFilter)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="trial">Période d'essai</option>
                    <option value="active">Actif</option>
                    <option value="past_due">Paiement en retard</option>
                    <option value="cancelled">Annulé</option>
                    <option value="expired">Expiré</option>
                  </select>
                </div>

                {/* Filtre Cycle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cycle de facturation
                  </label>
                  <select
                    value={cycleFilter}
                    onChange={(e) => setCycleFilter(e.target.value as CycleFilter)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les cycles</option>
                    <option value="monthly">Mensuel</option>
                    <option value="yearly">Annuel</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : filteredAndSortedSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {hasActiveFilters ? 'Aucun résultat' : 'Aucun abonnement'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {hasActiveFilters
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Commencez par créer un nouvel abonnement'}
              </p>
              {!hasActiveFilters && (
                <Link to="/subscriptions/new">
                  <Button variant="primary" icon={<PlusIcon className="w-5 h-5" />}>
                    Créer un abonnement
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                      onClick={() => handleSort('name')}
                    >
                      Référence {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                      onClick={() => handleSort('partner_name')}
                    >
                      Client {sortField === 'partner_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                      onClick={() => handleSort('plan_name')}
                    >
                      Plan {sortField === 'plan_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                      onClick={() => handleSort('state')}
                    >
                      Statut {sortField === 'state' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Utilisation
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                      onClick={() => handleSort('start_date')}
                    >
                      Début {sortField === 'start_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedSubscriptions.map((subscription) => {
                    const usersPercentage =
                      subscription.max_users > 0
                        ? (subscription.current_users_count / subscription.max_users) * 100
                        : 0
                    const productsPercentage =
                      subscription.max_products > 0
                        ? (subscription.current_products_count / subscription.max_products) * 100
                        : 0

                    return (
                      <tr
                        key={subscription.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                        onClick={() => {
                          window.location.href = `/subscriptions/${subscription.id}`
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {subscription.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {subscription.partner_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {subscription.partner_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {subscription.plan_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              stateColors[subscription.state]
                            }`}
                          >
                            {stateLabels[subscription.state]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {subscription.billing_cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    usersPercentage >= 80
                                      ? 'bg-red-500'
                                      : usersPercentage >= 60
                                        ? 'bg-amber-500'
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(usersPercentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {subscription.current_users_count}/{subscription.max_users} users
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    productsPercentage >= 80
                                      ? 'bg-red-500'
                                      : productsPercentage >= 60
                                        ? 'bg-amber-500'
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(productsPercentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {subscription.current_products_count}/{subscription.max_products}{' '}
                                prod
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(subscription.start_date)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredAndSortedSubscriptions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Affichage {page * limit + 1} à{' '}
                {Math.min((page + 1) * limit, filteredAndSortedSubscriptions.length)} sur{' '}
                {data?.total || filteredAndSortedSubscriptions.length} résultats
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= (data?.total || 0)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  )
}
