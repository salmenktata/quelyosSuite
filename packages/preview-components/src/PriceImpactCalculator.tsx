import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Props du composant PriceImpactCalculator
 */
export interface PriceImpactCalculatorProps {
  /** Prix original */
  originalPrice: number
  /** Nouveau prix */
  newPrice: number
  /** Devise (défaut: "€") */
  currency?: string
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * PriceImpactCalculator - Calculateur impact changement prix
 *
 * Affiche la différence de prix et le pourcentage d'évolution
 * avec code couleur (hausse=rouge, baisse=vert, stable=gris)
 *
 * @example
 * ```tsx
 * <PriceImpactCalculator originalPrice={100} newPrice={85} />
 * // Affiche: -15€ (-15%) en vert
 * ```
 */
export function PriceImpactCalculator({
  originalPrice,
  newPrice,
  currency = '€',
  className,
}: PriceImpactCalculatorProps) {
  const [diff, setDiff] = useState(0)
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const difference = newPrice - originalPrice
    const percentage = originalPrice > 0 ? (difference / originalPrice) * 100 : 0
    setDiff(difference)
    setPercent(percentage)
  }, [originalPrice, newPrice])

  const isIncrease = diff > 0
  const isDecrease = diff < 0
  const isStable = diff === 0

  const Icon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus

  return (
    <div
      className={clsx(
        'price-impact-calculator',
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
        isIncrease && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
        isDecrease && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
        isStable && 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        className
      )}
      role="status"
      aria-label={`Impact prix: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}${currency} (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)`}
    >
      <Icon className="h-4 w-4" />
      <span>
        {diff > 0 && '+'}
        {diff.toFixed(2)}
        {currency}
      </span>
      <span className="opacity-75">
        ({percent > 0 && '+'}
        {percent.toFixed(1)}%)
      </span>
    </div>
  )
}
