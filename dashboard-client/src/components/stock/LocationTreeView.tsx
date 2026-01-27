import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder, Package, MoreVertical, Plus, Pencil, Archive } from 'lucide-react'
import type { LocationTreeNode, StockLocation } from '@/types/stock'
import { isDescendant } from '@/lib/stock/tree-utils'
import { logger } from '@quelyos/logger'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface LocationTreeViewProps {
  locations: LocationTreeNode[]
  onEdit: (location: StockLocation) => void
  onArchive: (locationId: number) => void
  onAddChild: (parentId: number) => void
  onMove: (draggedId: number, targetId: number) => void
  onToggleExpand: (locationId: number) => void
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT TREE NODE
// ═══════════════════════════════════════════════════════════════════════════

interface TreeNodeProps {
  node: LocationTreeNode
  onEdit: (location: StockLocation) => void
  onArchive: (locationId: number) => void
  onAddChild: (parentId: number) => void
  onToggleExpand: (locationId: number) => void
  onDragStart: (node: LocationTreeNode) => void
  onDragOver: (e: React.DragEvent, node: LocationTreeNode) => void
  onDrop: (node: LocationTreeNode) => void
  isDragging: boolean
  dragOverId: number | null
}

function TreeNode({
  node,
  onEdit,
  onArchive,
  onAddChild,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverId
}: TreeNodeProps) {
  const [showActions, setShowActions] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      {/* Node principal */}
      <div
        draggable
        onDragStart={() => onDragStart(node)}
        onDragOver={(e) => onDragOver(e, node)}
        onDrop={() => onDrop(node)}
        className={`
          group flex items-center gap-2 py-2 px-3 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-800
          cursor-move transition-colors duration-150
          ${isDragging ? 'opacity-50' : ''}
          ${dragOverId === node.id ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400' : 'border-2 border-transparent'}
        `}
        style={{ paddingLeft: `${node.level * 24 + 12}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Toggle expand/collapse */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(node.id)}
            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {node.isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-6" /> // Spacer pour alignement
        )}

        {/* Icon par type */}
        {node.usage === 'view' ? (
          <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        ) : (
          <Package className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        )}

        {/* Nom et infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {node.name}
            </span>
            {node.usage === 'view' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">(Catégorie)</span>
            )}
          </div>
          {node.barcode && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {node.barcode}
            </div>
          )}
        </div>

        {/* Badge stock */}
        {node.stock_count > 0 && (
          <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded">
            {node.stock_count.toFixed(0)} unités
          </span>
        )}

        {/* Actions dropdown */}
        <div className="relative flex-shrink-0">
          <button
            className={`
              p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity
              ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
            onClick={(e) => {
              e.stopPropagation()
              // Toggle dropdown
              const dropdown = e.currentTarget.nextElementSibling as HTMLElement
              if (dropdown) {
                dropdown.classList.toggle('hidden')
              }
            }}
          >
            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Dropdown menu */}
          <div className="hidden absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(node)
                // Close dropdown
                const dropdown = e.currentTarget.parentElement
                if (dropdown) dropdown.classList.add('hidden')
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddChild(node.id)
                const dropdown = e.currentTarget.parentElement
                if (dropdown) dropdown.classList.add('hidden')
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
              Ajouter sous-emplacement
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Archiver "${node.name}" ?`)) {
                  onArchive(node.id)
                }
                const dropdown = e.currentTarget.parentElement
                if (dropdown) dropdown.classList.add('hidden')
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
            >
              <Archive className="h-4 w-4" />
              Archiver
            </button>
          </div>
        </div>
      </div>

      {/* Enfants récursifs */}
      {node.isExpanded && hasChildren && (
        <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-6">
          {(node.children as LocationTreeNode[]).map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onEdit={onEdit}
              onArchive={onArchive}
              onAddChild={onAddChild}
              onToggleExpand={onToggleExpand}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragging={isDragging}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function LocationTreeView({
  locations,
  onEdit,
  onArchive,
  onAddChild,
  onMove,
  onToggleExpand
}: LocationTreeViewProps) {
  const [draggedNode, setDraggedNode] = useState<LocationTreeNode | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  // Construire une map pour validation rapide
  const locationMap = useMemo(() => {
    const map = new Map<number, LocationTreeNode>()
    const traverse = (nodes: LocationTreeNode[]) => {
      nodes.forEach(node => {
        map.set(node.id, node)
        if (node.children) traverse(node.children as LocationTreeNode[])
      })
    }
    traverse(locations)
    return map
  }, [locations])

  const handleDragStart = (node: LocationTreeNode) => {
    setDraggedNode(node)
    logger.info('[LocationTreeView] Drag started:', node.name)
  }

  const handleDragOver = (e: React.DragEvent, node: LocationTreeNode) => {
    e.preventDefault() // Nécessaire pour permettre le drop
    setDragOverId(node.id)
  }

  const handleDrop = (targetNode: LocationTreeNode) => {
    if (!draggedNode) return

    // Validation : empêcher de déplacer sur soi-même
    if (draggedNode.id === targetNode.id) {
      logger.warn('[LocationTreeView] Cannot move to itself')
      setDraggedNode(null)
      setDragOverId(null)
      return
    }

    // Validation : empêcher boucle infinie (déplacer un parent vers son descendant)
    if (isDescendant(targetNode.id, draggedNode.id, locationMap)) {
      alert('Impossible : boucle infinie détectée\n\nVous ne pouvez pas déplacer un emplacement vers l\'un de ses descendants.')
      setDraggedNode(null)
      setDragOverId(null)
      return
    }

    // Confirmation
    const confirm_move = confirm(
      `Déplacer "${draggedNode.name}" vers "${targetNode.name}" ?\n\n` +
      `Nouveau chemin : ${targetNode.complete_name} / ${draggedNode.name}`
    )

    if (confirm_move) {
      onMove(draggedNode.id, targetNode.id)
    }

    setDraggedNode(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedNode(null)
    setDragOverId(null)
  }

  // Gérer le close des dropdowns en cliquant ailleurs
  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-dropdown]')) {
      document.querySelectorAll('.absolute.right-0.mt-1').forEach(el => {
        el.classList.add('hidden')
      })
    }
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Folder className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p>Aucun emplacement trouvé</p>
      </div>
    )
  }

  return (
    <div
      className="space-y-1"
      onClick={handleClickOutside}
      onDragEnd={handleDragEnd}
    >
      {locations.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onEdit={onEdit}
          onArchive={onArchive}
          onAddChild={onAddChild}
          onToggleExpand={onToggleExpand}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedNode?.id === node.id}
          dragOverId={dragOverId}
        />
      ))}

      {/* Instructions drag & drop */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
        <p className="font-semibold mb-1">💡 Astuce</p>
        <p>Glissez-déposez un emplacement sur un autre pour le déplacer dans l'arborescence.</p>
      </div>
    </div>
  )
}
