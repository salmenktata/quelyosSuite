import { Link } from 'react-router-dom'
import { Badge, Button, Input } from '@/components/common'
import {
  ShoppingBag,
  Download,
  X,
  LayoutGrid,
} from 'lucide-react'
import type { StockProduct } from '@/types'

interface StockProductsTabProps {
  products: StockProduct[]
  productsTotal: number
  page: number
  limit: number
  search: string
  categoryFilter: string
  statusFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  uniqueCategories: string[]
  stockValue: number
  totalItems: number
  avgStockPerProduct: number
  avgValuePerProduct: number
  valorisationByCategory: [string, { count: number; totalQty: number; totalValue: number }][]
  isLoading: boolean
  formatPrice: (price: number) => string
  getStockBadgeVariant: (status: 'in_stock' | 'low_stock' | 'out_of_stock') => 'success' | 'warning' | 'error'
  getStockLabel: (status: 'in_stock' | 'low_stock' | 'out_of_stock') => string
  onSearchChange: (value: string) => void
  onCategoryFilterChange: (value: string) => void
  onStatusFilterChange: (value: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void
  onPageChange: (page: number) => void
  onAdjustStock: (product: StockProduct) => void
  onViewVariants: (product: StockProduct) => void
  onExportCSV: () => void
  onExportValorisation: () => void
}

export function StockProductsTab({
  products,
  productsTotal,
  page,
  limit,
  search,
  categoryFilter,
  statusFilter,
  uniqueCategories,
  stockValue,
  totalItems,
  avgStockPerProduct,
  avgValuePerProduct,
  valorisationByCategory,
  isLoading,
  formatPrice,
  getStockBadgeVariant,
  getStockLabel,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onPageChange,
  onAdjustStock,
  onViewVariants,
  onExportCSV,
  onExportValorisation,
}: StockProductsTabProps) {
  return (
    <>
      {/* Statistics Cards */}
      {!isLoading && products.length > 0 && (
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
      {!isLoading && products.length > 0 && valorisationByCategory.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Valorisation par Catégorie
            </h3>
            <Button
              variant="secondary"
              onClick={onExportValorisation}
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produits</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unités</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valorisation</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {valorisationByCategory.slice(0, 10).map(([category, data]) => (
                  <tr key={category} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-900 dark:text-white">{data.count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-900 dark:text-white">{data.totalQty.toLocaleString('fr-FR')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(data.totalValue)}</span>
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

      {/* Search bar & Filters */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <Input
          type="text"
          placeholder="Rechercher un produit (nom ou SKU)..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[250px]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          aria-label="Filtrer par catégorie"
        >
          <option value="">Toutes catégories</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous statuts</option>
          <option value="in_stock">En stock</option>
          <option value="low_stock">Stock faible</option>
          <option value="out_of_stock">Rupture</option>
        </select>
        <Button
          variant="secondary"
          onClick={onExportCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Exporter CSV
        </Button>
      </div>

      {/* Active Filters */}
      {(categoryFilter || statusFilter !== 'all') && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Filtres actifs:
          </span>
          {categoryFilter && (
            <Badge variant="info" className="flex items-center gap-1">
              Catégorie: {categoryFilter}
              <button
                onClick={() => onCategoryFilterChange('')}
                className="ml-1 hover:text-red-600"
                aria-label="Retirer le filtre catégorie"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="info" className="flex items-center gap-1">
              Statut: {getStockLabel(statusFilter)}
              <button
                onClick={() => onStatusFilterChange('all')}
                className="ml-1 hover:text-red-600"
                aria-label="Retirer le filtre statut"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Products Table */}
      {products.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-gray-400" aria-hidden="true" />
                          </div>
                        )}
                        <div>
                          <Link to={`/products/${product.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                            {product.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white font-mono">{product.sku || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{product.category || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAdjustStock(product)}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Ajuster le stock"
                        >
                          Ajuster
                        </button>
                        <button
                          onClick={() => onViewVariants(product)}
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                          title="Voir les variantes"
                          aria-label={`Voir les variantes de ${product.name}`}
                        >
                          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
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
                Affichage {page * limit + 1} à {Math.min((page + 1) * limit, productsTotal)} sur {productsTotal}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>
                  Précédent
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={(page + 1) * limit >= productsTotal}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
