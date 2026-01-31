import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { MODULES } from '@/config/modules'
import { cn } from '@/lib/utils'

interface QuickAccessProps {
  favorites: string[]
  recentPages: string[]
  moduleColor: string
  isActive: (path: string) => boolean
}

/**
 * Section sticky d'accès rapide affichant favoris et pages récentes
 */
export function QuickAccess({ favorites, recentPages: _recentPages, moduleColor: _moduleColor, isActive }: QuickAccessProps) {
  // Trouver les items correspondants dans la config
  const findMenuItem = (path: string) => {
    for (const module of MODULES) {
      for (const section of module.sections) {
        for (const item of section.items) {
          if (item.path === path) return { item, module }
          const subItem = item.subItems?.find((sub) => sub.path === path)
          if (subItem) return { item: subItem, module }
        }
      }
    }
    return null
  }

  if (favorites.length === 0) return null

  return (
    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 z-20">
      {/* Favoris */}
      {favorites.length > 0 && (
        <div className="px-3 py-2">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-gray-400 mb-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            Favoris
          </p>
          <div className="space-y-0.5">
            {favorites.slice(0, 3).map((path) => {
              const found = findMenuItem(path)
              if (!found) return null
              const { item, module } = found
              const Icon = item.icon

              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors',
                    isActive(path)
                      ? `bg-gray-100 dark:bg-gray-700 ${module.color} font-medium`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Section Récents désactivée */}
    </div>
  )
}
