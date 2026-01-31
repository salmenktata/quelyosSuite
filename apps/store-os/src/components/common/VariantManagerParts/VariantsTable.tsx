import { useState } from 'react'
import { Button } from '../Button'
import { Input } from '../Input'
import { VariantStockEditor } from './VariantStockEditor'
import type { ProductVariant } from '../../../hooks/useProductVariants'

export type { ProductVariant }

interface VariantsTableProps {
  variants: ProductVariant[]
  disabled?: boolean
  onRegenerateVariants: () => void
  onUpdateVariant: (data: {
    variant_id: number
    list_price?: number
    default_code?: string
  }) => Promise<void>
  onUpdateStock: (data: { variant_id: number; quantity: number }) => Promise<void>
  isRegenerating?: boolean
  isUpdatingVariant?: boolean
  isUpdatingStock?: boolean
}

export function VariantsTable({
  variants,
  disabled = false,
  onRegenerateVariants,
  onUpdateVariant,
  onUpdateStock,
  isRegenerating = false,
  isUpdatingVariant = false,
  isUpdatingStock = false,
}: VariantsTableProps) {
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null)
  const [variantEditData, setVariantEditData] = useState<{
    list_price: string
    default_code: string
  }>({ list_price: '', default_code: '' })
  const [editingStockVariantId, setEditingStockVariantId] = useState<number | null>(null)
  const [stockEditValue, setStockEditValue] = useState<string>('')

  const startEditVariant = (variant: ProductVariant) => {
    setEditingVariantId(variant.id)
    setVariantEditData({
      list_price: variant.list_price.toString(),
      default_code: variant.default_code,
    })
  }

  const cancelEditVariant = () => {
    setEditingVariantId(null)
    setVariantEditData({ list_price: '', default_code: '' })
  }

  const saveVariant = async () => {
    if (editingVariantId === null) return

    await onUpdateVariant({
      variant_id: editingVariantId,
      list_price: variantEditData.list_price ? parseFloat(variantEditData.list_price) : undefined,
      default_code: variantEditData.default_code || undefined,
    })

    cancelEditVariant()
  }

  const startEditStock = (variant: ProductVariant) => {
    setEditingStockVariantId(variant.id)
    setStockEditValue(variant.qty_available.toString())
  }

  const cancelEditStock = () => {
    setEditingStockVariantId(null)
    setStockEditValue('')
  }

  const saveStock = async () => {
    if (editingStockVariantId === null) return

    const quantity = parseFloat(stockEditValue)
    if (isNaN(quantity) || quantity < 0) return

    await onUpdateStock({
      variant_id: editingStockVariantId,
      quantity,
    })

    cancelEditStock()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Variantes ({variants.length})
        </h4>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRegenerateVariants}
          disabled={disabled || isRegenerating}
          loading={isRegenerating}
          title="Régénérer toutes les combinaisons de variantes"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Régénérer variantes
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Aucune variante générée. Cliquez sur "Régénérer variantes" pour créer toutes les
            combinaisons.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                  Variante
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                  Code
                </th>
                <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                  Prix
                </th>
                <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                  Stock
                </th>
                <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr
                  key={variant.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {editingVariantId === variant.id ? (
                    <>
                      <td className="py-2 px-3">
                        <span className="text-gray-900 dark:text-white">
                          {variant.attributevalues.map((av) => av.name).join(' / ') ||
                            variant.display_name}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          value={variantEditData.default_code}
                          onChange={(e) =>
                            setVariantEditData((prev) => ({
                              ...prev,
                              default_code: e.target.value,
                            }))
                          }
                          placeholder="SKU"
                          className="!py-1 !px-2 text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          value={variantEditData.list_price}
                          onChange={(e) =>
                            setVariantEditData((prev) => ({
                              ...prev,
                              list_price: e.target.value,
                            }))
                          }
                          placeholder="Prix"
                          className="!py-1 !px-2 text-sm text-right w-24"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        {editingStockVariantId === variant.id ? (
                          <VariantStockEditor
                            value={stockEditValue}
                            onChange={setStockEditValue}
                            onSave={saveStock}
                            onCancel={cancelEditStock}
                            isSaving={isUpdatingStock}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditStock(variant)}
                            className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
                            title="Cliquer pour modifier le stock"
                          >
                            {variant.qty_available}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={cancelEditVariant} className="!p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={saveVariant}
                            loading={isUpdatingVariant}
                            className="!p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3">
                        <span className="text-gray-900 dark:text-white">
                          {variant.attributevalues.map((av) => av.name).join(' / ') ||
                            variant.display_name}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                        {variant.default_code || '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900 dark:text-white font-medium">
                        {variant.list_price.toFixed(2)} €
                      </td>
                      <td className="py-2 px-3 text-right">
                        {editingStockVariantId === variant.id ? (
                          <VariantStockEditor
                            value={stockEditValue}
                            onChange={setStockEditValue}
                            onSave={saveStock}
                            onCancel={cancelEditStock}
                            isSaving={isUpdatingStock}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditStock(variant)}
                            disabled={disabled}
                            className={`${
                              variant.qty_available <= 0
                                ? 'text-red-600 dark:text-red-400'
                                : variant.qty_available <= 5
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-gray-600 dark:text-gray-400'
                            } hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer disabled:cursor-not-allowed disabled:hover:no-underline disabled:hover:text-gray-600`}
                            title="Cliquer pour modifier le stock"
                          >
                            {variant.qty_available}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditVariant(variant)}
                          disabled={disabled}
                          className="!p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
