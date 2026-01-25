import { useState, useMemo, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { useCustomers } from '../hooks/useCustomers'
import { useExportCustomers } from '../hooks/useExportCustomers'
import type { CustomerListItem } from '@/types'
import { Button, Breadcrumbs, SkeletonTable } from '../components/common'
import { CustomerStats } from '../components/customers/CustomerStats'
import { CustomerFilters } from '../components/customers/CustomerFilters'
import { CustomerTable } from '../components/customers/CustomerTable'
import { CustomerEmpty } from '../components/customers/CustomerEmpty'
import { useToast } from '../contexts/ToastContext'

type SortField = 'name' | 'email' | 'orders_count' | 'total_spent' | 'create_date'
type SortOrder = 'asc' | 'desc'

/**
 * Page de gestion des clients
 * Affiche la liste paginée des clients avec recherche, tri et export CSV
 */
export default function Customers() {
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const limit = 20

  const { data, isLoading, error } = useCustomers({
    limit,
    offset: page * limit,
    search: search || undefined,
  })

  const { exportCSV, isExporting, error: exportError } = useExportCustomers()
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
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
    })
  }, [data?.data?.customers, sortField, sortOrder])

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!data?.data?.customers) return { totalCustomers: 0, totalRevenue: 0, avgBasket: 0 }

    const customers = data.data.customers as CustomerListItem[]
    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent ?? 0), 0)
    const customersWithOrders = customers.filter((c) => (c.orders_count ?? 0) > 0)
    const avgBasket =
      customersWithOrders.length > 0
        ? customersWithOrders.reduce((sum, c) => sum + (c.total_spent ?? 0) / (c.orders_count ?? 1), 0) /
          customersWithOrders.length
        : 0

    return {
      totalCustomers: data.data.total,
      totalRevenue,
      avgBasket,
    }
  }, [data?.data])

  // Gestion de l'export CSV
  const handleExportCSV = async () => {
    const success = await exportCSV(search || undefined)
    if (success) {
      toast.success('Export CSV téléchargé avec succès')
    } else {
      toast.error(exportError || "Erreur lors de l'export CSV")
    }
  }

  // Gestion de la recherche
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(0) // Réinitialiser à la première page lors d'une nouvelle recherche
  }

  const handleReset = () => {
    setSearch('')
    setSearchInput('')
    setPage(0)
  }

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + E : Export CSV
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        handleExportCSV()
      }

      // Escape : Reset recherche
      if (e.key === 'Escape' && search) {
        e.preventDefault()
        handleReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [search])

  // Afficher erreur si API échoue
  useEffect(() => {
    if (error) {
      toast.error('Erreur lors du chargement des clients')
    }
  }, [error, toast])

  return (
    <Layout>
      <div className="p-4 md:p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Clients' }]} />

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérer les comptes clients
            <span className="hidden md:inline"> • Cmd+E pour exporter</span>
          </p>
        </div>

        {/* KPI Cards */}
        {!isLoading && data?.data && (
          <CustomerStats
            totalCustomers={stats.totalCustomers}
            totalRevenue={stats.totalRevenue}
            avgBasket={stats.avgBasket}
          />
        )}

        {/* Filtres et recherche */}
        <CustomerFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onReset={handleReset}
          onExportCSV={handleExportCSV}
          isExporting={isExporting}
          totalCount={data?.data?.total}
          currentSearch={search}
        />

        {/* Liste des clients */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400" role="alert">
              <p>Erreur lors du chargement des clients</p>
              <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
                Réessayer
              </Button>
            </div>
          ) : sortedCustomers.length > 0 ? (
            <>
              <CustomerTable
                customers={sortedCustomers}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />

              {/* Pagination */}
              {data?.data && data.data.total > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage {page * limit + 1} à {Math.min((page + 1) * limit, data.data.total)} sur{' '}
                    {data.data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      aria-label="Page précédente"
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= data.data.total}
                      aria-label="Page suivante"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <CustomerEmpty hasSearch={!!search} onResetSearch={search ? handleReset : undefined} />
          )}
        </div>
      </div>
    </Layout>
  )
}
