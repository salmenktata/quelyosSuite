import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Skeleton } from './Skeleton'
import { AttributeImageManager } from './AttributeImageManager'
import {
  useAllAttributes,
  useProductVariants,
  useAddProductAttribute,
  useUpdateProductAttribute,
  useDeleteProductAttribute,
  useUpdateProductVariant,
  useUpdateVariantStock,
  useRegenerateVariants,
  type ProductVariant,
  type AttributeLine,
} from '../../hooks/useProductVariants'

interface VariantManagerProps {
  productId: number
  disabled?: boolean
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

/**
 * Composant de gestion des variantes produit (attributs + variantes)
 * V2: Images gérées par valeur d'attribut (pas par variante)
 */
export function VariantManager({
  productId,
  disabled = false,
  onSuccess,
  onError,
}: VariantManagerProps) {
  const [showAddAttribute, setShowAddAttribute] = useState(false)
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | ''>('')
  const [selectedValueIds, setSelectedValueIds] = useState<number[]>([])
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null)
  const [variantEditData, setVariantEditData] = useState<{
    list_price: string
    default_code: string
  }>({ list_price: '', default_code: '' })
  // État pour l'édition du stock
  const [editingStockVariantId, setEditingStockVariantId] = useState<number | null>(null)
  const [stockEditValue, setStockEditValue] = useState<string>('')
  // État pour l'édition d'attribut existant
  const [editingAttributeLine, setEditingAttributeLine] = useState<AttributeLine | null>(null)
  const [editingAttributeValueIds, setEditingAttributeValueIds] = useState<number[]>([])

  // Hooks de données
  const { data: allAttributes, isLoading: loadingAttributes } = useAllAttributes()
  const { data: variantData, isLoading: loadingVariants } = useProductVariants(productId)
  const addAttributeMutation = useAddProductAttribute(productId)
  const updateAttributeMutation = useUpdateProductAttribute(productId)
  const deleteAttributeMutation = useDeleteProductAttribute(productId)
  const updateVariantMutation = useUpdateProductVariant(productId)
  const updateVariantStockMutation = useUpdateVariantStock(productId)
  const regenerateVariantsMutation = useRegenerateVariants(productId)

  const attributeLines = variantData?.attributeLines || []
  const variants = variantData?.variants || []

  // Attributs disponibles (non encore ajoutés au produit)
  const availableAttributes =
    allAttributes?.filter(
      (attr) => !attributeLines.some((line) => line.attribute_id === attr.id)
    ) || []

  const selectedAttribute = allAttributes?.find((a) => a.id === selectedAttributeId)

  // Ajouter un attribut
  const handleAddAttribute = async () => {
    if (!selectedAttributeId || selectedValueIds.length === 0) return

    try {
      await addAttributeMutation.mutateAsync({
        attribute_id: selectedAttributeId as number,
        value_ids: selectedValueIds,
      })
      onSuccess?.('Attribut ajouté avec succès')
      setShowAddAttribute(false)
      setSelectedAttributeId('')
      setSelectedValueIds([])
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Erreur lors de l'ajout")
    }
  }

