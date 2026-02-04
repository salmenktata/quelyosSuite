/**
 * Composant BannerPreview - Prévisualisation d'une bannière promotionnelle
 *
 * Affiche un aperçu en temps réel de la bannière avec :
 * - Le gradient de fond
 * - Le tag avec sa couleur
 * - Le titre et la description
 * - Le bouton avec sa couleur personnalisée
 * - Support multi-device (mobile/tablet/desktop)
 */

import { useState } from 'react'
import { PreviewPanel, DeviceToggle, LiveIndicator, DeviceType } from '@quelyos/preview-components'

interface BannerPreviewProps {
  formData: {
    name: string
    title: string
    description: string
    tag: string
    tag_color: string
    button_bg: string
    button_text: string
    button_link: string
    gradient: string
    active: boolean
  }
}

export function BannerPreview({ formData }: BannerPreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')

  return (
    <div className="space-y-4">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aperçu Bannière Promo
        </h3>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <DeviceToggle value={device} onChange={setDevice} />
        </div>
      </div>

      {/* Panel de preview */}
      <PreviewPanel device={device} height="350px" showUrlBar url="https://votreboutique.com">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <div
              className={`relative rounded-xl overflow-hidden bg-gradient-to-r ${formData.gradient} p-8 min-h-[240px] flex flex-col justify-center shadow-2xl`}
            >
              {formData.tag && (
                <div className="mb-3">
                  <span
                    className="inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full"
                    style={{
                      backgroundColor: formData.tag_color,
                      color: getContrastColor(formData.tag_color),
                    }}
                  >
                    {formData.tag}
                  </span>
                </div>
              )}

              {formData.title && (
                <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                  {formData.title}
                </h2>
              )}

              {formData.description && (
                <p className="text-white/90 text-lg mb-6 drop-shadow-md">
                  {formData.description}
                </p>
              )}

              {formData.button_text && (
                <div>
                  <button
                    type="button"
                    className="px-6 py-3 rounded-lg font-semibold text-sm transition hover:opacity-90 cursor-default shadow-lg"
                    style={{
                      backgroundColor: formData.button_bg,
                      color: getContrastColor(formData.button_bg),
                    }}
                  >
                    {formData.button_text}
                  </button>
                </div>
              )}

              {!formData.active && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-900/80 text-white backdrop-blur-sm">
                    Désactivée
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </PreviewPanel>

      {/* Informations */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <p>💡 Les modifications sont visibles instantanément</p>
        {formData.button_link && (
          <p>
            <span className="font-medium">Lien :</span> {formData.button_link}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Calcule la couleur de texte optimale (noir ou blanc) selon la couleur de fond
 * pour garantir un bon contraste
 */
function getContrastColor(hexColor: string): string {
  // Convertir hex en RGB
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculer la luminance relative (formule W3C)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Retourner noir ou blanc selon la luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
