/**
 * Page Gestion des Fournisseurs
 *
 * Fonctionnalités :
 * - Liste complète des fournisseurs avec filtres
 * - Catégorisation (Stratégique, Régulier, Occasionnel)
 * - Suivi importance (Critique, Haute, Normale, Basse)
 * - Statistiques fournisseurs par type
 * - Suivi factures actives
 * - Planning des paiements
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonTable, PageNotice, Button } from '@/components/common'
import { financeNotices } from '@/lib/notices'
import { Users, Plus, Search, CreditCard, Building2, FileText } from 'lucide-react'
import SupplierCard from '@/components/finance/suppliers/SupplierCard'

type Supplier = {
  id: string
  name: string
  email?: string
  phone?: string
  category: string
  importance: string
  defaultPaymentDelay: number
  _count: {
    invoices: number
    payments: number
  }
}

export default function SuppliersPage() {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    category: 'all',
    importance: 'all',
    search: '',
  })

  const [stats, setStats] = useState({
    total: 0,
    strategic: 0,
    regular: 0,
    occasional: 0,
    totalInvoices: 0,
  })

  const fetchSuppliers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.category !== 'all') params.append('category', filters.category)
      if (filters.importance !== 'all') params.append('importance', filters.importance)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/ecommerce/suppliers?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des fournisseurs')
      }

      const data = await response.json()
      setSuppliers(data.suppliers)

      const strategic = data.suppliers.filter((s: Supplier) => s.category === 'STRATEGIC').length
      const regular = data.suppliers.filter((s: Supplier) => s.category === 'REGULAR').length
      const occasional = data.suppliers.filter((s: Supplier) => s.category === 'OCCASIONAL').length
      const totalInvoices = data.suppliers.reduce(
        (sum: number, s: Supplier) => sum + s._count.invoices,
        0
      )

      setStats({
        total: data.suppliers.length,
        strategic,
        regular,
        occasional,
        totalInvoices,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Fournisseurs' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Fournisseurs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérez vos fournisseurs et planifiez vos paiements
            </p>
          </div>
          <Link to="/finance/suppliers/new">
            <Button variant="primary" icon={<Plus className="h-5 w-5" />}>
              Nouveau Fournisseur
            </Button>
          </Link>
        </div>

        <PageNotice config={financeNotices.suppliers} className="mb-6" />

        {/* Stats */}
        {!isLoading && !error && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total fournisseurs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Building2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stratégiques</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.strategic}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Réguliers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.regular}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Factures actives</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalInvoices}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un fournisseur..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Toutes les catégories</option>
              <option value="STRATEGIC">Stratégique</option>
              <option value="REGULAR">Régulier</option>
              <option value="OCCASIONAL">Occasionnel</option>
            </select>

            <select
              value={filters.importance}
              onChange={(e) => handleFilterChange('importance', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Toutes les importances</option>
              <option value="CRITICAL">Critique</option>
              <option value="HIGH">Haute</option>
              <option value="NORMAL">Normale</option>
              <option value="LOW">Basse</option>
            </select>

            <button
              onClick={() => navigate('/finance/payment-planning')}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              Planning paiements
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonTable rows={6} columns={3} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              {error}
            </p>
            <Button variant="secondary" onClick={fetchSuppliers}>
              Réessayer
            </Button>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun fournisseur trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filters.search || filters.category !== 'all' || filters.importance !== 'all'
                ? 'Aucun fournisseur ne correspond à vos filtres'
                : 'Commencez par ajouter votre premier fournisseur'}
            </p>
            <Link to="/finance/suppliers/new">
              <Button variant="primary" icon={<Plus className="h-5 w-5" />}>
                Ajouter un Fournisseur
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} onRefresh={fetchSuppliers} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
