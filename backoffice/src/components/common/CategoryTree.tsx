import { useState } from 'react'
import { Category } from '../../types'
import { Badge, Button } from './index'

interface CategoryTreeProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onMove: (categoryId: number, newParentId: number | null) => void
  expandedIds?: Set<number>
  onToggleExpand?: (categoryId: number) => void
  isMoving?: boolean
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
  onDragOver: (e: React.DragEvent, targetId: number | null) => void
  onDrop: (targetId: number | null) => void
  dropTargetId: number | null
  isMoving: boolean
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
  isMoving,
}: CategoryNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isDragging = draggedCategory?.id === category.id
  const isDropTarget = dropTargetId === category.id

  // Empêcher de dropper sur soi-même ou ses enfants
  const canDrop = draggedCategory &&
    draggedCategory.id !== category.id &&
    !isChildOf(draggedCategory, category.id)

  return (
    <div className="select-none">
      {/* Ligne de la catégorie */}
      <div
        draggable={!isMoving}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          onDragStart(category)
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          e.preventDefault()
          if (canDrop) {
            onDragOver(e, category.id)
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (canDrop) {
            onDrop(category.id)
          }
        }}
        className={`
          group flex items-center gap-3 px-4 py-3
          ${isDragging ? 'opacity-50 bg-gray-100 dark:bg-gray-700' : ''}
          ${isDropTarget && canDrop ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500 ring-inset' : ''}
          hover:bg-gray-50 dark:hover:bg-gray-700/50
          transition-colors duration-150
          cursor-grab active:cursor-grabbing
        `}
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        {/* Bouton expand/collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className={`
            w-6 h-6 flex items-center justify-center rounded
            ${hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : ''}
            transition-colors
          `}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            <svg
              className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-4 h-4" />
          )}
        </button>

        {/* Icône dossier */}
        <svg
          className={`w-5 h-5 ${hasChildren ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {hasChildren ? (
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          ) : (
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
          )}
        </svg>

        {/* Nom */}
        <span className="flex-1 font-medium text-gray-900 dark:text-white truncate">
          {category.name}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {/* Badge nombre de produits */}
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

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(category)
            }}
            className="!p-1.5"
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

      {/* Enfants (récursif) */}
      {hasChildren && isExpanded && (
        <div className="border-l border-gray-200 dark:border-gray-700 ml-6">
          {category.children!.map((child) => (
            <CategoryNodeWrapper
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              draggedCategory={draggedCategory}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dropTargetId={dropTargetId}
              isMoving={isMoving}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Wrapper pour gérer l'état d'expansion individuel
function CategoryNodeWrapper(props: Omit<CategoryNodeProps, 'isExpanded' | 'onToggleExpand'>) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <CategoryNode
      {...props}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
    />
  )
}

// Vérifie si une catégorie est un enfant d'une autre
function isChildOf(category: Category, parentId: number): boolean {
  if (!category.children) return false
  for (const child of category.children) {
    if (child.id === parentId) return true
    if (isChildOf(child, parentId)) return true
  }
  return false
}

export function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onMove,
  isMoving = false,
}: CategoryTreeProps) {
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)
  const [dropTargetId, setDropTargetId] = useState<number | null>(null)

  const handleDragStart = (category: Category) => {
    setDraggedCategory(category)
  }

  const handleDragEnd = () => {
    setDraggedCategory(null)
    setDropTargetId(null)
  }

  const handleDragOver = (e: React.DragEvent, targetId: number | null) => {
    e.preventDefault()
    setDropTargetId(targetId)
  }

  const handleDrop = (targetId: number | null) => {
    if (draggedCategory && targetId !== draggedCategory.id) {
      onMove(draggedCategory.id, targetId)
    }
    handleDragEnd()
  }

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center">
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
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Zone de drop pour "racine" (déplacer au niveau racine) */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (draggedCategory && draggedCategory.parent_id !== null) {
            setDropTargetId(0) // 0 représente la racine
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
          p-2 text-sm text-center
          ${dropTargetId === 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
          transition-colors
        `}
      >
        {draggedCategory ? '↓ Déposer ici pour mettre à la racine' : ''}
      </div>

      {/* Arbre des catégories */}
      {categories.map((category) => (
        <CategoryNodeWrapper
          key={category.id}
          category={category}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          draggedCategory={draggedCategory}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          dropTargetId={dropTargetId}
          isMoving={isMoving}
        />
      ))}
    </div>
  )
}
