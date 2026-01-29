import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Star } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface SubMenuItem {
  name: string
  path?: string
  badge?: string
  separator?: boolean
}

export interface MenuItem {
  name: string
  path?: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: SubMenuItem[]
}

interface SidebarMenuItemProps {
  item: MenuItem
  isActive: (path: string) => boolean
  moduleColor: string
  openMenus: Set<string>
  onToggleMenu: (name: string) => void
  isCollapsed?: boolean
  isCompact?: boolean
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

interface TooltipPosition {
  top: number
  left: number
}

export function SidebarMenuItem({
  item,
  isActive,
  moduleColor,
  openMenus,
  onToggleMenu,
  isCollapsed = false,
  isCompact = false,
  isFavorite = false,
  onToggleFavorite
}: SidebarMenuItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0 })
  const itemRef = useRef<HTMLDivElement>(null)

  const hasSubItems = item.subItems && item.subItems.length > 0
  const isOpen = openMenus.has(item.name)
  const ItemIcon = item.icon

  // Pour les items SANS sous-items : correspondance exacte seulement
  // Pour les items AVEC sous-items : correspondance exacte OU sous-item actif
  const isCurrentlyActive = item.path
    ? (hasSubItems ? isActive(item.path) : window.location.pathname === item.path)
    : item.subItems?.some(sub => sub.path && isActive(sub.path))

  const handleMouseEnter = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect()
      setTooltipPos({
        top: rect.top,
        left: rect.right + 8
      })
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Mode réduit : item sans sous-items (lien direct avec tooltip)
  if (isCollapsed && !hasSubItems && item.path) {
    return (
      <div ref={itemRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Link
          to={item.path}
          className={`flex items-center justify-center rounded-lg p-2 transition-all ${
            isCurrentlyActive
              ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ItemIcon className="h-5 w-5" />
        </Link>
        {isHovered && createPortal(
          <div
            className="fixed z-[9999] whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg pointer-events-none"
            style={{ top: tooltipPos.top + 4, left: tooltipPos.left }}
          >
            {item.name}
          </div>,
          document.body
        )}
      </div>
    )
  }

  // Mode réduit : item avec sous-items (popup au hover)
  if (isCollapsed && hasSubItems) {
    return (
      <div ref={itemRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          className={`flex w-full items-center justify-center rounded-lg p-2 transition-all ${
            isCurrentlyActive
              ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ItemIcon className="h-5 w-5" />
        </button>
        {isHovered && createPortal(
          <div
            className="fixed z-[9999] min-w-48 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl py-2"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 mb-1">
              {item.name}
            </div>
            {item.subItems!.map((subItem, idx) => {
              if (subItem.separator) {
                return (
                  <div
                    key={`separator-${idx}`}
                    className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mt-1"
                  >
                    {subItem.name}
                  </div>
                )
              }
              if (!subItem.path) return null
              const isSubActive = isActive(subItem.path)
              return (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-all ${
                    isSubActive
                      ? `${moduleColor} font-medium bg-gray-50 dark:bg-gray-700/50`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>{subItem.name}</span>
                  {subItem.badge && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      {subItem.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>,
          document.body
        )}
      </div>
    )
  }

  // Mode normal : item sans sous-items (lien direct)
  if (!hasSubItems && item.path) {
    return (
      <Link
        to={item.path}
        className={cn(
          'group flex items-center rounded-lg font-medium transition-all relative',
          isCompact ? 'gap-2 px-2 py-1 text-xs' : 'gap-3 px-3 py-2 text-sm',
          isCurrentlyActive
            ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <ItemIcon className={cn(isCompact ? 'h-4 w-4' : 'h-5 w-5')} />
        <span className="flex-1">{item.name}</span>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="opacity-0 group-hover:opacity-100 absolute right-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star
              className={cn(
                'w-3 h-3',
                isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
              )}
            />
          </button>
        )}
      </Link>
    )
  }

  // Mode normal : item avec sous-items (menu déroulant)
  return (
    <div>
      <button
        onClick={() => onToggleMenu(item.name)}
        className={cn(
          'group flex w-full items-center rounded-lg font-medium transition-all',
          isCompact ? 'gap-2 px-2 py-1 text-xs' : 'gap-3 px-3 py-2 text-sm',
          isCurrentlyActive
            ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <ItemIcon className={cn(isCompact ? 'h-4 w-4' : 'h-5 w-5')} />
        <span className="flex-1 text-left">{item.name}</span>
        {isOpen ? (
          <ChevronDown className={cn(isCompact ? 'h-3 w-3' : 'h-4 w-4')} />
        ) : (
          <ChevronRight className={cn(isCompact ? 'h-3 w-3' : 'h-4 w-4')} />
        )}
      </button>

      {isOpen && item.subItems && (
        <div className={cn('border-l-2 border-gray-200 dark:border-gray-600', isCompact ? 'ml-3 mt-0.5 pl-2' : 'ml-4 mt-1 pl-3')}>
          {item.subItems.map((subItem, idx) => {
            if (subItem.separator) {
              return (
                <div
                  key={`separator-${idx}`}
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700',
                    isCompact ? 'px-2 pt-2 pb-0.5 mt-1' : 'px-3 pt-3 pb-1 mt-2'
                  )}
                >
                  {subItem.name}
                </div>
              )
            }

            if (!subItem.path) return null

            const isSubActive = isActive(subItem.path)

            return (
              <Link
                key={subItem.path}
                to={subItem.path}
                className={cn(
                  'flex items-center gap-2 rounded-md text-xs transition-all',
                  isCompact ? 'px-2 py-1' : 'px-3 py-2',
                  isSubActive
                    ? `bg-gray-100 dark:bg-gray-700 ${moduleColor} font-medium`
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <span>{subItem.name}</span>
                {subItem.badge && (
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    {subItem.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
