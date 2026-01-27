/**
 * Page : Analyse ABC Stock (Pareto 80-20)
 *
 * Classification des produits selon leur contribution à la valeur du stock :
 * - Catégorie A: 20% produits = 80% valeur
 * - Catégorie B: 30% produits = 15% valeur
 * - Catégorie C: 50% produits = 5% valeur
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { useABCAnalysis } from '@/hooks/useStockAdvanced'
import { ABCAnalysisParams, ABCCategory } from '@/types/stock'

export default function ABCAnalysis() {
  const [params, setParams] = useState<ABCAnalysisParams>({
    threshold_a: 80,
    threshold_b: 95,
  })
  const [selectedCategory, setSelectedCategory] = useState<ABCCategory | 'all'>('all')

  const { data, isLoading, error } = useABCAnalysis(params)

  const filteredProducts =
    data?.products.filter((p) => selectedCategory === 'all' || p.category === selectedCategory) ||
    []

  const getCategoryBadge = (category: ABCCategory) => {
    const styles = {
      A: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      B: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      C: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[category]}`}>
        {category}
      </span>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  return (
    <Layout title="Analyse ABC">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analyse ABC (Pareto)
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Classification des produits par contribution à la valeur du stock
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            📊 Règle de Pareto 80-20
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>
              <strong>Catégorie A :</strong> 20% des produits représentent 80% de la valeur (haute
              priorité)
            </li>
            <li>
              <strong>Catégorie B :</strong> 30% des produits représentent 15% de la valeur
              (priorité moyenne)
            </li>
            <li>
              <strong>Catégorie C :</strong> 50% des produits représentent 5% de la valeur
              (priorité basse)
            </li>
          </ul>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seuil catégorie A (%)
              </label>
              <input
                type="number"
                value={params.threshold_a}
                onChange={(e) =>
                  setParams({ ...params, threshold_a: parseFloat(e.target.value) || 80 })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={1}
                max={100}
                step={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seuil catégorie B (%)
              </label>
              <input
                type="number"
                value={params.threshold_b}
                onChange={(e) =>
                  setParams({ ...params, threshold_b: parseFloat(e.target.value) || 95 })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={1}
                max={100}
                step={5}
              />
            </div>
          </div>
        </div>

        {/* KPIs */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Valeur totale
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {formatCurrency(data.kpis.total_value)}
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                {data.kpis.total_products} produits
              </p>
            </div>

            {/* Catégorie A */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Catégorie A
                </p>
                {getCategoryBadge('A')}
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                {data.kpis.category_a.value_pct}%
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {data.kpis.category_a.count} produits ({data.kpis.category_a.count_pct}%)
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 font-medium mt-1">
                {formatCurrency(data.kpis.category_a.value)}
              </p>
            </div>

            {/* Catégorie B */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  Catégorie B
                </p>
                {getCategoryBadge('B')}
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                {data.kpis.category_b.value_pct}%
              </p>
              <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
                {data.kpis.category_b.count} produits ({data.kpis.category_b.count_pct}%)
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-300 font-medium mt-1">
                {formatCurrency(data.kpis.category_b.value)}
              </p>
            </div>

            {/* Catégorie C */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Catégorie C
                </p>
                {getCategoryBadge('C')}
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {data.kpis.category_c.value_pct}%
              </p>
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                {data.kpis.category_c.count} produits ({data.kpis.category_c.count_pct}%)
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 font-medium mt-1">
                {formatCurrency(data.kpis.category_c.value)}
              </p>
            </div>
          </div>
        )}

        {/* Filtres catégories */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedCategory('A')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'A'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Catégorie A
            </button>
            <button
              onClick={() => setSelectedCategory('B')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'B'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Catégorie B
            </button>
            <button
              onClick={() => setSelectedCategory('C')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'C'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Catégorie C
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Erreur : {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          </div>
        )}

        {/* Tableau des produits */}
        {data && !isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Prix coût
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Valeur stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    % Valeur
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    % Cumulé
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      {product.sku && (
                        <div className="text-xs text-gray-400">{product.sku}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getCategoryBadge(product.category)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {product.qty}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                      {formatCurrency(product.standard_price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(product.value)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-300">
                      {product.value_pct}%
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-blue-600 dark:text-blue-400 font-medium">
                      {product.cumulative_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun produit dans cette catégorie
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        {data && (
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{filteredProducts.length}</strong> produits affichés sur{' '}
              <strong>{data.products.length}</strong> au total
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
