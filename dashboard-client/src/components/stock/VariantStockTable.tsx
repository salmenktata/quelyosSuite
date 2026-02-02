/**
 * Tableau de gestion du stock des variantes
 *
 * Permet d'ajuster le stock de chaque variante d'un produit
 */

import { useState } from 'react'
import { useUpdateVariantStock } from '../../hooks/useStock'
import { useToast } from '../../hooks/useToast'
import { Pencil, Check, X } from 'lucide-react'

interface ProductVariant {
  id: number
  name: string
  display_name: string
  default_code?: string
  barcode?: string
  qty_available: number
  virtual_available?: number
  standard_price?: number
  list_price: number
  image?: string | null
  attributevalues: Array<{
    id?: number
    name?: string
    attribute_id?: number
    attribute_name: string
    value_name?: string
  }>
}

interface Props {
  productId: number
  variants: ProductVariant[]
  onStockUpdated?: () => void
}

export function VariantStockTable({ productId, variants, onStockUpdated }: Props) {
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null)
  const [editingQuantity, setEditingQuantity] = useState<string>('')
  const updateStockMutation = useUpdateVariantStock()
  const { success, error: showError } = useToast()

  const handleStartEdit = (variantId: number, currentQty: number) => {
    setEditingVariantId(variantId)
    setEditingQuantity(currentQty.toString())
  }

  const handleCancelEdit = () => {
    setEditingVariantId(null)
    setEditingQuantity('')
  }

  const handleSaveEdit = async (variantId: number) => {
    const quantity = parseFloat(editingQuantity)

    if (isNaN(quantity) || quantity < 0) {
      showError('Quantité invalide')
      return
    }

    try {
      await updateStockMutation.mutateAsync({ productId, variantId, quantity })
      success('Stock de la variante mis à jour avec succès')
      setEditingVariantId(null)
      setEditingQuantity('')
      onStockUpdated?.()
    } catch (error) {
      showError('Erreur lors de la mise à jour du stock')
    }
  }

  // Formater les attributs pour affichage
  const formatAttributes = (variant: ProductVariant) => {
    if (!variant.attributevalues || variant.attributevalues.length === 0) {
      return 'Variante unique'
    }
    return variant.attributevalues.map((av) => av.value_name).join(', ')
  }

  // Badge de statut stock
  const getStockBadge = (qty: number) => {
    if (qty <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          Rupture
        </span>
      )
    } else if (qty < 10) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          Stock faible
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          En stock
        </span>
      )
    }
  }

  if (variants.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Ce produit n'a pas de variantes
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Variante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock Actuel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock Virtuel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prix (€)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {variants.map((variant) => (
              <tr
                key={variant.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatAttributes(variant)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {variant.id}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {variant.default_code || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingVariantId === variant.id ? (
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editingQuantity}
                      onChange={(e) => setEditingQuantity(e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {variant.qty_available}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {variant.virtual_available}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {variant.list_price.toFixed(2)} €
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStockBadge(variant.qty_available)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingVariantId === variant.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSaveEdit(variant.id)}
                        disabled={updateStockMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Valider
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updateStockMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(variant.id, variant.qty_available)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {variants.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{variants.length}</span> variante
            {variants.length > 1 ? 's' : ''} au total
          </p>
        </div>
      )}
    </div>
  )
}
