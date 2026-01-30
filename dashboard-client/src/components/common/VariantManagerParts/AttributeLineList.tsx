import { Button } from '../Button'
import type { AttributeLine } from '../../../hooks/useProductVariants'

export type { AttributeLine }

interface AttributeLineListProps {
  attributeLines: AttributeLine[]
  disabled?: boolean
  onEdit: (line: AttributeLine) => void
  onDelete: (lineId: number) => void
  isDeleting?: boolean
}

export function AttributeLineList({
  attributeLines,
  disabled = false,
  onEdit,
  onDelete,
  isDeleting = false,
}: AttributeLineListProps) {
  if (attributeLines.length === 0) {
    return (
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
    )
  }

  return (
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
                Pour générer des variantes, modifiez cet attribut dans la configuration système
                (Configuration &gt; Attributs &gt; Mode de création: "Instantanément")
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(line)}
              disabled={disabled || isDeleting}
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
              onClick={() => onDelete(line.id)}
              disabled={disabled || isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Supprimer"
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
  )
}
