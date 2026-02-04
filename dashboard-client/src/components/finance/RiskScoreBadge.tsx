/**
 * Badge Scoring Risque Impayé
 *
 * Affiche score risque client 0-100 avec code couleur :
 * - 0-30 : Vert (faible)
 * - 31-60 : Jaune (moyen)
 * - 61-80 : Orange (élevé)
 * - 81-100 : Rouge (critique)
 *
 * @example
 * <RiskScoreBadge score={75} category="high" />
 * <RiskScoreBadge score={25} category="low" showLabel />
 */

import { AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react'

interface RiskScoreBadgeProps {
  score: number
  category: 'low' | 'medium' | 'high' | 'critical'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RiskScoreBadge({
  score,
  category,
  showLabel = false,
  size = 'md',
  className = '',
}: RiskScoreBadgeProps) {
  // Couleurs selon catégorie
  const categoryConfig = {
    low: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      icon: TrendingUp,
      label: 'Risque Faible',
    },
    medium: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: AlertCircle,
      label: 'Risque Moyen',
    },
    high: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      icon: AlertTriangle,
      label: 'Risque Élevé',
    },
    critical: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      label: 'Risque Critique',
    },
  }

  const config = categoryConfig[category]
  const Icon = config.icon

  // Tailles
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-0.5 text-xs',
      icon: 'h-3 w-3',
      score: 'text-xs font-semibold',
    },
    md: {
      badge: 'px-3 py-1 text-sm',
      icon: 'h-4 w-4',
      score: 'text-sm font-bold',
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
      score: 'text-base font-bold',
    },
  }

  const sizeConfig = sizeClasses[size]

  if (showLabel) {
    // Version avec label complet
    return (
      <div
        className={`inline-flex items-center space-x-2 rounded-lg border ${config.bg} ${config.border} ${sizeConfig.badge} ${className}`}
      >
        <Icon className={`${sizeConfig.icon} ${config.text}`} />
        <div className="flex flex-col">
          <span className={`${sizeConfig.score} ${config.text}`}>{score}/100</span>
          <span className={`text-xs ${config.text} opacity-75`}>{config.label}</span>
        </div>
      </div>
    )
  }

  // Version compacte score uniquement
  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded-full border ${config.bg} ${config.border} ${sizeConfig.badge} ${className}`}
      title={`${config.label} - Score ${score}/100`}
    >
      <Icon className={`${sizeConfig.icon} ${config.text}`} />
      <span className={`${sizeConfig.score} ${config.text}`}>{score}</span>
    </div>
  )
}

/**
 * Badge Scoring avec tooltip détaillé
 */
interface RiskScoreBadgeWithTooltipProps extends RiskScoreBadgeProps {
  avgPaymentDelay?: number
  latePaymentRate?: number
  totalOverdue?: number
  confidence?: number
}

export function RiskScoreBadgeWithTooltip({
  avgPaymentDelay,
  latePaymentRate,
  totalOverdue,
  confidence,
  ...badgeProps
}: RiskScoreBadgeWithTooltipProps) {
  return (
    <div className="group relative inline-block">
      <RiskScoreBadge {...badgeProps} />

      {/* Tooltip au survol */}
      <div className="absolute z-50 invisible group-hover:visible bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
        <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg p-3 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Score risque :</span>
              <span className="font-semibold">{badgeProps.score}/100</span>
            </div>

            {avgPaymentDelay !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Délai moyen :</span>
                <span>{avgPaymentDelay.toFixed(1)} jours</span>
              </div>
            )}

            {latePaymentRate !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Taux retard :</span>
                <span>{latePaymentRate.toFixed(1)}%</span>
              </div>
            )}

            {totalOverdue !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Créances en retard :</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(totalOverdue)}
                </span>
              </div>
            )}

            {confidence !== undefined && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Confiance :</span>
                  <span>{confidence.toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Flèche tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