  // Supprimer un attribut
  const handleDeleteAttribute = async (lineId: number) => {
    if (!confirm('Supprimer cet attribut ? Les variantes seront régénérées.')) return

    try {
      await deleteAttributeMutation.mutateAsync(lineId)
      onSuccess?.('Attribut supprimé avec succès')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  // Éditer un attribut existant
  const startEditAttribute = (line: AttributeLine) => {
    setEditingAttributeLine(line)
    setEditingAttributeValueIds(line.values.map((v) => v.id))
  }

  const cancelEditAttribute = () => {
    setEditingAttributeLine(null)
    setEditingAttributeValueIds([])
  }

  const saveEditAttribute = async () => {
    if (!editingAttributeLine || editingAttributeValueIds.length === 0) return

    try {
      await updateAttributeMutation.mutateAsync({
        line_id: editingAttributeLine.id,
        value_ids: editingAttributeValueIds,
      })
      onSuccess?.('Attribut mis à jour avec succès')
      cancelEditAttribute()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    }
  }

  const toggleEditAttributeValue = (valueId: number) => {
    setEditingAttributeValueIds((prev) =>
      prev.includes(valueId) ? prev.filter((id) => id !== valueId) : [...prev, valueId]
    )
  }

  // Régénérer les variantes
  const handleRegenerateVariants = async () => {
    try {
      const result = await regenerateVariantsMutation.mutateAsync()
      if (result.variants_created > 0) {
        onSuccess?.(`${result.variants_created} nouvelles variantes créées (total: ${result.variants_after})`)
      } else {
        onSuccess?.('Toutes les variantes sont déjà créées')
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erreur lors de la régénération')
    }
  }

  // Éditer une variante
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

    try {
      await updateVariantMutation.mutateAsync({
        variant_id: editingVariantId,
        list_price: variantEditData.list_price ? parseFloat(variantEditData.list_price) : undefined,
        default_code: variantEditData.default_code || undefined,
      })
      onSuccess?.('Variante modifiée avec succès')
      cancelEditVariant()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erreur lors de la modification')
    }
  }

  // Toggle sélection valeur
  const toggleValueSelection = (valueId: number) => {
    setSelectedValueIds((prev) =>
      prev.includes(valueId) ? prev.filter((id) => id !== valueId) : [...prev, valueId]
    )
  }

  // Éditer le stock d'une variante
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
    if (isNaN(quantity) || quantity < 0) {
      onError?.('La quantité doit être un nombre positif')
      return
    }

    try {
      await updateVariantStockMutation.mutateAsync({
        variant_id: editingStockVariantId,
        quantity,
      })
      onSuccess?.('Stock mis à jour avec succès')
      cancelEditStock()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du stock')
    }
  }

  if (loadingAttributes || loadingVariants) {
    return (
      <div className="space-y-4">
        <Skeleton height={40} />
        <Skeleton count={3} height={60} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Images par Attribut (V2) */}
      {attributeLines.length > 0 && (
        <AttributeImageManager
          productId={productId}
          disabled={disabled}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {/* Section Attributs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attributs ({attributeLines.length})
          </h4>
          {availableAttributes.length > 0 && !showAddAttribute && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddAttribute(true)}
              disabled={disabled}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Ajouter attribut
            </Button>
          )}
        </div>

        {/* Liste des attributs existants */}
        {attributeLines.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aucun attribut configuré. Ajoutez des attributs (couleur, taille...) pour créer des
              variantes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attributeLines.map((line) => (
              <div
                key={line.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  line.create_variant === 'no_variant'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {line.attribute_name}
                    </span>
                    {line.create_variant === 'no_variant' && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded"
                        title="Cet attribut ne génère pas de variantes. Modifiez sa configuration système pour activer les variantes."
                      >
                        ⚠️ Sans variantes
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {line.values.map((val) => (
                      <span
                        key={val.id}
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded"
                      >
                        {val.html_color && (
                          <span
                            className="w-3 h-3 rounded-full mr-1 border border-gray-300"
                            style={{ backgroundColor: val.html_color }}
                          />
                        )}
                        {val.name}
                      </span>
                    ))}
                  </div>
                  {line.create_variant === 'no_variant' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Pour générer des variantes, modifiez cet attribut dans la configuration système (Configuration &gt; Attributs &gt; Mode de création: "Instantanément")
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditAttribute(line)}
                    disabled={disabled || updateAttributeMutation.isPending}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    title="Modifier les valeurs"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttribute(line.id)}
                    disabled={disabled || deleteAttributeMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Supprimer l'attribut"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire édition attribut */}
        {editingAttributeLine && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              Modifier "{editingAttributeLine.attribute_name}"
            </h5>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sélectionnez les valeurs à conserver
              </label>
              <div className="flex flex-wrap gap-2">
                {allAttributes
                  ?.find((a) => a.id === editingAttributeLine.attribute_id)
                  ?.values.map((val) => (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => toggleEditAttributeValue(val.id)}
                      className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        editingAttributeValueIds.includes(val.id)
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:border-indigo-400 dark:text-indigo-200'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {val.html_color && (
                        <span
                          className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                          style={{ backgroundColor: val.html_color }}
                        />
                      )}
                      {val.name}
                      {editingAttributeValueIds.includes(val.id) && (
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Les variantes seront automatiquement régénérées après la modification.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={cancelEditAttribute}>
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveEditAttribute}
                disabled={editingAttributeValueIds.length === 0}
                loading={updateAttributeMutation.isPending}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        )}

        {/* Formulaire ajout attribut */}
        {showAddAttribute && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Ajouter un attribut</h5>

            {/* Sélecteur d'attribut */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Attribut
              </label>
              <select
                value={selectedAttributeId}
                onChange={(e) => {
                  setSelectedAttributeId(e.target.value ? parseInt(e.target.value) : '')
                  setSelectedValueIds([])
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sélectionner un attribut</option>
                {availableAttributes.map((attr) => (
                  <option key={attr.id} value={attr.id}>
                    {attr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélecteur de valeurs */}
            {selectedAttribute && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valeurs (sélectionnez au moins une)
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedAttribute.values.map((val) => (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => toggleValueSelection(val.id)}
                      className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedValueIds.includes(val.id)
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:border-indigo-400 dark:text-indigo-200'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {val.html_color && (
                        <span
                          className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                          style={{ backgroundColor: val.html_color }}
                        />
                      )}
                      {val.name}
                      {selectedValueIds.includes(val.id) && (
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddAttribute(false)
                  setSelectedAttributeId('')
                  setSelectedValueIds([])
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddAttribute}
                disabled={!selectedAttributeId || selectedValueIds.length === 0}
                loading={addAttributeMutation.isPending}
              >
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Section Variantes (sans colonne Images - gérées via AttributeImageManager) */}
      {attributeLines.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Variantes ({variants.length})
            </h4>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRegenerateVariants}
              disabled={disabled || regenerateVariantsMutation.isPending}
              loading={regenerateVariantsMutation.isPending}
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
                Aucune variante générée. Cliquez sur "Régénérer variantes" pour créer toutes les combinaisons.
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
                            {variant.attribute_values.map((av) => av.name).join(' / ') ||
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
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                value={stockEditValue}
                                onChange={(e) => setStockEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveStock()
                                  if (e.key === 'Escape') cancelEditStock()
                                }}
                                min="0"
                                step="1"
                                className="!py-1 !px-2 text-sm text-right w-20"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditStock}
                                className="!p-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
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
                                onClick={saveStock}
                                loading={updateVariantStockMutation.isPending}
                                className="!p-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </Button>
                            </div>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditVariant}
                              className="!p-1"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
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
                              loading={updateVariantMutation.isPending}
                              className="!p-1"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
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
                            {variant.attribute_values.map((av) => av.name).join(' / ') ||
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
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                value={stockEditValue}
                                onChange={(e) => setStockEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveStock()
                                  if (e.key === 'Escape') cancelEditStock()
                                }}
                                min="0"
                                step="1"
                                className="!py-1 !px-2 text-sm text-right w-20"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditStock}
                                className="!p-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
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
                                onClick={saveStock}
                                loading={updateVariantStockMutation.isPending}
                                className="!p-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </Button>
                            </div>
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
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
      )}
    </div>
  )
}
