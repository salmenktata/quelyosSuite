/**
 * DataTable - Composant générique de tableau avec tri, pagination et responsive
 *
 * @example
 * ```tsx
 * import { DataTable } from '@/components/common/DataTable'
 *
 * <DataTable
 *   data={items}
 *   columns={columns}
 *   keyExtractor={(item) => item.id}
 *   pagination={paginationConfig}
 * />
 * ```
 */

export { DataTable } from './DataTable'
export { DataTableHeader } from './DataTableHeader'
export { DataTableRow } from './DataTableRow'
export { DataTableMobile } from './DataTableMobile'
export { DataTablePagination } from './DataTablePagination'

export type {
  DataTableProps,
  DataTableColumn,
  BulkAction,
  MobileCardConfig,
  SortOrder,
  DataTableState,
} from '@/types/backoffice'
