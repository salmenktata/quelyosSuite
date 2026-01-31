import { Archive, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/common'

interface ProductBulkActionsProps {
  selectedCount: number
  bulkActionLoading: boolean
  onArchive: (archive: boolean) => void
  onDelete: () => void
  onClearSelection: () => void
}

export function ProductBulkActions({
  selectedCount,
  bulkActionLoading,
  onArchive,
  onDelete,
  onClearSelection,
}: ProductBulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Désélectionner
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onArchive(true)}
          disabled={bulkActionLoading}
          icon={<Archive className="w-4 h-4" />}
        >
          Archiver
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onArchive(false)}
          disabled={bulkActionLoading}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Désarchiver
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          disabled={bulkActionLoading}
          loading={bulkActionLoading}
          icon={<Trash2 className="w-4 h-4" />}
        >
          Supprimer
        </Button>
      </div>
    </div>
  )
}
