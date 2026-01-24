import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useLowStockAlerts, useHighStockAlerts, useStockProducts, useUpdateProductStock } from '../hooks/useStock'
import { Badge, Button, Breadcrumbs, SkeletonTable, Input } from '../components/common'
import { useToast } from '../contexts/ToastContext'
import { api } from '../lib/api'
import {
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  CubeIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import type { StockProduct } from '../types'

type TabType = 'products' | 'alerts'

export default function Stock() {
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editingQuantity, setEditingQuantity] = useState<string>('')
  const limit = 20

  const toast = useToast()

  // Queries
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: errorProducts,
  } = useStockProducts({
    limit,
    offset: page * limit,
    search: search || undefined,
  })

  const {
    data: alertsData,
    isLoading: isLoadingAlerts,
    error: errorAlerts,
  } = useLowStockAlerts({
    limit,
    offset: page * limit,
  })

  const {
    data: highAlertsData,
    isLoading: isLoadingHighAlerts,
  } = useHighStockAlerts({
    limit,
    offset: page * limit,
  })

  const updateStockMutation = useUpdateProductStock()

  // Helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const getAlertSeverity = (diff: number): 'error' | 'warning' => {
    return diff > 5 ? 'warning' : 'error'
  }

  const getStockBadgeVariant = (
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
  ): 'success' | 'warning' | 'error' => {
    if (status === 'in_stock') return 'success'
    if (status === 'low_stock') return 'warning'
    return 'error'
  }

  const getStockLabel = (status: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    if (status === 'in_stock') return 'En stock'
    if (status === 'low_stock') return 'Stock faible'
    return 'Rupture'
  }

  // Actions
  const handleStartEdit = (productId: number, currentQty: number) => {
    setEditingProductId(productId)
    setEditingQuantity(currentQty.toString())
  }

  const handleCancelEdit = () => {
    setEditingProductId(null)
    setEditingQuantity('')
  }

  const handleSaveEdit = async (productId: number) => {
    const quantity = parseFloat(editingQuantity)

    if (isNaN(quantity) || quantity < 0) {
      toast.error('Quantité invalide')
      return
    }

    try {
      await updateStockMutation.mutateAsync({ productId, quantity })
      toast.success('Stock mis à jour avec succès')
      setEditingProductId(null)
      setEditingQuantity('')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock')
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setPage(0) // Reset pagination
    setSearch('') // Reset search
  }

  const handleExportCSV = async () => {
    try {
      toast.info('Génération du fichier CSV en cours...')

      // Récupérer toutes les données (limite élevée)
      const response = await api.getStockProducts({ limit: 10000, offset: 0 })
      const allProducts = (response?.data?.products as StockProduct[]) || []

      if (allProducts.length === 0) {
        toast.warning('Aucune donnée à exporter')
        return
      }

      // Générer le CSV
      const headers = ['Nom', 'SKU', 'Catégorie', 'Stock Disponible', 'Stock Virtuel', 'Entrant', 'Sortant', 'Prix (€)', 'Statut']
      const rows = allProducts.map(p => [
        p.name,
        p.sku || '',
        p.category || '',
        p.qty_available.toString(),
        p.virtual_available.toString(),
        p.incoming_qty.toString(),
        p.outgoing_qty.toString(),
        p.list_price?.toFixed(2) || '0.00',
        getStockLabel(p.stock_status),
      ])

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n')

      // Télécharger le fichier
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `stock_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`${allProducts.length} produits exportés avec succès`)
    } catch (error) {
      console.error('Export CSV error:', error)
      toast.error('Erreur lors de l\'export CSV')
    }
  }

  const handleExportValorisation = async () => {
    try {
      toast.info('Génération du rapport de valorisation...')

      const response = await api.getStockProducts({ limit: 10000, offset: 0 })
      const allProducts = (response?.data?.products as StockProduct[]) || []

      if (allProducts.length === 0) {
        toast.warning('Aucune donnée à exporter')
        return
      }

      // Group by category
      const byCategory: Record<string, { count: number; totalQty: number; totalValue: number }> = {}

      allProducts.forEach(p => {
        const cat = p.category || 'Sans catégorie'
        if (!byCategory[cat]) {
          byCategory[cat] = { count: 0, totalQty: 0, totalValue: 0 }
        }
        byCategory[cat].count++
        byCategory[cat].totalQty += p.qty_available
        byCategory[cat].totalValue += (p.list_price || 0) * p.qty_available
      })

      // Generate CSV
      const headers = ['Catégorie', 'Nombre Produits', 'Total Unités', 'Valorisation (€)', 'Valeur Moyenne/Produit (€)']
      const rows = Object.entries(byCategory)
        .sort((a, b) => b[1].totalValue - a[1].totalValue) // Sort by value desc
        .map(([cat, data]) => [
          cat,
          data.count.toString(),
          data.totalQty.toString(),
          data.totalValue.toFixed(2),
          (data.totalValue / data.count).toFixed(2),
        ])

      // Add totals row
      const totals = Object.values(byCategory).reduce(
        (acc, d) => ({
          count: acc.count + d.count,
          totalQty: acc.totalQty + d.totalQty,
          totalValue: acc.totalValue + d.totalValue,
        }),
        { count: 0, totalQty: 0, totalValue: 0 }
      )

      rows.push([
        'TOTAL',
        totals.count.toString(),
        totals.totalQty.toString(),
        totals.totalValue.toFixed(2),
        (totals.totalValue / totals.count).toFixed(2),
      ])

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `valorisation_stock_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Rapport de valorisation exporté avec succès')
    } catch (error) {
      console.error('Export valorisation error:', error)
      toast.error('Erreur lors de l\'export du rapport')
    }
  }

  // Data
  const allProducts = (productsData?.data?.products as StockProduct[]) || []
  const productsTotal = (productsData?.data?.total as number) || 0

  // Apply client-side filters
  const products = allProducts.filter(p => {
    if (categoryFilter && p.category !== categoryFilter) return false
    if (statusFilter !== 'all' && p.stock_status !== statusFilter) return false
    return true
  })

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)))

  const alerts = alertsData?.data?.alerts || []
  const alertsTotal = alertsData?.data?.total || 0

  const highAlerts = highAlertsData?.data?.alerts || []
  const highAlertsTotal = highAlertsData?.data?.total || 0

  // Statistiques valorisation (use filtered products)
  const stockValue = products.reduce((sum, p) => sum + (p.list_price || 0) * p.qty_available, 0)
  const totalItems = products.reduce((sum, p) => sum + p.qty_available, 0)
  const avgStockPerProduct = products.length > 0 ? totalItems / products.length : 0
  const avgValuePerProduct = products.length > 0 ? stockValue / products.length : 0

  // Valorisation par catégorie
  const valorisationByCategory = Object.entries(
    allProducts.reduce((acc, p) => {
      const cat = p.category || 'Sans catégorie'
      if (!acc[cat]) {
        acc[cat] = { count: 0, totalQty: 0, totalValue: 0 }
      }
      acc[cat].count++
      acc[cat].totalQty += p.qty_available
      acc[cat].totalValue += (p.list_price || 0) * p.qty_available
      return acc
    }, {} as Record<string, { count: number; totalQty: number; totalValue: number }>)
  ).sort((a, b) => b[1].totalValue - a[1].totalValue) // Sort by value desc

  const isLoading = activeTab === 'products' ? isLoadingProducts : (isLoadingAlerts || isLoadingHighAlerts)
  const error = activeTab === 'products' ? errorProducts : errorAlerts

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock' },
          ]}
        />

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion du Stock</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Visualisez et gérez les niveaux de stock de vos produits
            </p>
          </div>
          <Link to="/stock/moves">
            <Button variant="secondary" className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Voir les mouvements
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('products')}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'products'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <CubeIcon className="h-5 w-5" />
                Tous les Produits
                {productsTotal > 0 && (
                  <Badge variant="info" className="ml-2">
                    {productsTotal}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => handleTabChange('alerts')}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'alerts'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <ExclamationTriangleIcon className="h-5 w-5" />
                Alertes Stock Bas
                {alertsTotal > 0 && (
                  <Badge variant="error" className="ml-2">
                    {alertsTotal}
                  </Badge>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Statistics Cards (Products tab only) */}
        {activeTab === 'products' && !isLoading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Valorisation Totale
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(stockValue)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {productsTotal} produits
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Unités en Stock
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalItems.toLocaleString('fr-FR')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Toutes catégories
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Stock Moyen / Produit
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgStockPerProduct.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                unités
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Valeur Moyenne / Produit
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(avgValuePerProduct)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                prix × quantité
              </div>
            </div>
          </div>
        )}

        {/* Valorisation by Category */}
        {activeTab === 'products' && !isLoading && products.length > 0 && valorisationByCategory.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 Valorisation par Catégorie
              </h3>
              <Button
                variant="secondary"
                onClick={handleExportValorisation}
                className="flex items-center gap-2"
                size="sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exporter CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produits
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unités
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valorisation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      % Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {valorisationByCategory.slice(0, 10).map(([category, data]) => (
                    <tr key={category} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {data.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {data.totalQty.toLocaleString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(data.totalValue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {((data.totalValue / stockValue) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {valorisationByCategory.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 text-center">
                +{valorisationByCategory.length - 10} autres catégories (voir export CSV complet)
              </div>
            )}
          </div>
        )}

        {/* Search bar & Actions (Products tab only) */}
        {activeTab === 'products' && (
          <>
            <div className="mb-4 flex items-center gap-4 flex-wrap">
              <Input
                type="text"
                placeholder="Rechercher un produit (nom ou SKU)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                className="flex-1 min-w-[250px]"
              />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(0)
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Toutes catégories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any)
                  setPage(0)
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tous statuts</option>
                <option value="in_stock">En stock</option>
                <option value="low_stock">Stock faible</option>
                <option value="out_of_stock">Rupture</option>
              </select>
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Exporter CSV
              </Button>
            </div>
            {(categoryFilter || statusFilter !== 'all') && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Filtres actifs:
                </span>
                {categoryFilter && (
                  <Badge variant="info" className="flex items-center gap-1">
                    Catégorie: {categoryFilter}
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="ml-1 hover:text-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="info" className="flex items-center gap-1">
                    Statut: {getStockLabel(statusFilter as any)}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:text-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </>
        )}

        {/* Alert banner (Alerts tab only) */}
        {activeTab === 'alerts' && !isLoading && alertsTotal > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <ExclamationTriangleIcon className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                  {alertsTotal} produit{alertsTotal > 1 ? 's' : ''} en stock bas
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Ces produits sont sous le seuil d'alerte et nécessitent un réapprovisionnement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={10} columns={activeTab === 'products' ? 7 : 6} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des données
            </div>
          ) : activeTab === 'products' && products.length > 0 ? (
            <>
              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Catégorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <Link
                                to={`/products/${product.id}`}
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {product.name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white font-mono">
                            {product.sku || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {product.category || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingProductId === product.id ? (
                            <Input
                              type="number"
                              value={editingQuantity}
                              onChange={(e) => setEditingQuantity(e.target.value)}
                              className="w-24"
                              min="0"
                              step="1"
                              autoFocus
                            />
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.qty_available} unités
                              </span>
                              {product.incoming_qty > 0 || product.outgoing_qty > 0 ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.incoming_qty > 0 && `+${product.incoming_qty} entrant`}
                                  {product.incoming_qty > 0 && product.outgoing_qty > 0 && ' / '}
                                  {product.outgoing_qty > 0 && `-${product.outgoing_qty} sortant`}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStockBadgeVariant(product.stock_status)}>
                            {getStockLabel(product.stock_status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(product.list_price || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingProductId === product.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(product.id)}
                                disabled={updateStockMutation.isPending}
                                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                title="Sauvegarder"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={updateStockMutation.isPending}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                title="Annuler"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleStartEdit(product.id, product.qty_available)
                              }
                              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Modifier le stock"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {productsTotal > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage {page * limit + 1} à {Math.min((page + 1) * limit, productsTotal)}{' '}
                    sur {productsTotal}
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
                      disabled={(page + 1) * limit >= productsTotal}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : activeTab === 'alerts' && alerts.length > 0 ? (
            <>
              {/* Alerts Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Catégorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stock actuel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Seuil
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prix
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {alerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {alert.image_url ? (
                              <img
                                src={alert.image_url}
                                alt={alert.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <Link
                                to={`/products/${alert.id}`}
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {alert.name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white font-mono">
                            {alert.sku || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {alert.category || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getAlertSeverity(alert.diff)}>
                            {alert.current_stock} unités
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {alert.threshold} unités
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(alert.list_price)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {alertsTotal > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage {page * limit + 1} à {Math.min((page + 1) * limit, alertsTotal)} sur{' '}
                    {alertsTotal}
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
                      disabled={(page + 1) * limit >= alertsTotal}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}

              {/* High Stock Alerts Section */}
              {highAlerts.length > 0 && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-6">
                    📈 Alertes Surstock ({highAlertsTotal})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Produit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Référence
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Catégorie
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Stock actuel
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Seuil max
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Prix
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {highAlerts.map((alert) => (
                          <tr
                            key={alert.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {alert.image_url ? (
                                  <img
                                    src={alert.image_url}
                                    alt={alert.name}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <Link
                                    to={`/products/${alert.id}`}
                                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    {alert.name}
                                  </Link>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-white font-mono">
                                {alert.sku || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {alert.category || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="warning">
                                {alert.current_stock} unités
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {alert.threshold} unités
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatPrice(alert.list_price)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : activeTab === 'alerts' && highAlerts.length > 0 ? (
            <>
              {/* Only High Stock Alerts if no low stock */}
              <div className="px-6 py-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📈 Alertes Surstock ({highAlertsTotal})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Référence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Catégorie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Stock actuel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Seuil max
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Prix
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {highAlerts.map((alert) => (
                        <tr
                          key={alert.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {alert.image_url ? (
                                <img
                                  src={alert.image_url}
                                  alt={alert.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <Link
                                  to={`/products/${alert.id}`}
                                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {alert.name}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white font-mono">
                              {alert.sku || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {alert.category || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="warning">
                              {alert.current_stock} unités
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {alert.threshold} unités
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(alert.list_price)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === 'products' ? 'Aucun produit trouvé' : 'Tout va bien !'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'products'
                  ? search
                    ? 'Aucun produit ne correspond à votre recherche.'
                    : 'Aucun produit trouvé dans votre catalogue.'
                  : 'Aucun produit en stock bas pour le moment. Les niveaux de stock sont corrects.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
