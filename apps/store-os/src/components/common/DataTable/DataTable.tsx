import { useState, useMemo, useCallback } from 'react'
import { SkeletonTable } from '../Skeleton'
import { DataTableHeader } from './DataTableHeader'
import { DataTableRow } from './DataTableRow'
import { DataTableMobile } from './DataTableMobile'
import { DataTablePagination } from './DataTablePagination'
import { Button } from '../Button'
import type { DataTableProps, SortOrder } from '@/types'

/**
 * DataTable générique avec tri, pagination, recherche, et responsive
 *
 * Features :
 * - Tri multi-colonnes avec accessibilité WCAG 2.1 AA
 * - Vue responsive (tableau desktop, cards mobile)
 * - Pagination complète
 * - Bulk actions avec sélection
 * - Skeleton loading
 * - Empty states
 * - Export CSV (via props)
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={customers}
 *   columns={[
 *     { id: 'name', label: 'Nom', accessor: (row) => row.name, sortable: true },
 *     { id: 'email', label: 'Email', accessor: (row) => row.email },
 *   ]}
 *   keyExtractor={(row) => row.id}
 *   pagination={{
 *     currentPage: 0,
 *     pageSize: 20,
 *     totalItems: 100,
 *     onPageChange: setPage,
 *   }}
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor = (item: T) => (item as T & { id: string | number }).id,
  isLoading = false,
  error = null,
  mobileConfig,
  sortField: externalSortField,
  sortOrder: externalSortOrder,
  onSortChange,
  pagination,
  bulkActions,
  selectedItems: externalSelectedItems,
  onSelectionChange,
  emptyMessage = 'Aucune donnée à afficher',
  emptyComponent,
  skeletonRows = 5,
  className,
  tableClassName,
}: DataTableProps<T>) {
  // État interne du tri (si non contrôlé)
  const [internalSortField, setInternalSortField] = useState<string | null>(null)
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('asc')

  // État interne de la sélection (si non contrôlé)
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<string | number>>(new Set())

  // Utiliser le tri externe ou interne
  const sortField = externalSortField !== undefined ? externalSortField : internalSortField
  const sortOrder = externalSortOrder !== undefined ? externalSortOrder : internalSortOrder

  // Utiliser la sélection externe ou interne
  const selectedKeys = useMemo(() => {
    if (externalSelectedItems && keyExtractor) {
      return new Set(externalSelectedItems.map(keyExtractor))
    }
    return internalSelectedKeys
  }, [externalSelectedItems, internalSelectedKeys, keyExtractor])

  // Gestion du tri
  const handleSort = useCallback(
    (field: string) => {
      const newOrder: SortOrder =
        sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'

      if (onSortChange) {
        onSortChange(field, newOrder)
      } else {
        setInternalSortField(field)
        setInternalSortOrder(newOrder)
      }
    },
    [sortField, sortOrder, onSortChange]
  )

  // Données triées (si tri côté client)
  const sortedData = useMemo(() => {
    if (!sortField || onSortChange) {
      // Si tri contrôlé (onSortChange fourni), ne pas trier côté client
      return data
    }

    const column = columns.find((col) => col.id === sortField)
    if (!column || column.sortable === false) return data

    const sorted = [...data].sort((a, b) => {
      if (column.sortFn) {
        return column.sortFn(a, b)
      }

      // Tri par défaut basé sur l'accessor
      const aValue = column.accessor ? column.accessor(a) : ''
      const bValue = column.accessor ? column.accessor(b) : ''

      // Conversion en string pour comparaison
      const aStr = String(aValue ?? '')
      const bStr = String(bValue ?? '')

      return aStr.localeCompare(bStr, 'fr', { numeric: true })
    })

    return sortOrder === 'desc' ? sorted.reverse() : sorted
  }, [data, sortField, sortOrder, columns, onSortChange])

  // Gestion sélection
  const handleSelectAll = useCallback(() => {
    const allKeys = new Set(sortedData.map(keyExtractor))
    const allSelected = sortedData.every((row) => selectedKeys.has(keyExtractor(row)))

    if (onSelectionChange) {
      onSelectionChange(allSelected ? new Set() : allKeys)
    } else {
      setInternalSelectedKeys(allSelected ? new Set() : allKeys)
    }
  }, [sortedData, selectedKeys, keyExtractor, onSelectionChange])

  const handleSelectRow = useCallback(
    (row: T, selected: boolean) => {
      const key = keyExtractor(row)

      if (onSelectionChange) {
        const newKeys = new Set(selectedKeys)
        if (selected) {
          newKeys.add(key)
        } else {
          newKeys.delete(key)
        }
        onSelectionChange(newKeys)
      } else {
        setInternalSelectedKeys((prev) => {
          const next = new Set(prev)
          if (selected) {
            next.add(key)
          } else {
            next.delete(key)
          }
          return next
        })
      }
    },
    [keyExtractor, onSelectionChange, selectedKeys]
  )

  const hasSelection = Boolean(bulkActions && bulkActions.length > 0)
  const allSelected =
    sortedData.length > 0 && sortedData.every((row) => selectedKeys.has(keyExtractor(row)))
  const selectedCount = selectedKeys.size

  // Données sélectionnées
  const selectedData = useMemo(() => {
    return sortedData.filter((row) => selectedKeys.has(keyExtractor(row)))
  }, [sortedData, selectedKeys, keyExtractor])

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <SkeletonTable rows={skeletonRows} columns={columns.length + (hasSelection ? 1 : 0)} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`p-8 text-center ${className || ''}`}>
        <div className="text-red-600 dark:text-red-400" role="alert">
          <p className="font-medium mb-2">Erreur lors du chargement</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (sortedData.length === 0) {
    if (emptyComponent) {
      return <div className={className}>{emptyComponent}</div>
    }

    return (
      <div className={`p-8 text-center ${className || ''}`}>
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Barre d'actions bulk */}
      {hasSelection && selectedCount > 0 && bulkActions && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-t-lg px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
            {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'default' ? 'secondary' : (action.variant || 'secondary')}
                size="sm"
                onClick={() => (action.onExecute || action.onClick)(selectedData)}
                disabled={action.disabled}
                icon={action.icon}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Vue Desktop : Tableau */}
      <div className="hidden lg:block overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${tableClassName || ''}`}>
          <DataTableHeader
            columns={columns}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            hasSelection={hasSelection}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
          />
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((row) => {
              const key = keyExtractor(row)
              const isSelected = selectedKeys.has(key)

              return (
                <DataTableRow
                  key={key}
                  row={row}
                  columns={columns}
                  rowKey={key}
                  isSelected={isSelected}
                  onSelect={(selected) => handleSelectRow(row, selected)}
                  hasSelection={hasSelection}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vue Mobile : Cards */}
      <DataTableMobile
        data={sortedData}
        columns={columns}
        keyExtractor={keyExtractor}
        mobileConfig={mobileConfig}
        isSelected={(row) => selectedKeys.has(keyExtractor(row))}
        onSelect={handleSelectRow}
        hasSelection={hasSelection}
      />

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <DataTablePagination
          currentPage={Math.floor(pagination.offset / pagination.limit)}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}
