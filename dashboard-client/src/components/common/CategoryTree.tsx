import { useState, useEffect, useCallback, useRef } from 'react'
import { Category } from '@quelyos/types'
import { Badge, Button } from './index'

interface CategoryTreeProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onMove: (categoryId: number, newParentId: number | null) => void
  isMoving?: boolean
  expandAll?: boolean
  onExpandedChange?: (expandedIds: Set<number>) => void
}

interface CategoryNodeProps {
  category: Category
  level: number
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onMove: (categoryId: number, newParentId: number | null) => void
  isExpanded: boolean
  onToggleExpand: () => void
  draggedCategory: Category | null
  onDragStart: (category: Category) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, targetId: number | null, position: 'inside' | 'after') => void
  onDrop: (targetId: number | null, position: 'inside' | 'after') => void
  dropTargetId: number | null
  dropPosition: 'inside' | 'after' | null
  isMoving: boolean
  expandedIds: Set<number>
  focusedId: number | null
  onFocus: (categoryId: number) => void
}

function CategoryNode({
  category,
  level,
  onEdit,
  onDelete,
  onMove,
  isExpanded,
  onToggleExpand,
  draggedCategory,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dropTargetId,
  dropPosition,
  isMoving,
  expandedIds,
  focusedId,
  onFocus,
}: CategoryNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isDragging = draggedCategory?.id === category.id
  const isDropTarget = dropTargetId === category.id
  const isFocused = focusedId === category.id
  const nodeRef = useRef<HTMLDivElement>(null)

  // Empêcher de dropper sur soi-même ou ses enfants
  const canDrop = draggedCategory &&
    draggedCategory.id !== category.id &&
    !isChildOf(draggedCategory, category.id)

  // Auto-scroll au focus
  useEffect(() => {
    if (isFocused && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isFocused])

  // Gestion du drag over avec détection de position
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!canDrop) return

    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const isTopHalf = e.clientY < midY

    // Si a des enfants et est dans la moitié supérieure, ou n'a pas d'enfants : inside
    // Sinon : after
    const position = (hasChildren && isTopHalf) || !hasChildren ? 'inside' : 'after'
    onDragOver(e, category.id, position)
  }

  return (
    <div className="select-none" ref={nodeRef}>
      {/* Ligne de la catégorie */}
      <div
        draggable={!isMoving}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          onDragStart(category)
        }}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.preventDefault()
          if (canDrop) {
            const rect = e.currentTarget.getBoundingClientRect()
            const midY = rect.top + rect.height / 2
            const isTopHalf = e.clientY < midY
            const position = (hasChildren && isTopHalf) || !hasChildren ? 'inside' : 'after'
            onDrop(category.id, position)
          }
        }}
        onClick={() => onFocus(category.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (hasChildren) onToggleExpand()
          } else if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
            e.preventDefault()
            onToggleExpand()
          } else if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
            e.preventDefault()
            onToggleExpand()
          }
        }}
        tabIndex={0}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-level={level + 1}
        className={`
          group relative flex items-center gap-3 px-4 py-3
          ${isDragging ? 'opacity-30 bg-gray-100 dark:bg-gray-700' : ''}
          ${isDropTarget && canDrop && dropPosition === 'inside' ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500 ring-inset' : ''}
          ${isFocused ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/50 dark:bg-indigo-900/20' : ''}
          hover:bg-gray-50 dark:hover:bg-gray-700/50
          transition-all duration-150
          cursor-pointer focus:outline-none
        `}
        style={{ paddingLeft: `${level * 32 + 16}px` }}
      >
        {/* Lignes de hiérarchie verticales */}
        {level > 0 && (
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
            {Array.from({ length: level }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
                style={{ left: `${i * 32 + 28}px` }}
              />
            ))}
            {/* Ligne horizontale vers le noeud */}
            <div
              className="absolute top-1/2 h-px bg-gray-200 dark:bg-gray-700"
              style={{
                left: `${(level - 1) * 32 + 28}px`,
                width: '20px',
              }}
            />
          </div>
        )}

        {/* Bouton expand/collapse avec animation */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className={`
            relative z-10 w-6 h-6 flex items-center justify-center rounded
            ${hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : 'invisible'}
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500
          `}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Replier' : 'Déplier'}
        >
          {hasChildren && (
            <svg
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Icône dossier avec animation ouvert/fermé */}
        <div className="relative z-10 w-5 h-5 flex items-center justify-center transition-all duration-200">
          {hasChildren ? (
            isExpanded ? (
              // Dossier ouvert
              <svg
                className="w-5 h-5 text-yellow-500 dark:text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            ) : (
              // Dossier fermé
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            )
          ) : (
            // Fichier (catégorie sans enfants)
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Icône de drag handle */}
        <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 10-.001 4.001A2 2 0 007 2zm0 6a2 2 0 10-.001 4.001A2 2 0 007 8zm0 6a2 2 0 10-.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10-.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10-.001 4.001A2 2 0 0013 14z" />
          </svg>
        </div>

        {/* Nom */}
        <span className="relative z-10 flex-1 font-medium text-gray-900 dark:text-white truncate">
          {category.name}
        </span>

        {/* Badges */}
        <div className="relative z-10 flex items-center gap-2">
          {/* Badge nombre de produits directs */}
          {category.product_count !== undefined && category.product_count > 0 && (
            <Badge variant="info" className="text-xs">
              {category.product_count} produit{category.product_count > 1 ? 's' : ''}
            </Badge>
          )}

          {/* Badge total avec sous-catégories */}
          {category.total_product_count !== undefined &&
           category.total_product_count > (category.product_count || 0) && (
            <Badge variant="neutral" className="text-xs">
              {category.total_product_count} total
            </Badge>
          )}

          {/* Badge sous-catégories */}
          {hasChildren && (
            <Badge variant="neutral" className="text-xs">
              {category.child_count || category.children?.length} sous-cat.
            </Badge>
          )}
        </div>

        {/* Actions (au hover) */}
        <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(category)
            }}
            className="p-1.5!"
            aria-label="Modifier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(category)
            }}
            className="!p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Indicateur de drop "after" (ligne entre deux catégories) */}
      {isDropTarget && canDrop && dropPosition === 'after' && (
        <div
          className="h-0.5 bg-indigo-500 mx-4 relative z-20 animate-pulse"
          style={{ marginLeft: `${level * 32 + 16}px` }}
        >
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-indigo-500 rounded-full" />
        </div>
      )}

      {/* Enfants avec animation collapse/expand */}
      {hasChildren && (
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="relative">
            {category.children!.map((child) => (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                isExpanded={expandedIds.has(child.id)}
                onToggleExpand={() => {
                  const newExpandedIds = new Set(expandedIds)
                  if (newExpandedIds.has(child.id)) {
                    newExpandedIds.delete(child.id)
                  } else {
                    newExpandedIds.add(child.id)
                  }
                }}
                draggedCategory={draggedCategory}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
                dropTargetId={dropTargetId}
                dropPosition={dropPosition}
                isMoving={isMoving}
                expandedIds={expandedIds}
                focusedId={focusedId}
                onFocus={onFocus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Vérifie si une catégorie est un enfant d'une autre (récursif)
function isChildOf(category: Category, parentId: number): boolean {
  if (!category.children) return false
  for (const child of category.children) {
    if (child.id === parentId) return true
    if (isChildOf(child, parentId)) return true
  }
  return false
}

// Collecte tous les IDs de catégories (récursif)
function getAllCategoryIds(categories: Category[]): number[] {
  const ids: number[] = []
  const collect = (cats: Category[]) => {
    for (const cat of cats) {
      ids.push(cat.id)
      if (cat.children) {
        collect(cat.children)
      }
    }
  }
  collect(categories)
  return ids
}

export function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onMove,
  isMoving = false,
  expandAll,
  onExpandedChange,
}: CategoryTreeProps) {
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)
  const [dropTargetId, setDropTargetId] = useState<number | null>(null)
  const [dropPosition, setDropPosition] = useState<'inside' | 'after' | null>(null)
  const [focusedId, setFocusedId] = useState<number | null>(null)

  // État d'expansion unifié avec persistance localStorage
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('categoryTreeExpanded')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return new Set(parsed)
      } catch {
        return new Set(getAllCategoryIds(categories))
      }
    }
    return new Set(getAllCategoryIds(categories))
  })

  // Synchroniser avec prop expandAll
  useEffect(() => {
    if (expandAll !== undefined) {
      const allIds = getAllCategoryIds(categories)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedIds(expandAll ? new Set(allIds) : new Set())
    }
  }, [expandAll, categories])

  // Persister l'état d'expansion
  useEffect(() => {
    localStorage.setItem('categoryTreeExpanded', JSON.stringify(Array.from(expandedIds)))
    onExpandedChange?.(expandedIds)
  }, [expandedIds, onExpandedChange])

  // Toggle expansion d'une catégorie
  const toggleExpand = useCallback((categoryId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  const handleDragStart = (category: Category) => {
    setDraggedCategory(category)
  }

  const handleDragEnd = () => {
    setDraggedCategory(null)
    setDropTargetId(null)
    setDropPosition(null)
  }

  const handleDragOver = (e: React.DragEvent, targetId: number | null, position: 'inside' | 'after') => {
    e.preventDefault()
    setDropTargetId(targetId)
    setDropPosition(position)
  }

  const handleDrop = (targetId: number | null, position: 'inside' | 'after') => {
    if (draggedCategory && targetId !== draggedCategory.id) {
      // Si position === 'inside', déplacer en tant qu'enfant de targetId
      // Si position === 'after', pour simplifier on fait pareil (l'API ne gère que le parent)
      onMove(draggedCategory.id, position === 'inside' ? targetId : targetId)
    }
    handleDragEnd()
  }

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center animate-fadeIn">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Aucune catégorie
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Créez votre première catégorie pour organiser vos produits
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700" role="tree">
      {/* Zone de drop pour "racine" */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (draggedCategory && draggedCategory.parent_id !== null) {
            setDropTargetId(0)
            setDropPosition('inside')
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (draggedCategory && draggedCategory.parent_id !== null) {
            onMove(draggedCategory.id, null)
          }
          handleDragEnd()
        }}
        className={`
          p-3 text-sm text-center transition-all duration-200
          ${dropTargetId === 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-400 dark:text-gray-500'}
        `}
      >
        {draggedCategory ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Déposer ici pour mettre à la racine
          </div>
        ) : (
          <span className="text-xs">Glissez-déposez une catégorie ici pour la déplacer</span>
        )}
      </div>

      {/* Arbre des catégories */}
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          isExpanded={expandedIds.has(category.id)}
          onToggleExpand={() => toggleExpand(category.id)}
          draggedCategory={draggedCategory}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          dropTargetId={dropTargetId}
          dropPosition={dropPosition}
          isMoving={isMoving}
          expandedIds={expandedIds}
          focusedId={focusedId}
          onFocus={setFocusedId}
        />
      ))}
    </div>
  )
}
