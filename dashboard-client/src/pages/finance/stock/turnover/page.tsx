import { useState, useMemo } from "react"
import { ModularLayout } from "@/components/ModularLayout"
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  ChevronDown
} from "lucide-react"
import { useStockTurnover } from "@/hooks/finance/useStockTurnover"
import { GlassCard, GlassStatCard } from "@/components/ui/glass"
import type { TurnoverStatus } from "@/types/stock"
import { logger } from '@quelyos/logger'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<TurnoverStatus, { label: string; color: string; bgColor: string }> = {
  excellent: { label: 'Excellent', color: 'text-green-800', bgColor: 'bg-green-100' },
  good: { label: 'Bon', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  slow: { label: 'Lent', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  dead: { label: 'Dormant', color: 'text-red-800', bgColor: 'bg-red-100' },
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: TurnoverStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function StockTurnoverPage() {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })
  const [statusFilter, setStatusFilter] = useState<TurnoverStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>()
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

  // Export CSV
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
        STATUS_CONFIG[p.status].label
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
    <ModularLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rotation du Stock</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analyse de la rotation des produits avec classification automatique
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !data}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Filtres */}
        <GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Début
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Date Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Fin
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Filtre Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="inline mr-2 h-4 w-4" />
                Statut Rotation
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as TurnoverStatus | 'all')
                  setPage(0)
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="excellent">Excellent (≥12)</option>
                <option value="good">Bon (6-12)</option>
                <option value="slow">Lent (2-6)</option>
                <option value="dead">Dormant (&lt;2)</option>
              </select>
            </div>

            {/* TODO: Filtre Catégorie */}
          </div>

          {/* Presets dates rapides */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDateRange({
                start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
            >
              7 derniers jours
            </button>
            <button
              onClick={() => setDateRange({
                start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
            >
              30 derniers jours
            </button>
            <button
              onClick={() => setDateRange({
                start_date: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
            >
              90 derniers jours
            </button>
          </div>
        </GlassCard>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Erreur: {error.message}</p>
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassStatCard
              title="Ratio Rotation Moyen"
              value={kpis.avg_turnover_ratio.toFixed(2)}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            />
            <GlassStatCard
              title="Produits à Rotation Lente"
              value={kpis.slow_movers_count.toString()}
              icon={<Clock className="h-5 w-5 text-orange-600" />}
            />
            <GlassStatCard
              title="Stock Dormant"
              value={kpis.dead_stock_count.toString()}
              icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            />
            <GlassStatCard
              title="Ventes Totales"
              value={`${kpis.total_sales_qty.toFixed(0)} unités`}
              icon={<Package className="h-5 w-5 text-blue-600" />}
            />
          </div>
        ) : null}

        {/* Tableau Produits */}
        {products.length > 0 && (
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Produits ({total} résultats)
              </h3>
              <p className="text-sm text-gray-500">
                Période de {kpis?.period_days} jours
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Vendue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Moyen
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ratio Rotation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jours de Stock
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {product.qty_sold.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {product.avg_stock.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className="font-semibold text-gray-900">
                          {product.turnover_ratio.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {product.days_of_stock >= 999 ? '∞' : product.days_of_stock.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={product.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-700">
                  Page {page + 1} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </GlassCard>
        )}

        {/* Légende */}
        <GlassCard>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Classification des Statuts</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <StatusBadge status="excellent" />
              <p className="mt-1 text-gray-600">Ratio ≥ 12 (stock &lt; 30 jours)</p>
            </div>
            <div>
              <StatusBadge status="good" />
              <p className="mt-1 text-gray-600">Ratio 6-12 (stock 30-60 jours)</p>
            </div>
            <div>
              <StatusBadge status="slow" />
              <p className="mt-1 text-gray-600">Ratio 2-6 (stock 60-180 jours)</p>
            </div>
            <div>
              <StatusBadge status="dead" />
              <p className="mt-1 text-gray-600">Ratio &lt; 2 (stock &gt; 180 jours)</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </ModularLayout>
  )
}
