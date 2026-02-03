import { memo } from 'react'
import type { DataTableColumn } from '@quelyos/types'

interface DataTableRowProps<T> {
  row: T
  columns: DataTableColumn<T>[]
  rowKey: string | number
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  hasSelection?: boolean
}

function DataTableRowInner<T>({
  row,
  columns,
  rowKey,
  isSelected,
  onSelect,
  hasSelection,
}: DataTableRowProps<T>) {
  return (
    <tr
      key={rowKey}
      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
    >
      {/* Checkbox de sélection */}
      {hasSelection && (
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
            aria-label={`Sélectionner la ligne ${rowKey}`}
          />
        </td>
      )}

      {/* Cellules */}
      {columns.map((column) => {
        const alignClass =
          column.align === 'center'
            ? 'text-center'
            : column.align === 'right'
              ? 'text-right'
              : 'text-left'

        return (
          <td
            key={column.id}
            className={`
              px-6 py-4
              ${alignClass}
              ${column.cellClassName || ''}
            `.trim()}
          >
            {column.accessor?.(row) as React.ReactNode}
          </td>
        )
      })}
    </tr>
  )
}

export const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner
