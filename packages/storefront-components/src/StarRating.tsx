import { Star } from 'lucide-react'
import { clsx } from 'clsx'

interface StarRatingProps {
  /** Note de 0 à 5 */
  rating: number
  /** Nombre total d'étoiles (défaut: 5) */
  maxStars?: number
  /** Taille des étoiles */
  size?: 'sm' | 'md' | 'lg'
  /** Mode interactif (permet de changer la note) */
  interactive?: boolean
  /** Callback changement note (mode interactif uniquement) */
  onChange?: (rating: number) => void
  /** Afficher nombre d'avis */
  showCount?: boolean
  /** Nombre d'avis */
  count?: number
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * StarRating - Affichage et saisie notes par étoiles
 *
 * Fonctionnalités :
 * - Affichage note (étoiles pleines/vides/demi)
 * - Mode interactif (sélection note)
 * - 3 tailles: sm, md, lg
 * - Compteur avis optionnel
 * - Support dark mode
 * - Hover effect en mode interactif
 *
 * @example
 * ```tsx
 * <StarRating rating={4.5} showCount count={127} />
 * <StarRating rating={0} interactive onChange={setRating} />
 * ```
 */
export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showCount = false,
  count = 0,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex + 1)
    }
  }

  const renderStars = () => {
    const stars = []

    for (let i = 0; i < maxStars; i++) {
      const filled = rating >= i + 1
      const halfFilled = rating > i && rating < i + 1

      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          disabled={!interactive}
          className={clsx(
            'focus:outline-none',
            interactive && 'cursor-pointer hover:scale-110 transition-transform'
          )}
          aria-label={`Note ${i + 1} sur ${maxStars}`}
        >
          <Star
            className={clsx(
              sizeClasses[size],
              filled || halfFilled
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700'
            )}
            style={
              halfFilled
                ? {
                    clipPath: 'inset(0 50% 0 0)',
                  }
                : undefined
            }
          />
        </button>
      )
    }

    return stars
  }

  return (
    <div className={clsx('inline-flex items-center gap-2', className)}>
      {/* Étoiles */}
      <div className="flex items-center gap-0.5" role="img" aria-label={`Note: ${rating} sur ${maxStars}`}>
        {renderStars()}
      </div>

      {/* Nombre d'avis */}
      {showCount && count > 0 && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          ({count})
        </span>
      )}
    </div>
  )
}
