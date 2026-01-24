import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCustomers } from '../hooks/useCustomers'
import type { CustomerListItem } from '../types'
import { Button, Badge, Breadcrumbs, SkeletonTable } from '../components/common'
import { api } from '../lib/api'
import {
  ArrowDownTrayIcon,
  EyeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'

type SortField = 'name' | 'email' | 'orders_count' | 'total_spent' | 'create_date'
type SortOrder = 'asc' | 'desc'

export default function Customers() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const limit = 20

  const { data, isLoading, error } = useCustomers({
    limit,
    offset: page * limit,
    search: search || undefined,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Tri côté client des données
  const sortedCustomers = useMemo(() => {
    if (!data?.data?.customers) return []
    const customers = [...(data.data.customers as CustomerListItem[])]

    return customers.sort((a, b) => {
      let aValue: string | number = a[sortField] ?? ''
      let bValue: string | number = b[sortField] ?? ''

      // Conversion pour les dates
      if (sortField === 'create_date') {
        aValue = a.create_date ? new Date(a.create_date).getTime() : 0
        bValue = b.create_date ? new Date(b.create_date).getTime() : 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
    })
  }, [data?.data?.customers, sortField, sortOrder])

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!data?.data?.customers) return { totalCustomers: 0, totalRevenue: 0, avgBasket: 0 }

    const customers = data.data.customers as CustomerListItem[]
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0)
    const customersWithOrders = customers.filter((c) => c.orders_count > 0)
    const avgBasket =
      customersWithOrders.length > 0
        ? customersWithOrders.reduce((sum, c) => sum + c.total_spent / c.orders_count, 0) /
          customersWithOrders.length
        : 0

    return {
      totalCustomers: data.data.total,
      totalRevenue,
      avgBasket,
    }
  }, [data?.data])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const handleExportCSV = async () => {
    try {
      const response = await api.exportCustomersCSV({ search: search || undefined })

      if (!response.success || !response.data) {
        alert("Erreur lors de l'export CSV")
        return
      }

      const { customers, columns } = response.data
      const headers = columns.map((col) => col.label).join(',')
      const rows = customers.map((customer) =>
        columns
          .map((col) => {
            const value = customer[col.key as keyof typeof customer]
            const stringValue = String(value ?? '')
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(',')
      )

      const csvContent = [headers, ...rows].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export CSV error:', error)
      alert("Erreur lors de l'export CSV")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 inline ml-1" />
    )
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Clients' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gérer les comptes clients</p>
        </div>

        {/* KPI Cards */}
        {!isLoading && data?.data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total clients</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalCustomers}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenu total</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CurrencyEuroIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Panier moyen</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatPrice(stats.avgBasket)}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ChartBarIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par nom, email ou téléphone..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <Button type="submit" variant="primary">
              Rechercher
            </Button>
            {search && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setSearchInput('')
                  setPage(0)
                }}
              >
                Réinitialiser
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportCSV}
              icon={<ArrowDownTrayIcon className="h-5 w-5" />}
            >
              Exporter CSV
            </Button>
          </form>

          {data?.data && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {data.data.total} client{data.data.total > 1 ? 's' : ''} trouvé
              {data.data.total > 1 ? 's' : ''}
              {search && ` pour "${search}"`}
            </div>
          )}
        </div>

        {/* Liste des clients */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des clients
            </div>
          ) : sortedCustomers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Nom <SortIcon field="name" />
                      </th>
                      <th
                        onClick={() => handleSort('email')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Contact <SortIcon field="email" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Adresse
                      </th>
                      <th
                        onClick={() => handleSort('orders_count')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Commandes <SortIcon field="orders_count" />
                      </th>
                      <th
                        onClick={() => handleSort('total_spent')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Total dépensé <SortIcon field="total_spent" />
                      </th>
                      <th
                        onClick={() => handleSort('create_date')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Inscrit le <SortIcon field="create_date" />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {customer.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {customer.email || '-'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.phone || customer.mobile || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {customer.city ? (
                              <>
                                {customer.zip && `${customer.zip} `}
                                {customer.city}
                                {customer.country && `, ${customer.country}`}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {customer.orders_count > 0 ? (
                              <Badge variant="info">{customer.orders_count}</Badge>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.total_spent > 0 ? (
                              formatPrice(customer.total_spent)
                            ) : (
                              <span className="text-gray-400">0,00 €</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(customer.create_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Détails
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data?.data && data.data.total > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage {page * limit + 1} à {Math.min((page + 1) * limit, data.data.total)}{' '}
                    sur {data.data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= data.data.total}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun client trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {search
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Les clients qui créent un compte apparaîtront ici.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
