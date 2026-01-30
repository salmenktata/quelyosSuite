import { useState } from 'react'
import { Button } from './Button'
import { Skeleton } from './Skeleton'
import { AttributeImageManager } from './AttributeImageManager'
import {
  AddAttributeForm,
  AttributeLineList,
  EditAttributeModal,
  VariantsTable,
  type AttributeLine,
  type ProductVariant,
} from './VariantManagerParts'
import {
  useAllAttributes,
  useProductVariants,
  useAddProductAttribute,
  useUpdateProductAttribute,
  useDeleteProductAttribute,
  useUpdateProductVariant,
  useUpdateVariantStock,
  useRegenerateVariants,
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
 *
 * Architecture:
 * - AddAttributeForm: Formulaire d'ajout d'attribut
 * - AttributeLineList: Liste des attributs existants
 * - EditAttributeModal: Modal d'édition des valeurs d'un attribut
 * - VariantsTable: Table des variantes avec édition inline
 * - VariantStockEditor: Éditeur de stock inline
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

  const cancelAddAttribute = () => {
    setShowAddAttribute(false)
    setSelectedAttributeId('')
    setSelectedValueIds([])
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

  // Mettre à jour une variante
  const handleUpdateVariant = async (data: {
    variant_id: number
    list_price?: number
    default_code?: string
  }) => {
    try {
      await updateVariantMutation.mutateAsync(data)
      onSuccess?.('Variante modifiée avec succès')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erreur lors de la modification')
      throw error
    }
  }

  // Mettre à jour le stock
  const handleUpdateStock = async (data: { variant_id: number; quantity: number }) => {
    try {
      await updateVariantStockMutation.mutateAsync(data)
      onSuccess?.('Stock mis à jour avec succès')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du stock')
      throw error
    }
  }

  // Toggle sélection valeur
  const toggleValueSelection = (valueId: number) => {
    setSelectedValueIds((prev) =>
      prev.includes(valueId) ? prev.filter((id) => id !== valueId) : [...prev, valueId]
    )
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
        <AttributeLineList
          attributeLines={attributeLines}
          disabled={disabled}
          onEdit={startEditAttribute}
          onDelete={handleDeleteAttribute}
          isDeleting={deleteAttributeMutation.isPending}
        />

        {/* Formulaire ajout attribut */}
        {showAddAttribute && selectedAttribute && (
          <div className="mt-4">
            <AddAttributeForm
              availableAttributes={availableAttributes}
              selectedAttributeId={selectedAttributeId}
              selectedValueIds={selectedValueIds}
              onAttributeChange={setSelectedAttributeId}
              onValueToggle={toggleValueSelection}
              onCancel={cancelAddAttribute}
              onSubmit={handleAddAttribute}
              isLoading={addAttributeMutation.isPending}
            />
          </div>
        )}

        {/* Sélection attribut (avant d'afficher le formulaire complet) */}
        {showAddAttribute && !selectedAttribute && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              Ajouter un attribut
            </h5>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Attribut
              </label>
              <select
                value={selectedAttributeId}
                onChange={(e) => setSelectedAttributeId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sélectionner un attribut...</option>
                {availableAttributes.map((attr) => (
                  <option key={attr.id} value={attr.id}>
                    {attr.name} ({attr.values.length} valeur{attr.values.length > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={cancelAddAttribute}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal édition attribut */}
      {editingAttributeLine && (
        <EditAttributeModal
          attributeLine={editingAttributeLine}
          selectedValueIds={editingAttributeValueIds}
          allAvailableValues={
            allAttributes?.find((a) => a.id === editingAttributeLine.attribute_id)?.values || []
          }
          onValueToggle={toggleEditAttributeValue}
          onSave={saveEditAttribute}
          onCancel={cancelEditAttribute}
          isSaving={updateAttributeMutation.isPending}
        />
      )}

      {/* Section Variantes */}
      {attributeLines.length > 0 && (
        <VariantsTable
          variants={variants as ProductVariant[]}
          disabled={disabled}
          onRegenerateVariants={handleRegenerateVariants}
          onUpdateVariant={handleUpdateVariant}
          onUpdateStock={handleUpdateStock}
          isRegenerating={regenerateVariantsMutation.isPending}
          isUpdatingVariant={updateVariantMutation.isPending}
          isUpdatingStock={updateVariantStockMutation.isPending}
        />
      )}
    </div>
  )
}
