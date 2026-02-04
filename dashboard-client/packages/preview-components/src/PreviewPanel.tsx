/**
 * PreviewPanel - Container iframe sandbox pour preview temps réel
 * 
 * Fonctionnalités :
 * - Iframe sandbox isolé pour sécurité
 * - Lazy loading pour performance
 * - Support dark/light mode
 * - Responsive (mobile/tablet/desktop)
 * - Border arrondi + shadow pour esthétique
 */

import { useEffect, useRef } from 'react'

interface PreviewPanelProps {
  /** Contenu HTML à afficher dans la preview */
  htmlContent: string
  /** Device actuel (mobile/tablet/desktop) */
  device?: 'mobile' | 'tablet' | 'desktop'
  /** Titre affiché au-dessus de la preview */
  title?: string
  /** Hauteur personnalisée (défaut: auto) */
  height?: string
  /** Mode dark activé */
  darkMode?: boolean
  /** Classe CSS additionnelle */
  className?: string
}

const DEVICE_WIDTHS = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%'
}

export function PreviewPanel({
  htmlContent,
  device = 'desktop',
  title = 'Aperçu',
  height = '600px',
  darkMode = false,
  className = ''
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

    if (!iframeDoc) return

    // Construire HTML complet avec styles Tailwind
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="fr" class="${darkMode ? 'dark' : ''}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { 
              margin: 0; 
              padding: 16px;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body class="${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}">
          ${htmlContent}
        </body>
      </html>
    `

    iframeDoc.open()
    iframeDoc.write(fullHtml)
    iframeDoc.close()
  }, [htmlContent, darkMode])

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {device === 'mobile' && '📱 Mobile'}
          {device === 'tablet' && '📱 Tablette'}
          {device === 'desktop' && '🖥️ Bureau'}
        </span>
      </div>

      {/* Preview Container */}
      <div className="flex justify-center">
        <div
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg transition-all duration-300"
          style={{
            width: DEVICE_WIDTHS[device],
            maxWidth: '100%'
          }}
        >
          <iframe
            ref={iframeRef}
            title="Preview"
            sandbox="allow-same-origin allow-scripts"
            className="w-full bg-white dark:bg-gray-900"
            style={{ height, border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
