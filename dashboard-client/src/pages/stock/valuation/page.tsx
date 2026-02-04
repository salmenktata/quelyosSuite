/**
 * Page Valorisation Stock - Vue d'ensemble de la valeur du stock
 *
 * Fonctionnalités :
 * - Valorisation totale du stock
 * - Breakdown par entrepôt
 * - Breakdown par catégorie
 * - Filtres par date
 * - Export CSV des données
 * - KPIs (valeur totale, quantité, valeur moyenne)
 */

import { useState } from "react"
import { Layout } from "@/components/Layout"
import { Breadcrumbs, PageNotice, Button } from "@/components/common"
import { stockNotices } from "@/lib/notices"
import {
  Package,
  TrendingUp,
  Warehouse,
  Tag,
  Download,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { useStockValuation } from "@/hooks/finance/useStockValuation"
import { useCurrency } from "@/lib/finance/CurrencyContext"

interface TimeRange {
  label: string
  value: string
}

const TIME_RANGES: TimeRange[] = [
  { label: "Aujourd'hui", value: new Date().toISOString().split('T')[0]! },
  { label: "Hier", value: new Date(Date.now() - 86400000).toISOString().split('T')[0]! },
  { label: "Il y a 7 jours", value: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]! },
  { label: "Il y a 30 jours", value: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]! },
]

export default function StockValuationPage() {
  const { formatAmount } = useCurrency()
  const [selectedDate, setSelectedDate] = useState<string>(TIME_RANGES[0]!.value)
  const [selectedWarehouse, _setSelectedWarehouse] = useState<number | undefined>()
  const [selectedCategory, _setSelectedCategory] = useState<number | undefined>()

  const { data, isLoading, error,refetch, refetch } = useStockValuation({
    warehouse_id: selectedWarehouse,
    category_id: selectedCategory,
    date: selectedDate
  })

  const kpis = data?.kpis
  const byWarehouse = data?.by_warehouse || []
  const byCategory = data?.by_category || []

  const handleExportCSV = () => {
    if (!data) return

    const rows = [
      ['Type', 'Nom', 'Valeur Totale', 'Quantité Totale', 'Nombre Produits'],
      ...byWarehouse.map(w => ['Entrepôt', w.warehouse_name, w.totalvalue, w.total_qty, w.product_count]),
      ...byCategory.map(c => ['Catégorie', c.category_name, c.totalvalue, c.total_qty, c.product_count])
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
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Valorisation' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Valorisation du Stock
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Vue d'ensemble de la valeur du stock par entrepôt et catégorie
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
        <PageNotice config={stockNotices.valuation} className="mb-6" />

        {/* Filtres */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                <Calendar className="inline mr-2 h-4 w-4" />
                Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {TIME_RANGES.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
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
          <div
            role="alert"
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement de la valorisation du stock.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        ) : kpis ? (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Valeur Totale</p>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mt-2">
                {formatAmount(kpis.totalvalue)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Quantité Totale</p>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mt-2">
                {kpis.total_qty.toFixed(0)} unités
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Valeur Moy. / Produit</p>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mt-2">
                {formatAmount(kpis.avgvalue_per_product)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Nombre de Produits</p>
                <Tag className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100 mt-2">
                {kpis.product_count}
              </p>
            </div>
          </div>
        ) : null}

        {/* Breakdown par Entrepôt */}
        {byWarehouse.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-gray-100 flex items-center">
                <Warehouse className="mr-2 h-5 w-5 text-blue-600" />
                Valorisation par Entrepôt
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entrepôt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valeur Totale
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {byWarehouse.map((warehouse) => (
                    <tr key={warehouse.warehouse_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white dark:text-gray-100">
                        {warehouse.warehouse_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white dark:text-gray-100 font-semibold">
                        {formatAmount(warehouse.totalvalue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {warehouse.total_qty.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {warehouse.product_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Breakdown par Catégorie */}
        {byCategory.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-gray-100 flex items-center">
                <Tag className="mr-2 h-5 w-5 text-purple-600" />
                Valorisation par Catégorie
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valeur Totale
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {byCategory.map((category) => (
                    <tr key={category.category_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white dark:text-gray-100">
                        {category.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white dark:text-gray-100 font-semibold">
                        {formatAmount(category.totalvalue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {category.total_qty.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                        {category.product_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
