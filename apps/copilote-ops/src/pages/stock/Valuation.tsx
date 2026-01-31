/**
 * Page Valorisation Stock - Rapport coûts inventaire
 *
 * Fonctionnalités :
 * - Rapport valorisation inventaire complet
 * - Filtres par emplacement et catégorie
 * - Vue détaillée par produit avec coûts unitaires
 * - Export CSV
 * - KPI : Valeur totale, nombre d'articles
 *
 * Module OCA : stock_quant_cost_info
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { stockNotices } from '@/lib/notices'
import { Download, DollarSign, Package, TrendingUp } from 'lucide-react'

export default function StockValuation() {
  const [locationFilter, setLocationFilter] = useState<number | undefined>()
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>()

  // TODO: Créer hook useStockCostReport
  const isLoading = false
  const error = null
  const data = {
    total_value: 125430.50,
    currency: 'EUR',
    items_count: 234,
    items: [
      {
        product_name: 'Ordinateur Portable Dell XPS 13',
        product_sku: 'DELL-XPS13',
        quantity: 15,
        unit_cost: 1200.00,
        total_cost: 18000.00,
        location_name: 'Entrepôt Principal / Zone A',
      },
      {
        product_name: 'Souris Logitech MX Master 3',
        product_sku: 'LOG-MX3',
        quantity: 45,
        unit_cost: 89.99,
        total_cost: 4049.55,
        location_name: 'Entrepôt Principal / Zone B',
      },
    ],
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/' },
            { label: 'Stock', href: '/stock' },
            { label: 'Valorisation' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Valorisation Stock
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Rapport de valorisation inventaire avec coûts détaillés
            </p>
          </div>
          <Button variant="secondary" icon={<Download className="h-5 w-5" />}>
            Export CSV
          </Button>
        </div>

        <PageNotice config={stockNotices.valuation} className="mb-6" />

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Valeur Totale</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  {data.total_value.toLocaleString('fr-FR', { style: 'currency', currency: data.currency })}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Articles Valorisés</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {data.items_count}
                </p>
              </div>
              <Package className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coût Moyen</p>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-2">
                  {(data.total_value / data.items_count).toFixed(2)} {data.currency}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-violet-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Emplacement
              </label>
              <select
                value={locationFilter || ''}
                onChange={(e) => setLocationFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Tous les emplacements</option>
                {/* TODO: Charger depuis API */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Catégorie Produit
              </label>
              <select
                value={categoryFilter || ''}
                onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Toutes les catégories</option>
                {/* TODO: Charger depuis API */}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <SkeletonTable rows={10} columns={6} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200">Erreur : {error.message}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Emplacement
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Coût Unitaire
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Coût Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.product_sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.location_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {item.unit_cost.toFixed(2)} {data.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.total_cost.toFixed(2)} {data.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
