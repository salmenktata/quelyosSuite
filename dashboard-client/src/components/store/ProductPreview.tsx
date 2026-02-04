/**
 * ProductPreview - Preview page produit côté client
 *
 * Affiche une prévisualisation temps réel de la page produit
 * telle que les clients la verront sur l'e-commerce.
 *
 * @module components/store
 */

import { PreviewPanel, DeviceToggle, LiveIndicator } from '@quelyos/preview-components'
import { useState } from 'react'
import { Badge } from '@/components/common'
import { ShoppingCart, Heart, Share2, Star } from 'lucide-react'

interface ProductPreviewProps {
  /** Données du formulaire produit */
  formData: {
    name: string
    price: string
    compare_at_price?: string
    description: string
    is_featured?: boolean
    is_new?: boolean
    is_bestseller?: boolean
    offer_end_date?: string
  }
  /** Images du produit */
  images?: Array<{ id: number; image_url: string; sequence: number }>
  /** Stock disponible */
  stockQty?: number | null
  /** Taxes applicables */
  selectedTaxIds?: number[]
}

export function ProductPreview({
  formData,
  images = [],
  stockQty,
}: ProductPreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  // Calculer prix avec réduction si compare_at_price existe
  const price = Number(formData.price) || 0
  const comparePrice = Number(formData.compare_at_price) || 0
  const hasDiscount = comparePrice > price
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0

  // Image principale
  const mainImage = images[0]?.image_url || 'https://via.placeholder.com/600x600?text=Aucune+image'

  return (
    <div className="space-y-4">
      {/* Header avec device toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Prévisualisation Client
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Aperçu de la page produit telle que vos clients la verront
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <DeviceToggle device={device} onDeviceChange={setDevice} />
        </div>
      </div>

      {/* Preview Panel */}
      <PreviewPanel device={device}>
        <div className="bg-white dark:bg-gray-900 min-h-screen p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Galerie images */}
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={mainImage}
                    alt={formData.name || 'Produit'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(0, 4).map((img, idx) => (
                      <div
                        key={img.id}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-indigo-500"
                      >
                        <img
                          src={img.image_url}
                          alt={`${formData.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info produit */}
              <div className="space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {formData.is_new && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                      Nouveau
                    </Badge>
                  )}
                  {formData.is_bestseller && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                      Bestseller
                    </Badge>
                  )}
                  {formData.is_featured && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                      Coup de cœur
                    </Badge>
                  )}
                  {hasDiscount && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                      -{discountPercent}%
                    </Badge>
                  )}
                </div>

                {/* Titre */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formData.name || 'Nom du produit'}
                  </h1>
                  {/* Rating (placeholder) */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < 4
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      4.0 (24 avis)
                    </span>
                  </div>
                </div>

                {/* Prix */}
                <div className="flex items-baseline gap-3">
                  {hasDiscount && (
                    <span className="text-2xl font-light text-gray-500 dark:text-gray-400 line-through">
                      {comparePrice.toFixed(2)} €
                    </span>
                  )}
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {price > 0 ? `${price.toFixed(2)} €` : 'Prix à définir'}
                  </span>
                </div>

                {/* Stock */}
                <div>
                  {stockQty !== null && stockQty !== undefined ? (
                    <p
                      className={`text-sm font-medium ${
                        stockQty > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {stockQty > 0 ? `En stock (${stockQty} disponibles)` : 'Rupture de stock'}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Stock non configuré
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300 prose prose-sm dark:prose-invert">
                    {formData.description ? (
                      <div dangerouslySetInnerHTML={{ __html: formData.description }} />
                    ) : (
                      <p className="italic">Aucune description</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Ajouter au panier
                  </button>
                  <div className="flex gap-2">
                    <button
                      disabled
                      className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Heart className="w-5 h-5" />
                      Favoris
                    </button>
                    <button
                      disabled
                      className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-5 h-5" />
                      Partager
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewPanel>

      {/* Notice informative */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Preview temps réel</strong> : Cette prévisualisation se met à jour automatiquement
          à mesure que vous modifiez le formulaire. Les boutons d&apos;action sont désactivés dans la preview.
        </p>
      </div>
    </div>
  )
}
