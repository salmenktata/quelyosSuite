import { useState, useMemo } from "react"
import { ModularLayout } from "@/components/ModularLayout"
import {
  Package,
  TrendingUp,
  Warehouse,
  Tag,
  Download,
  Calendar,
  DollarSign
} from "lucide-react"
import { useStockValuation } from "@/hooks/finance/useStockValuation"
import { useCurrency } from "@/lib/finance/CurrencyContext"
import { GlassCard, GlassStatCard } from "@/components/ui/glass"
import { logger } from '@quelyos/logger'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TimeRange {
  label: string
  value: string
}

const TIME_RANGES: TimeRange[] = [
  { label: "Aujourd'hui", value: new Date().toISOString().split('T')[0] },
  { label: "Hier", value: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
  { label: "Il y a 7 jours", value: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] },
  { label: "Il y a 30 jours", value: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function StockValuationPage() {
  const { formatAmount } = useCurrency()
  const [selectedDate, setSelectedDate] = useState<string>(TIME_RANGES[0].value)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>()
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()

  const { data, isLoading, error } = useStockValuation({
    warehouse_id: selectedWarehouse,
    category_id: selectedCategory,
    date: selectedDate
  })

  const kpis = data?.kpis
  const byWarehouse = data?.by_warehouse || []
  const byCategory = data?.by_category || []

  // Export CSV
  const handleExportCSV = () => {
    if (!data) return

    const rows = [
      ['Type', 'Nom', 'Valeur Totale', 'Quantité Totale', 'Nombre Produits'],
      ...byWarehouse.map(w => ['Entrepôt', w.warehouse_name, w.total_value, w.total_qty, w.product_count]),
      ...byCategory.map(c => ['Catégorie', c.category_name, c.total_value, c.total_qty, c.product_count])
    ]

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `valorisation-stock-${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ModularLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Valorisation du Stock</h1>
            <p className="mt-1 text-sm text-gray-500">
              Vue d'ensemble de la valeur du stock par entrepôt et catégorie
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline mr-2 h-4 w-4" />
                Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {TIME_RANGES.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
            {/* TODO: Ajouter filtres entrepôt et catégorie */}
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
              title="Valeur Totale"
              value={formatAmount(kpis.total_value)}
              icon={<DollarSign className="h-5 w-5 text-green-600" />}
              trend={{ value: 0, isPositive: true }}
            />
            <GlassStatCard
              title="Quantité Totale"
              value={`${kpis.total_qty.toFixed(0)} unités`}
              icon={<Package className="h-5 w-5 text-blue-600" />}
            />
            <GlassStatCard
              title="Valeur Moyenne / Produit"
              value={formatAmount(kpis.avg_value_per_product)}
              icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            />
            <GlassStatCard
              title="Nombre de Produits"
              value={kpis.product_count.toString()}
              icon={<Tag className="h-5 w-5 text-orange-600" />}
            />
          </div>
        ) : null}

        {/* Breakdown par Entrepôt */}
        {byWarehouse.length > 0 && (
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Warehouse className="mr-2 h-5 w-5 text-blue-600" />
                Valorisation par Entrepôt
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrepôt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur Totale
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {byWarehouse.map((warehouse) => (
                    <tr key={warehouse.warehouse_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {warehouse.warehouse_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                        {formatAmount(warehouse.total_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {warehouse.total_qty.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {warehouse.product_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Breakdown par Catégorie */}
        {byCategory.length > 0 && (
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Tag className="mr-2 h-5 w-5 text-purple-600" />
                Valorisation par Catégorie
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur Totale
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {byCategory.map((category) => (
                    <tr key={category.category_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                        {formatAmount(category.total_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {category.total_qty.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {category.product_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </ModularLayout>
  )
}
