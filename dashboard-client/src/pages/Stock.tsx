/**
 * Page Stock - Gestion centralisée du stock produits
 *
 * Fonctionnalités :
 * - Liste des produits avec niveaux de stock
 * - Alertes stock bas et stock élevé
 * - Gestion des variantes produits
 * - Valorisation du stock par catégorie
 * - Export CSV des données
 * - Ajustements de stock manuels
 */

import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import {
  useLowStockAlerts,
  useHighStockAlerts,
  useStockProducts,
  useUpdateProductStock,
  useProductVariants,
} from '../hooks/useStock'
import { Badge, Button, Breadcrumbs, SkeletonTable, PageNotice } from '../components/common'
import { useToast } from '../contexts/ToastContext'
import { api } from '../lib/api'
import { logger } from '@quelyos/logger'
import { ExportStockModal } from '../components/stock/ExportStockModal'
import { StockAdjustmentModal } from '../components/stock/StockAdjustmentModal'
import { StockProductsTab } from '../components/stock/StockProductsTab'
import { StockAlertsTab } from '../components/stock/StockAlertsTab'
import { StockVariantsTab } from '../components/stock/StockVariantsTab'
import {
  AlertTriangle,
  Package,
  Check,
  Download,
  LayoutGrid,
} from 'lucide-react'
import type { StockProduct } from '@/types'
import { stockNotices } from '@/lib/notices'

type TabType = 'products' | 'alerts' | 'variants'

