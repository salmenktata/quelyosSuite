/**
 * Grille de produits POS avec touch targets optimisés
 */

import { Package, Loader2 } from 'lucide-react'
import type { POSProduct, POSCategory } from '../../types/pos'

interface ProductGridProps {
  products: POSProduct[]
  categories: POSCategory[]
  isLoading: boolean
  selectedCategory: number | null
  onCategoryChange: (categoryId: number | null) => void
  onProductClick: (product: POSProduct) => void
}

export function ProductGrid({
  products,
  categories,
  isLoading,
  selectedCategory,
  onCategoryChange,
  onProductClick,
}: ProductGridProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-teal-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Tous
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Package className="h-16 w-16 mb-3" />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProductCardProps {
  product: POSProduct
  onClick: () => void
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const isOutOfStock = product.type === 'product' && product.stockQuantity <= 0

  return (
    <button
      onClick={onClick}
      disabled={isOutOfStock}
      className={`
        relative flex flex-col bg-white dark:bg-gray-800 rounded-xl border
        border-gray-200 dark:border-gray-700 overflow-hidden
        transition-all duration-150
        min-h-[120px] p-3
        ${isOutOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-teal-500 hover:shadow-lg active:scale-95'
        }
      `}
    >
      {/* Product image */}
      {product.imageUrl ? (
        <div className="w-full h-16 mb-2 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-16 mb-2 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
      )}

      {/* Product info */}
      <div className="flex-1 flex flex-col justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 text-left">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">
          {product.price.toFixed(2)} TND
        </p>
      </div>

      {/* Stock indicator */}
      {product.type === 'product' && (
        <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${
          isOutOfStock
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : product.stockQuantity <= 5
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {isOutOfStock ? 'Rupture' : product.stockQuantity}
        </div>
      )}
    </button>
  )
}
