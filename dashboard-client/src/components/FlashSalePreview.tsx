import { useState, useEffect } from 'react'
import { PreviewPanel, DeviceToggle, LiveIndicator, DeviceType } from '@quelyos/preview-components'
import { Clock, TrendingUp } from 'lucide-react'

interface FlashSalePreviewProps {
  formData: {
    name: string
    description?: string
    dateStart?: string
    dateEnd?: string
    isActive: boolean
    backgroundColor?: string
    products?: Array<{
      id: number
      productName: string
      originalPrice: number
      flashPrice: number
      discountPercent: number
      qtyAvailable: number
      qtySold: number
    }>
  }
}

/**
 * FlashSalePreview - Aperçu temps réel d'une vente flash
 *
 * Affiche le countdown timer, la barre de stock, et le badge de réduction
 */
export function FlashSalePreview({ formData }: FlashSalePreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })

  // Calculer le temps restant
  useEffect(() => {
    if (!formData.dateEnd) return

    const calculateTimeLeft = () => {
      const end = new Date(formData.dateEnd!).getTime()
      const now = new Date().getTime()
      const difference = end - now

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [formData.dateEnd])

  // Utiliser le premier produit pour l'aperçu
  const firstProduct = formData.products?.[0]
  const discountPercent = firstProduct?.discountPercent || 0
  const stockPercent = firstProduct
    ? Math.min(((firstProduct.qtyAvailable - firstProduct.qtySold) / firstProduct.qtyAvailable) * 100, 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aperçu Vente Flash
        </h3>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <DeviceToggle value={device} onChange={setDevice} />
        </div>
      </div>

      {/* Panel de preview */}
      <PreviewPanel device={device} height="400px" showUrlBar url="https://votreboutique.com/flash-sales">
        <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 h-full">
          <div className="max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {/* Badge réduction */}
            {discountPercent > 0 && (
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{discountPercent}%
                </div>
              </div>
            )}

            {/* Image produit (placeholder) */}
            <div
              className="relative h-48 flex items-center justify-center"
              style={{
                background: formData.backgroundColor
                  ? `linear-gradient(135deg, ${formData.backgroundColor}ee, ${formData.backgroundColor}cc)`
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
            >
              <TrendingUp className="h-16 w-16 text-white opacity-50" />
              {!formData.isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">INACTIF</span>
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="p-4 space-y-3">
              {/* Nom produit */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {firstProduct?.productName || formData.name || 'Vente Flash'}
              </h3>

              {formData.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.description}
                </p>
              )}

              {/* Prix */}
              {firstProduct && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                    {firstProduct.originalPrice.toFixed(2)} €
                  </span>
                  <span className="text-2xl font-bold text-red-500">
                    {firstProduct.flashPrice.toFixed(2)} €
                  </span>
                </div>
              )}

              {/* Countdown timer */}
              {formData.dateEnd && (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <Clock className="h-3 w-3" />
                    <span>Se termine dans</span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <div className="text-center">
                      <div className="bg-white dark:bg-gray-800 rounded px-2 py-1 min-w-[40px]">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">h</span>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-gray-800 rounded px-2 py-1 min-w-[40px]">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">m</span>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-gray-800 rounded px-2 py-1 min-w-[40px]">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">s</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Barre de stock */}
              {firstProduct && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Stock restant</span>
                    <span className="font-medium">
                      {firstProduct.qtyAvailable - firstProduct.qtySold} / {firstProduct.qtyAvailable} unités
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        stockPercent > 50
                          ? 'bg-green-500'
                          : stockPercent > 20
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                type="button"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                J'en profite !
              </button>
            </div>
          </div>
        </div>
      </PreviewPanel>

      {/* Message informatif */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        💡 Le countdown et la barre de stock sont animés en temps réel
      </p>
    </div>
  )
}
