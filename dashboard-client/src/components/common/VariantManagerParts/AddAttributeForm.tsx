import { Button } from '../Button'
import type { Attribute } from '../../../hooks/useProductVariants'

interface AddAttributeFormProps {
  availableAttributes: Attribute[]
  selectedAttributeId: number | ''
  selectedValueIds: number[]
  onAttributeChange: (id: number | '') => void
  onValueToggle: (valueId: number) => void
  onCancel: () => void
  onSubmit: () => void
  isLoading?: boolean
}

export function AddAttributeForm({
  availableAttributes,
  selectedAttributeId,
  selectedValueIds,
  onAttributeChange,
  onValueToggle,
  onCancel,
  onSubmit,
  isLoading = false,
}: AddAttributeFormProps) {
  const selectedAttribute = availableAttributes.find((a) => a.id === selectedAttributeId)

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <h5 className="font-medium text-gray-900 dark:text-white mb-3">
        Ajouter un attribut
      </h5>

      {/* Sélection attribut */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Attribut
        </label>
        <select
          value={selectedAttributeId}
          onChange={(e) => onAttributeChange(e.target.value ? Number(e.target.value) : '')}
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

      {/* Sélection valeurs */}
      {selectedAttribute && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valeurs ({selectedValueIds.length} sélectionnée{selectedValueIds.length > 1 ? 's' : ''})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedAttribute.values.map((value) => (
              <button
                key={value.id}
                type="button"
                onClick={() => onValueToggle(value.id)}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedValueIds.includes(value.id)
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {value.html_color && (
                  <span
                    className="w-3 h-3 rounded-full mr-1.5 border border-gray-300"
                    style={{ backgroundColor: value.html_color }}
                  />
                )}
                {value.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSubmit}
          disabled={!selectedAttributeId || selectedValueIds.length === 0}
          loading={isLoading}
        >
          Ajouter
        </Button>
      </div>
    </div>
  )
}
