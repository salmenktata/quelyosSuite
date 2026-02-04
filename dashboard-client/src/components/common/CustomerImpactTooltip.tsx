/**
 * CustomerImpactTooltip - Tooltip Impact Client
 *
 * Affiche des tooltips contextuels expliquant l'impact
 * des actions/configurations sur l'expérience client.
 *
 * Features :
 * - Affichage au hover/focus
 * - Support images/screenshots
 * - Dark mode
 * - Positionnement intelligent
 *
 * @module components/common
 */

import { useState, useRef, useEffect } from 'react'
import { Eye, Info, Lightbulb } from 'lucide-react'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
export type TooltipVariant = 'impact' | 'info' | 'preview'

interface CustomerImpactTooltipProps {
  /** Contenu du tooltip (texte ou JSX) */
  content: React.ReactNode
  /** Screenshot/image à afficher (optionnel) */
  imageUrl?: string
  /** Alt text pour l'image */
  imageAlt?: string
  /** Position du tooltip */
  position?: TooltipPosition
  /** Variante visuelle */
  variant?: TooltipVariant
  /** Élément déclencheur (children) */
  children: React.ReactNode
  /** Largeur max du tooltip */
  maxWidth?: number
  /** Délai avant affichage (ms) */
  delay?: number
  /** Classe CSS additionnelle */
  className?: string
}

export function CustomerImpactTooltip({
  content,
  imageUrl,
  imageAlt = 'Aperçu',
  position = 'top',
  variant = 'impact',
  children,
  maxWidth = 320,
  delay = 300,
  className = '',
}: CustomerImpactTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Ajuster position si tooltip déborde
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let newPosition = position

    // Vérifier débordement et ajuster
    if (position === 'top' && triggerRect.top - tooltipRect.height < 0) {
      newPosition = 'bottom'
    } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewportHeight) {
      newPosition = 'top'
    } else if (position === 'left' && triggerRect.left - tooltipRect.width < 0) {
      newPosition = 'right'
    } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewportWidth) {
      newPosition = 'left'
    }

    // Ajuster seulement si différent (évite re-render inutile)
    if (newPosition !== actualPosition) {
      setActualPosition(newPosition)
    }
  }, [isVisible, position, actualPosition])

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const handleFocus = () => {
    setIsVisible(true)
  }

  const handleBlur = () => {
    setIsVisible(false)
  }

  // Styles selon variante
  const variantConfig = {
    impact: {
      icon: Lightbulb,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-gray-900 dark:text-white',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-gray-900 dark:text-white',
    },
    preview: {
      icon: Eye,
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      border: 'border-indigo-200 dark:border-indigo-800',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      textColor: 'text-gray-900 dark:text-white',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  // Calcul position CSS
  const getPositionStyles = (): React.CSSProperties => {
    const offset = 12

    switch (actualPosition) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: `${offset}px`,
        }
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: `${offset}px`,
        }
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: `${offset}px`,
        }
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: `${offset}px`,
        }
    }
  }

  // Flèche position
  const getArrowStyles = (): string => {
    const arrowBase = 'absolute w-0 h-0 border-4 border-transparent'
    const arrowColor = config.border.includes('amber')
      ? 'border-t-amber-200 dark:border-t-amber-800'
      : config.border.includes('blue')
        ? 'border-t-blue-200 dark:border-t-blue-800'
        : 'border-t-indigo-200 dark:border-t-indigo-800'

    switch (actualPosition) {
      case 'top':
        return `${arrowBase} ${arrowColor} top-full left-1/2 -translate-x-1/2 rotate-180`
      case 'bottom':
        return `${arrowBase} ${arrowColor} bottom-full left-1/2 -translate-x-1/2`
      case 'left':
        return `${arrowBase} ${arrowColor} left-full top-1/2 -translate-y-1/2 rotate-90`
      case 'right':
        return `${arrowBase} ${arrowColor} right-full top-1/2 -translate-y-1/2 -rotate-90`
    }
  }

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Trigger */}
      {children}

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="absolute z-50 animate-[fadeIn_0.15s_ease-out]"
          style={{ ...getPositionStyles(), maxWidth: `${maxWidth}px` }}
        >
          {/* Arrow */}
          <div className={getArrowStyles()} />

          {/* Content */}
          <div
            className={`border ${config.border} ${config.bg} backdrop-blur-sm rounded-lg shadow-xl overflow-hidden`}
          >
            {/* Header avec icône */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-current/10">
              <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0`} />
              <span className={`text-xs font-medium ${config.iconColor}`}>
                {variant === 'impact'
                  ? '💡 Impact Client'
                  : variant === 'preview'
                    ? 'Aperçu Client'
                    : 'Information'}
              </span>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className={`text-sm ${config.textColor} leading-relaxed`}>{content}</div>

              {/* Image preview */}
              {imageUrl && (
                <div className="mt-3 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  {imageAlt && (
                    <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {imageAlt}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Variantes pré-configurées pour cas d'usage courants
 */
export function ImpactTooltip(props: Omit<CustomerImpactTooltipProps, 'variant'>) {
  return <CustomerImpactTooltip {...props} variant="impact" />
}

export function PreviewTooltip(props: Omit<CustomerImpactTooltipProps, 'variant'>) {
  return <CustomerImpactTooltip {...props} variant="preview" />
}

export function InfoTooltip(props: Omit<CustomerImpactTooltipProps, 'variant'>) {
  return <CustomerImpactTooltip {...props} variant="info" />
}
