import { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Props du composant CustomerViewTooltip
 */
export interface CustomerViewTooltipProps {
  /** Contenu du tooltip */
  children: ReactNode
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * CustomerViewTooltip - Tooltip "Ce que clients voient"
 *
 * Affiche un message explicatif sur hover pour indiquer comment
 * un élément apparaît du point de vue client.
 *
 * @example
 * ```tsx
 * <CustomerViewTooltip>
 *   Ce prix sera affiché en rouge pour créer l'urgence
 * </CustomerViewTooltip>
 * ```
 */
export function CustomerViewTooltip({
  children,
  className,
}: CustomerViewTooltipProps) {
  return (
    <div className={clsx('customer-view-tooltip', 'group relative inline-flex', className)}>
      {/* Icon trigger */}
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        aria-label="Ce que les clients voient"
      >
        <Eye className="h-4 w-4" />
        <span className="font-medium">Vue client</span>
      </button>

      {/* Tooltip content */}
      <div
        className={clsx(
          'absolute bottom-full left-0 mb-2 hidden group-hover:block',
          'w-64 p-3 rounded-lg shadow-lg',
          'bg-gray-900 dark:bg-gray-800 text-white text-sm',
          'z-50 pointer-events-none',
          'before:content-[""] before:absolute before:top-full before:left-4',
          'before:border-4 before:border-transparent before:border-t-gray-900',
          'dark:before:border-t-gray-800'
        )}
        role="tooltip"
      >
        {children}
      </div>
    </div>
  )
}
