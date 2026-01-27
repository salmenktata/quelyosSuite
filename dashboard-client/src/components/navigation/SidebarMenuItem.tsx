import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'

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
}

export function SidebarMenuItem({
  item,
  isActive,
  moduleColor,
  openMenus,
  onToggleMenu
}: SidebarMenuItemProps) {
  const hasSubItems = item.subItems && item.subItems.length > 0
  const isOpen = openMenus.has(item.name)
  const ItemIcon = item.icon
  const isCurrentlyActive = item.path ? isActive(item.path) : item.subItems?.some(sub => sub.path && isActive(sub.path))

  // Item sans sous-items (lien direct)
  if (!hasSubItems && item.path) {
    return (
      <Link
        to={item.path}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          isCurrentlyActive
            ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <ItemIcon className="h-5 w-5" />
        <span className="flex-1">{item.name}</span>
      </Link>
    )
  }

  // Item avec sous-items (menu déroulant)
  return (
    <div>
      <button
        onClick={() => onToggleMenu(item.name)}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          isCurrentlyActive
            ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <ItemIcon className="h-5 w-5" />
        <span className="flex-1 text-left">{item.name}</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {isOpen && item.subItems && (
        <div className="ml-4 mt-1 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
          {item.subItems.map((subItem, idx) => {
            if (subItem.separator) {
              return (
                <div
                  key={`separator-${idx}`}
                  className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mt-2"
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
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-all ${
                  isSubActive
                    ? `bg-gray-100 dark:bg-gray-700 ${moduleColor} font-medium`
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
        </div>
      )}
    </div>
  )
}
