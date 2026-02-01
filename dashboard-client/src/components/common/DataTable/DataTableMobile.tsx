import type { DataTableColumn, MobileCardConfig } from '@/types'

interface DataTableMobileProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  keyExtractor: (row: T) => string | number
  mobileConfig?: MobileCardConfig<T>
  isSelected?: (row: T) => boolean
  onSelect?: (row: T, selected: boolean) => void
  hasSelection?: boolean
}

export function DataTableMobile<T>({
  data,
  columns,
  keyExtractor,
  mobileConfig,
  isSelected,
  onSelect,
  hasSelection,
}: DataTableMobileProps<T>) {
  // Si config mobile personnalisée fournie, l'utiliser
  if (mobileConfig) {
    return (
      <div className="lg:hidden space-y-4 p-4">
        {data.map((row) => {
          const key = keyExtractor(row)
          const selected = isSelected?.(row) || false

          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              {/* Checkbox de sélection */}
              {hasSelection && (
                <div className="mb-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => onSelect?.(row, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                    aria-label={`Sélectionner ${key}`}
                  />
                </div>
              )}

              {/* Contenu personnalisé */}
              {mobileConfig.renderCard?.(row)}

              {/* Actions personnalisées */}
              {mobileConfig.renderActions && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {mobileConfig.renderActions(row)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Sinon, afficher les colonnes marquées comme showOnMobile
  const mobileColumns = columns.filter((col) => col.showOnMobile !== false)

  return (
    <div className="lg:hidden space-y-4 p-4">
      {data.map((row) => {
        const key = keyExtractor(row)
        const selected = isSelected?.(row) || false

        return (
          <div
            key={key}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            {/* Checkbox de sélection */}
            {hasSelection && (
              <div className="mb-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect?.(row, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                  aria-label={`Sélectionner ${key}`}
                />
              </div>
            )}

            {/* Colonnes */}
            <div className="space-y-2">
              {mobileColumns.map((column) => (
                <div key={column.id} className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">
                    {column.label} :
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white text-right">
                    {column.accessor?.(row) as React.ReactNode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
