import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Image as ImageIcon, Copy, Archive, RefreshCw } from 'lucide-react'
import { Button, Badge, BackendImage } from '@/components/common'
import type { Product } from '@/types'

interface ProductTableRowProps {
  product: Product
  isSelected: boolean
  onToggleSelect: (id: number) => void
  onDuplicate: (product: Product) => void
  onArchive: (product: Product) => void
  onDelete: (product: Product) => void
  archiveLoading: boolean
  deleteLoading: boolean
  getStockBadge: (status: string, qty: number) => React.ReactNode
}

export const ProductTableRow = memo(function ProductTableRow({
  product,
  isSelected,
  onToggleSelect,
  onDuplicate,
  onArchive,
  onDelete,
  archiveLoading,
  deleteLoading,
  getStockBadge,
}: ProductTableRowProps) {
  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
      }`}
    >
      <td className="px-4 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
          aria-label={`Sélectionner ${product.name}`}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 shrink-0">
            <BackendImage
              src={product.image ?? null}
              alt={product.name}
              className="h-10 w-10 rounded object-cover"
              fallback={
                <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              }
            />
          </div>
          <div className="ml-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${product.active === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                {product.name}
              </span>
              {product.active === false && (
                <Badge variant="neutral">Archivé</Badge>
              )}
            </div>
            {product.variant_count && product.variant_count > 1 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {product.variant_count} variantes
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
          {product.default_code || '—'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {product.category ? (
          <Badge variant="info">{product.category.name}</Badge>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Sans catégorie
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {product.price?.toFixed(2)} €
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStockBadge(product.stock_status ?? "out_of_stock", product.qty_available ?? 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(product)}
            title="Dupliquer"
            icon={<Copy className="w-4 h-4" />}
          >
            <span className="sr-only">Dupliquer</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(product)}
            disabled={archiveLoading}
            title={product.active === false ? 'Désarchiver' : 'Archiver'}
            icon={
              product.active === false ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Archive className="w-4 h-4" />
              )
            }
          >
            <span className="sr-only">{product.active === false ? 'Désarchiver' : 'Archiver'}</span>
          </Button>
          <Link to={`/products/${product.id}/edit`}>
            <Button variant="ghost" size="sm">
              Modifier
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(product)}
            disabled={deleteLoading}
          >
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
  )
})
