import { useState, useMemo, useCallback, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { useCustomers } from '../../hooks/useCustomers'
import { useExportCustomers } from '../../hooks/useExportCustomers'
import type { CustomerListItem } from '@/types'
import { Button, Breadcrumbs, SkeletonTable, PageNotice } from '../../components/common'
import { crmNotices } from '@/lib/notices'
import { CustomerStats } from '../../components/customers/CustomerStats'
import { CustomerFilters } from '../../components/customers/CustomerFilters'
import { CustomerTable } from '../../components/customers/CustomerTable'
import { CustomerEmpty } from '../../components/customers/CustomerEmpty'
import { useToast } from '../../contexts/ToastContext'

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
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('asc')
      return field
    })
  }, [])

  // Tri côté client des données
  const sortedCustomers = useMemo(() => {
    const customers = (data?.items || data?.data || []) as CustomerListItem[]
    if (customers.length === 0) return []

    return [...customers].sort((a, b) => {
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
  }, [data?.items, data?.data, sortField, sortOrder])

  // Calcul des statistiques
  const stats = useMemo(() => {
    const customers = (data?.items || data?.data || []) as CustomerListItem[]
    if (customers.length === 0) return { totalCustomers: 0, totalRevenue: 0, avgBasket: 0 }

    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent ?? 0), 0)
    const customersWithOrders = customers.filter((c) => (c.orders_count ?? 0) > 0)
    const avgBasket =
      customersWithOrders.length > 0
        ? customersWithOrders.reduce((sum, c) => sum + (c.total_spent ?? 0) / (c.orders_count ?? 1), 0) /
          customersWithOrders.length
        : 0

    return {
      totalCustomers: data?.total || 0,
      totalRevenue,
      avgBasket,
    }
  }, [data?.data])

  // Gestion de l'export CSV
  const handleExportCSV = useCallback(async () => {
    const success = await exportCSV(search || undefined)
    if (success) {
      toast.success('Export CSV téléchargé avec succès')
    } else {
      toast.error(exportError || "Erreur lors de l'export CSV")
    }
  }, [search, exportCSV, exportError, toast])

  // Gestion de la recherche
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleReset = useCallback(() => {
    setSearch('')
    setSearchInput('')
    setPage(0)
  }, [])

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
  }, [search, handleExportCSV, handleReset])

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

        <PageNotice config={crmNotices.customers} className="mb-6" />

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
          totalCount={data?.total}
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
              {data?.data && data?.total || 0 > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage {page * limit + 1} à {Math.min((page + 1) * limit, data?.total || 0)} sur{' '}
                    {data?.total || 0}
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
                      disabled={(page + 1) * limit >= data?.total || 0}
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
