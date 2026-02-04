import { useState } from 'react'
import { PreviewPanel, DeviceToggle, LiveIndicator, DeviceType } from '@quelyos/preview-components'
import type { HeroSlideFormData } from './HeroSlideForm'

interface HeroSlidePreviewProps {
  formData: HeroSlideFormData
}

/**
 * HeroSlidePreview - Aperçu temps réel d'un Hero Slide
 *
 * Affiche comment le slide apparaîtra sur le site e-commerce
 * avec possibilité de changer de device (mobile/tablet/desktop)
 */
export function HeroSlidePreview({ formData }: HeroSlidePreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')

  return (
    <div className="space-y-4">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aperçu en Direct
        </h3>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <DeviceToggle value={device} onChange={setDevice} />
        </div>
      </div>

      {/* Panel de preview */}
      <PreviewPanel device={device} height="500px" showUrlBar url="https://votreboutique.com">
        <div className="relative h-full min-h-[400px] flex items-center justify-center overflow-hidden">
          {/* Image de fond */}
          {formData.image_url ? (
            <img
              src={formData.image_url}
              alt={formData.title || 'Hero slide'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
          )}

          {/* Overlay sombre pour meilleure lisibilité */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Contenu du slide */}
          <div className="relative z-10 text-center px-6 py-12 max-w-4xl mx-auto">
            {/* Sous-titre */}
            {formData.subtitle && (
              <p className="text-sm md:text-base font-medium text-white/90 mb-2 uppercase tracking-wide">
                {formData.subtitle}
              </p>
            )}

            {/* Titre principal */}
            {formData.title && (
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                {formData.title}
              </h1>
            )}

            {/* Description */}
            {formData.description && (
              <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                {formData.description}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {formData.cta_text && (
                <button
                  type="button"
                  className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                >
                  {formData.cta_text}
                </button>
              )}
              {formData.cta_secondary_text && (
                <button
                  type="button"
                  className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  {formData.cta_secondary_text}
                </button>
              )}
            </div>
          </div>

          {/* Badge statut */}
          {!formData.active && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
              Inactif
            </div>
          )}
        </div>
      </PreviewPanel>

      {/* Message informatif */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        💡 Les modifications sont visibles instantanément dans l'aperçu
      </p>
    </div>
  )
}
