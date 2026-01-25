import { ReactNode } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { formatPrice, formatNumber } from '../../lib/utils/formatters'

interface DashboardKPICardProps {
  title: string
  value: number
  variation?: number
  icon: ReactNode
  colorClass: string
  formatType?: 'price' | 'number'
  subtitle?: string
}

/**
 * Carte KPI réutilisable pour le dashboard
 * Affiche une métrique avec icône, valeur, variation et sous-titre optionnel
 */
export function DashboardKPICard({
  title,
  value,
  variation,
  icon,
  colorClass,
  formatType = 'number',
  subtitle,
}: DashboardKPICardProps) {
  const formattedValue = formatType === 'price' ? formatPrice(value) : formatNumber(value)
  const hasVariation = variation !== undefined && variation !== 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        {hasVariation && (
          <div
            className={`flex items-center gap-1 text-xs md:text-sm font-medium ${
              variation > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {variation > 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{Math.abs(variation).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{formattedValue}</p>
        {subtitle && <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>}
      </div>
    </div>
  )
}
