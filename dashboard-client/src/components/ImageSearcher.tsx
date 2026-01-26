import { useState } from 'react'
import { Button } from './common'

interface UnsplashImage {
  id: string
  urls: {
    regular: string
    small: string
  }
  alt_description: string
  user: {
    name: string
    links: {
      html: string
    }
  }
}

interface ImageSearcherProps {
  onSelectImage: (imageUrl: string) => void
  currentImageUrl?: string
}

export function ImageSearcher({ onSelectImage, currentImageUrl }: ImageSearcherProps) {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<UnsplashImage[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl || '')

  // Unsplash API (gratuit, 50 requêtes/heure)
  const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY' // À remplacer

  const searchImages = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      // API Unsplash
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      )

      const data = await response.json()
      setImages(data.results || [])
    } catch (error) {
      console.error('Erreur recherche Unsplash:', error)
      // Fallback : images par défaut
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (imageUrl: string) => {
    setSelectedUrl(imageUrl)
    onSelectImage(imageUrl)
  }

  // Images de démonstration si pas de clé API
  const demoImages = [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=1200&h=600&fit=crop',
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rechercher une image
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchImages()}
            placeholder="Ex: sport, fitness, promo..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Button onClick={searchImages} disabled={loading || !query.trim()}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Powered by Unsplash - Images libres de droits
        </p>
      </div>

      {/* Preview image actuelle */}
      {selectedUrl && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image sélectionnée
          </label>
          <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={selectedUrl}
              alt="Selected"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Grille d'images */}
      {images.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sélectionnez une image
          </label>
          <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {images.map(img => (
              <button
                key={img.id}
                type="button"
                onClick={() => handleSelectImage(img.urls.regular)}
                className={`relative h-24 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition ${
                  selectedUrl === img.urls.regular ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                <img
                  src={img.urls.small}
                  alt={img.alt_description || 'Unsplash image'}
                  className="w-full h-full object-cover"
                />
                {selectedUrl === img.urls.regular && (
                  <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : !loading && query && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucune image trouvée. Essayez une autre recherche.
        </div>
      )}

      {/* Images de démo si aucune recherche */}
      {!query && images.length === 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Images de démonstration
          </label>
          <div className="grid grid-cols-2 gap-3">
            {demoImages.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectImage(url)}
                className={`relative h-24 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition ${
                  selectedUrl === url ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                <img
                  src={url}
                  alt={`Demo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedUrl === url && (
                  <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ou saisir URL manuellement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ou coller une URL d'image
        </label>
        <input
          type="url"
          value={selectedUrl}
          onChange={e => handleSelectImage(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>
    </div>
  )
}
