import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import type { DataTableColumn, SortOrder } from '@/types'

interface DataTableHeaderProps<T> {
  columns: DataTableColumn<T>[]
  sortField: string | null
  sortOrder: SortOrder
  onSort: (field: string) => void
  hasSelection?: boolean
  allSelected?: boolean
  onSelectAll?: () => void
}

export function DataTableHeader<T>({
  columns,
  sortField,
  sortOrder,
  onSort,
  hasSelection,
  allSelected,
  onSelectAll,
}: DataTableHeaderProps<T>) {
  const getSortAriaLabel = (column: DataTableColumn<T>) => {
    const isCurrentSort = sortField === column.id
    const nextOrder = isCurrentSort && sortOrder === 'asc' ? 'descendant' : 'ascendant'
    return `Trier par ${column.label} en ordre ${nextOrder}`
  }

  const getSortAriaSort = (column: DataTableColumn<T>): 'ascending' | 'descending' | 'none' => {
    if (sortField !== column.id) return 'none'
    return sortOrder === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <thead className="bg-gray-50 dark:bg-gray-900">
      <tr>
        {/* Checkbox de sélection globale */}
        {hasSelection && (
          <th scope="col" className="px-6 py-3 w-12">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
              aria-label="Sélectionner toutes les lignes"
            />
          </th>
        )}

        {/* Colonnes */}
        {columns.map((column) => {
          const isSortable = column.sortable !== false
          const isCurrentSort = sortField === column.id
          const alignClass =
            column.align === 'center'
              ? 'text-center'
              : column.align === 'right'
                ? 'text-right'
                : 'text-left'

          return (
            <th
              key={column.id}
              scope="col"
              onClick={isSortable ? () => onSort(column.id || column.key) : undefined}
              className={`
                px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                ${alignClass}
                ${isSortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors' : ''}
                ${isSortable ? 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500' : ''}
                ${column.headerClassName || ''}
              `.trim()}
              style={column.width ? { width: column.width } : undefined}
              tabIndex={isSortable ? 0 : undefined}
              onKeyDown={
                isSortable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSort(column.id || column.key)
                      }
                    }
                  : undefined
              }
              aria-label={isSortable ? getSortAriaLabel(column) : column.label}
              aria-sort={isSortable ? getSortAriaSort(column) : undefined}
            >
              <div className="flex items-center gap-1">
                <span>{column.label}</span>
                {isSortable && isCurrentSort && (
                  <span aria-hidden="true">
                    {sortOrder === 'asc' ? (
                      <ArrowUpIcon className="h-4 w-4 inline" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 inline" />
                    )}
                  </span>
                )}
              </div>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
