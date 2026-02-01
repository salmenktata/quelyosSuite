/**
 * Page Rotation Stock - Analyse de la rotation des produits
 *
 * Fonctionnalités :
 * - Calcul du ratio de rotation par produit
 * - Classification automatique (excellent, bon, lent, dormant)
 * - Filtres par période et statut
 * - KPIs agrégés (rotation moyenne, stock dormant)
 * - Export CSV des données
 * - Pagination des résultats
 */

import { useState } from "react"
import { Layout } from "@/components/Layout"
import { Breadcrumbs, Badge, PageNotice } from "@/components/common"
import { stockNotices } from "@/lib/notices"
import {
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
  Filter
} from "lucide-react"
import { useStockTurnover } from "@/hooks/finance/useStockTurnover"
import type { TurnoverStatus } from "@/types/stock"

const STATUS_CONFIG: Record<TurnoverStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'error' }> = {
  excellent: { label: 'Excellent', variant: 'success' },
  good: { label: 'Bon', variant: 'info' },
  slow: { label: 'Lent', variant: 'warning' },
  dead: { label: 'Dormant', variant: 'error' },
}

export default function StockTurnoverPage() {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })
  const [statusFilter, setStatusFilter] = useState<TurnoverStatus | 'all'>('all')
  const [categoryFilter, _setCategoryFilter] = useState<number | undefined>()
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading, error } = useStockTurnover({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    category_id: categoryFilter,
    status_filter: statusFilter === 'all' ? undefined : statusFilter,
    limit,
    offset: page * limit
  })

  const kpis = data?.kpis
  const products = data?.products || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleExportCSV = () => {
    if (!data) return

    const rows = [
      ['Produit', 'SKU', 'Qty Vendue', 'Stock Moyen', 'Ratio Rotation', 'Jours Stock', 'Statut'],
      ...products.map(p => [
        p.name,
        p.sku,
        p.qty_sold,
        p.avg_stock,
        p.turnover_ratio,
        p.days_of_stock,
        p.status ? STATUS_CONFIG[p.status].label : 'N/A'
      ])
    ]

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rotation-stock-${dateRange.start_date}-${dateRange.end_date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Rotation' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Rotation du Stock
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Analyse de la rotation des produits avec classification automatique
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !data}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Notice */}
        <PageNotice config={stockNotices.turnover} className="mb-6" />

        {/* Filtres */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Début */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Date Début
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Date Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Date Fin
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Filtre Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                <Filter className="inline mr-2 h-4 w-4" />
                Statut Rotation
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as TurnoverStatus | 'all')
                  setPage(0)
                }}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="excellent">Excellent (≥12)</option>
                <option value="good">Bon (6-12)</option>
                <option value="slow">Lent (2-6)</option>
                <option value="dead">Dormant (&lt;2)</option>
              </select>
            </div>
          </div>

          {/* Presets dates rapides */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDateRange({
                start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
            >
              7 derniers jours
            </button>
            <button
              onClick={() => setDateRange({
                start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
            >
              30 derniers jours
            </button>
            <button
              onClick={() => setDateRange({
                start_date: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
            >
              90 derniers jours
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg h-32" />
            ))}
          </div>
        ) : error ? (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">Erreur : {error.message}</p>
          </div>
        ) : kpis ? (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Ratio Rotation Moyen</p>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mt-2">
                {kpis.avg_turnover_ratio.toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Produits à Rotation Lente</p>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {kpis.slow_movers_count}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Stock Dormant</p>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                {kpis.dead_stock_count}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Ventes Totales</p>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mt-2">
                {kpis.total_sales_qty.toFixed(0)} unités
              </p>
            </div>
          </div>
        ) : null}

        {/* Tableau Produits */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          </div>
        ) : error ? null : products.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucune donnée pour la période sélectionnée
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-gray-100">
                Produits ({total} résultats)
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Période de {kpis?.period_days} jours
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Qty Vendue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock Moyen
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ratio Rotation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Jours de Stock
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-100">{product.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white dark:text-gray-100">
                        {product.qty_sold?.toFixed(0) || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {product.avg_stock?.toFixed(0) || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className="font-semibold text-gray-900 dark:text-white dark:text-gray-100">
                          {product.turnover_ratio?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {product.days_of_stock !== undefined && product.days_of_stock >= 999 ? '∞' : product.days_of_stock?.toFixed(0) || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={product.status ? STATUS_CONFIG[product.status].variant : 'info'}>
                          {product.status ? STATUS_CONFIG[product.status].label : 'N/A'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
                  Page {page + 1} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
