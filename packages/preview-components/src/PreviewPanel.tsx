import { ReactNode } from 'react'
import { clsx } from 'clsx'

/**
 * Type de device pour le preview
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Props du composant PreviewPanel
 */
export interface PreviewPanelProps {
  /** Contenu à prévisualiser */
  children: ReactNode
  /** Type de device (affecte la largeur) */
  device?: DeviceType
  /** Classe CSS additionnelle */
  className?: string
  /** Hauteur du panel */
  height?: string | number
  /** Afficher la barre d'URL simulée */
  showUrlBar?: boolean
  /** URL simulée à afficher */
  url?: string
}

/**
 * Dimensions par device
 */
const DEVICE_WIDTHS: Record<DeviceType, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
}

/**
 * PreviewPanel - Container pour prévisualiser du contenu dans un contexte simulé
 *
 * @example
 * ```tsx
 * <PreviewPanel device="mobile" showUrlBar url="https://shop.example.com">
 *   <HeroSlider slides={slides} />
 * </PreviewPanel>
 * ```
 */
export function PreviewPanel({
  children,
  device = 'desktop',
  className,
  height = '600px',
  showUrlBar = false,
  url = 'https://example.com',
}: PreviewPanelProps) {
  const width = DEVICE_WIDTHS[device]

  return (
    <div
      className={clsx(
        'preview-panel',
        'bg-gray-50 dark:bg-gray-900',
        'rounded-lg border border-gray-200 dark:border-gray-700',
        'overflow-hidden shadow-lg',
        'transition-all duration-300',
        className
      )}
      style={{ height }}
    >
      {/* Barre URL simulée (optionnelle) */}
      {showUrlBar && (
        <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-white dark:bg-gray-700 rounded px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
            {url}
          </div>
        </div>
      )}

      {/* Container avec largeur device */}
      <div
        className="preview-content mx-auto h-full overflow-auto bg-white dark:bg-gray-950"
        style={{ width, maxWidth: '100%' }}
      >
        {children}
      </div>
    </div>
  )
}
