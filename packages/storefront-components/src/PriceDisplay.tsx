import { clsx } from 'clsx'

interface PriceDisplayProps {
  /** Prix actuel */
  price: number
  /** Prix original (pour afficher réduction) */
  originalPrice?: number
  /** Devise (défaut: "€") */
  currency?: string
  /** Position devise (défaut: "after") */
  currencyPosition?: 'before' | 'after'
  /** Variant d'affichage */
  variant?: 'default' | 'large' | 'compact'
  /** Afficher badge pourcentage réduction */
  showDiscount?: boolean
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * PriceDisplay - Affichage uniforme des prix
 *
 * Fonctionnalités :
 * - Prix avec réduction (strikethrough original)
 * - Badge pourcentage réduction automatique
 * - 3 variants: default, large, compact
 * - Support dark mode
 * - Position devise configurable
 *
 * @example
 * ```tsx
 * <PriceDisplay price={85} originalPrice={100} showDiscount />
 * // Affiche: 100€ 85€ (-15%)
 * ```
 */
export function PriceDisplay({
  price,
  originalPrice,
  currency = '€',
  currencyPosition = 'after',
  variant = 'default',
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  const formatPrice = (amount: number): string => {
    const formatted = amount.toFixed(2)
    return currencyPosition === 'before'
      ? `${currency}${formatted}`
      : `${formatted}${currency}`
  }

  const sizeClasses = {
    compact: 'text-sm',
    default: 'text-lg',
    large: 'text-2xl md:text-3xl',
  }

  return (
    <div className={clsx('inline-flex items-center gap-2 flex-wrap', className)}>
      {/* Prix original barré si réduction */}
      {hasDiscount && (
        <span
          className={clsx(
            'line-through text-gray-500 dark:text-gray-400',
            variant === 'large' ? 'text-lg' : 'text-base'
          )}
        >
          {formatPrice(originalPrice)}
        </span>
      )}

      {/* Prix actuel */}
      <span
        className={clsx(
          'font-bold',
          hasDiscount
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-900 dark:text-white',
          sizeClasses[variant]
        )}
      >
        {formatPrice(price)}
      </span>

      {/* Badge réduction */}
      {hasDiscount && showDiscount && discountPercent > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
          -{discountPercent}%
        </span>
      )}
    </div>
  )
}