export default function Stock() {
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [showExportModal, setShowExportModal] = useState(false)
  const [adjustmentModalProduct, setAdjustmentModalProduct] = useState<StockProduct | null>(null)
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<{
    id: number
    name: string
  } | null>(null)
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

  const {
    data: variantsData,
    isLoading: isLoadingVariants,
    refetch: refetchVariants,
  } = useProductVariants(selectedProductForVariants?.id || null)

  const _updateStockMutation = useUpdateProductStock()

  // Helpers
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }, [])

  const getAlertSeverity = useCallback((diff: number): 'error' | 'warning' => {
    return diff > 5 ? 'warning' : 'error'
  }, [])

  const getStockBadgeVariant = useCallback((
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
  ): 'success' | 'warning' | 'error' => {
    if (status === 'in_stock') return 'success'
    if (status === 'low_stock') return 'warning'
    return 'error'
  }, [])

  const getStockLabel = useCallback((status: 'in_stock' | 'low_stock' | 'out_of_stock') => {
    if (status === 'in_stock') return 'En stock'
    if (status === 'low_stock') return 'Stock faible'
    return 'Rupture'
  }, [])

  // Actions
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    setPage(0)
    setSearch('')
    if (tab !== 'variants') {
      setSelectedProductForVariants(null)
    }
  }, [])

  const handleViewVariants = useCallback((product: StockProduct) => {
    setSelectedProductForVariants({ id: product.id, name: product.name })
    setActiveTab('variants')
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleCategoryFilterChange = useCallback((value: string) => {
    setCategoryFilter(value)
    setPage(0)
  }, [])

  const handleStatusFilterChange = useCallback((value: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => {
    setStatusFilter(value)
    setPage(0)
  }, [])

  const handleExportCSV = async () => {
    try {
      toast.info('Génération du fichier CSV en cours...')

      const response = await api.getStockProducts({ limit: 10000, offset: 0 })
      const allProds = (response?.items || response?.data || []) as StockProduct[]

      if (allProds.length === 0) {
        toast.warning('Aucune donnée à exporter')
        return
      }

      const headers = ['Nom', 'SKU', 'Catégorie', 'Stock Disponible', 'Stock Virtuel', 'Entrant', 'Sortant', 'Prix (€)', 'Statut']
      const rows = allProds.map(p => [
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

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `stock_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`${allProds.length} produits exportés avec succès`)
    } catch (error) {
      logger.error('Export CSV error:', error)
      toast.error("Erreur lors de l'export CSV")
    }
  }

  const handleExportValorisation = async () => {
    try {
      toast.info('Génération du rapport de valorisation...')

      const response = await api.getStockProducts({ limit: 10000, offset: 0 })
      const allProds = (response?.items || response?.data || []) as StockProduct[]

      if (allProds.length === 0) {
        toast.warning('Aucune donnée à exporter')
        return
      }

      const byCategory: Record<string, { count: number; totalQty: number; totalValue: number }> = {}
      allProds.forEach(p => {
        const cat = p.category || 'Sans catégorie'
        if (!byCategory[cat]) {
          byCategory[cat] = { count: 0, totalQty: 0, totalValue: 0 }
        }
        byCategory[cat].count++
        byCategory[cat].totalQty += p.qty_available
        byCategory[cat].totalValue += (p.list_price || 0) * p.qty_available
      })

      const headers = ['Catégorie', 'Nombre Produits', 'Total Unités', 'Valorisation (€)', 'Valeur Moyenne/Produit (€)']
      const rows = Object.entries(byCategory)
        .sort((a, b) => b[1].totalValue - a[1].totalValue)
        .map(([cat, data]) => [
          cat,
          data.count.toString(),
          data.totalQty.toString(),
          data.totalValue.toFixed(2),
          (data.totalValue / data.count).toFixed(2),
        ])

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
      logger.error('Export valorisation error:', error)
      toast.error("Erreur lors de l'export du rapport")
    }
  }

  // Computed data
  const allProducts = useMemo(() => (productsData?.items || productsData?.data || []) as StockProduct[], [productsData])
  const productsTotal = productsData?.total || 0

  const products = useMemo(() => allProducts.filter(p => {
    if (categoryFilter && p.category !== categoryFilter) return false
    if (statusFilter !== 'all' && p.stock_status !== statusFilter) return false
    return true
  }), [allProducts, categoryFilter, statusFilter])

  const uniqueCategories = useMemo(() => Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))), [allProducts])

  const alerts = alertsData?.data?.alerts || []
  const alertsTotal = alertsData?.data?.total || 0
  const highAlerts = highAlertsData?.data?.alerts || []
  const highAlertsTotal = highAlertsData?.data?.total || 0

  const { stockValue, totalItems, avgStockPerProduct, avgValuePerProduct } = useMemo(() => {
    const sv = products.reduce((sum, p) => sum + (p.list_price || 0) * p.qty_available, 0)
    const ti = products.reduce((sum, p) => sum + p.qty_available, 0)
    return {
      stockValue: sv,
      totalItems: ti,
      avgStockPerProduct: products.length > 0 ? ti / products.length : 0,
      avgValuePerProduct: products.length > 0 ? sv / products.length : 0,
    }
  }, [products])

  const valorisationByCategory = useMemo(() => Object.entries(
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
  ).sort((a, b) => b[1].totalValue - a[1].totalValue), [allProducts])

  const isLoading = activeTab === 'products' ? isLoadingProducts : (isLoadingAlerts || isLoadingHighAlerts)
  const error = activeTab === 'products' ? errorProducts : errorAlerts

  return (
    <Layout>
      <div className="p-4 md:p-8">
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
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setShowExportModal(true)}
              icon={<Download className="h-5 w-5" />}
              className="bg-green-600 hover:bg-green-700"
            >
              Exporter CSV
            </Button>
            <Link to="/stock/moves">
              <Button variant="secondary" className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Voir les mouvements
              </Button>
            </Link>
          </div>
        </div>

        <PageNotice config={stockNotices.products} className="mb-6" />

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('products')}
                className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Package className="h-5 w-5" aria-hidden="true" />
                Tous les Produits
                {productsTotal > 0 && (
                  <Badge variant="info" className="ml-2">{productsTotal}</Badge>
                )}
              </button>

              <button
                onClick={() => handleTabChange('alerts')}
                className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'alerts'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                Alertes Stock Bas
                {alertsTotal > 0 && (
                  <Badge variant="error" className="ml-2">{alertsTotal}</Badge>
                )}
              </button>

              <button
                onClick={() => handleTabChange('variants')}
                className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'variants'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <LayoutGrid className="h-5 w-5" aria-hidden="true" />
                Variantes
                {selectedProductForVariants && (
                  <Badge variant="info" className="ml-2">1 produit</Badge>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={10} columns={activeTab === 'products' ? 7 : 6} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400" role="alert">
              Erreur lors du chargement des données
            </div>
          ) : activeTab === 'products' && products.length > 0 ? (
            <StockProductsTab
              products={products}
              productsTotal={productsTotal}
              page={page}
              limit={limit}
              search={search}
              categoryFilter={categoryFilter}
              statusFilter={statusFilter}
              uniqueCategories={uniqueCategories as string[]}
              stockValue={stockValue}
              totalItems={totalItems}
              avgStockPerProduct={avgStockPerProduct}
              avgValuePerProduct={avgValuePerProduct}
              valorisationByCategory={valorisationByCategory}
              isLoading={isLoadingProducts}
              formatPrice={formatPrice}
              getStockBadgeVariant={getStockBadgeVariant}
              getStockLabel={getStockLabel}
              onSearchChange={handleSearchChange}
              onCategoryFilterChange={handleCategoryFilterChange}
              onStatusFilterChange={handleStatusFilterChange}
              onPageChange={setPage}
              onAdjustStock={setAdjustmentModalProduct}
              onViewVariants={handleViewVariants}
              onExportCSV={handleExportCSV}
              onExportValorisation={handleExportValorisation}
            />
          ) : activeTab === 'alerts' && (alerts.length > 0 || highAlerts.length > 0) ? (
            <StockAlertsTab
              alerts={alerts}
              alertsTotal={alertsTotal}
              highAlerts={highAlerts}
              highAlertsTotal={highAlertsTotal}
              page={page}
              limit={limit}
              isLoading={isLoadingAlerts || isLoadingHighAlerts}
              formatPrice={formatPrice}
              getAlertSeverity={getAlertSeverity}
              onPageChange={setPage}
            />
          ) : activeTab === 'variants' ? (
            <StockVariantsTab
              selectedProduct={selectedProductForVariants}
              variantsData={variantsData}
              isLoadingVariants={isLoadingVariants}
              onBack={() => {
                setSelectedProductForVariants(null)
                setActiveTab('products')
              }}
              onRefetchVariants={() => refetchVariants()}
              onGoToProducts={() => setActiveTab('products')}
            />
          ) : (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
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

      {/* Modal Export Stock */}
      <ExportStockModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Modal Ajustement Stock */}
      {adjustmentModalProduct && (
        <StockAdjustmentModal
          isOpen={!!adjustmentModalProduct}
          onClose={() => setAdjustmentModalProduct(null)}
          product={adjustmentModalProduct}
          onSuccess={() => setAdjustmentModalProduct(null)}
        />
      )}
    </Layout>
  )
}
