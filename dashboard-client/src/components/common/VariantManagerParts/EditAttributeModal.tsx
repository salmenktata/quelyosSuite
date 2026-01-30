import { Button } from '../Button'
import type { AttributeLine, AttributeValue } from '../../../hooks/useProductVariants'

interface EditAttributeModalProps {
  attributeLine: AttributeLine | null
  selectedValueIds: number[]
  allAvailableValues: AttributeValue[]
  onValueToggle: (valueId: number) => void
  onSave: () => void
  onCancel: () => void
  isSaving?: boolean
}

export function EditAttributeModal({
  attributeLine,
  selectedValueIds,
  allAvailableValues,
  onValueToggle,
  onSave,
  onCancel,
  isSaving = false,
}: EditAttributeModalProps) {
  if (!attributeLine) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Modifier {attributeLine.attribute_name}
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valeurs sélectionnées ({selectedValueIds.length})
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Cliquez sur les valeurs pour les ajouter ou retirer. Les variantes seront régénérées.
          </p>
          <div className="flex flex-wrap gap-2">
            {allAvailableValues.map((value) => (
              <button
                key={value.id}
                type="button"
                onClick={() => onValueToggle(value.id)}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedValueIds.includes(value.id)
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
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

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={selectedValueIds.length === 0}
            loading={isSaving}
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  )
}
