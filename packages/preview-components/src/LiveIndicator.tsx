import { clsx } from 'clsx'
import { Zap } from 'lucide-react'

/**
 * Props du composant LiveIndicator
 */
export interface LiveIndicatorProps {
  /** Afficher l'indicateur (défaut: true) */
  visible?: boolean
  /** Classe CSS additionnelle */
  className?: string
  /** Texte personnalisé (défaut: "LIVE") */
  label?: string
}

/**
 * LiveIndicator - Badge animé indiquant un preview temps réel
 *
 * @example
 * ```tsx
 * <LiveIndicator />
 * <LiveIndicator label="APERÇU EN DIRECT" />
 * ```
 */
export function LiveIndicator({
  visible = true,
  className,
  label = 'LIVE',
}: LiveIndicatorProps) {
  if (!visible) return null

  return (
    <div
      className={clsx(
        'live-indicator',
        'inline-flex items-center gap-2 px-3 py-1.5',
        'bg-gradient-to-r from-red-500 to-pink-500',
        'text-white text-xs font-bold uppercase tracking-wider',
        'rounded-full shadow-lg',
        'animate-pulse',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Dot animé */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>

      {/* Label */}
      <span>{label}</span>

      {/* Icon */}
      <Zap className="h-3 w-3" fill="currentColor" />
    </div>
  )
}
