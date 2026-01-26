import { useState, useEffect } from 'react'
import { Button } from './common'
import { Link } from 'react-router-dom'
import { logger } from '@quelyos/logger';

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

interface PexelsImage {
  id: number
  src: {
    large2x: string
    medium: string
  }
  alt: string
  photographer: string
  photographer_url: string
}

interface UnifiedImage {
  id: string
  url: string
  thumbnail: string
  alt: string
  source: 'unsplash' | 'pexels'
  photographer: string
  photographer_url: string
}

type ImageSource = 'unsplash' | 'pexels' | 'both'

interface ImageSearcherProps {
  onSelectImage: (imageUrl: string) => void
  currentImageUrl?: string
}

export function ImageSearcher({ onSelectImage, currentImageUrl }: ImageSearcherProps) {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<UnifiedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl || '')
  const [source, setSource] = useState<ImageSource>('both')
  const [error, setError] = useState<string>('')
  const [apiKeys, setApiKeys] = useState({ unsplash: '', pexels: '' })

  // Charger les clés API depuis l'API au démarrage
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await fetch('/api/settings/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const data = await response.json()
        if (data.success) {
          setApiKeys({
            unsplash: data.settings.unsplash_key || import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
            pexels: data.settings.pexels_key || import.meta.env.VITE_PEXELS_API_KEY || ''
          })
        } else {
          // Fallback sur .env si API échoue
          setApiKeys({
            unsplash: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
            pexels: import.meta.env.VITE_PEXELS_API_KEY || ''
          })
        }
      } catch {
        // Fallback sur .env si erreur réseau
        setApiKeys({
          unsplash: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
          pexels: import.meta.env.VITE_PEXELS_API_KEY || ''
        })
      }
    }
    fetchApiKeys()
  }, [])

  const UNSPLASH_ACCESS_KEY = apiKeys.unsplash
  const PEXELS_API_KEY = apiKeys.pexels

  const searchUnsplash = async (): Promise<UnifiedImage[]> => {
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error('UNSPLASH_NOT_CONFIGURED')
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      )

      if (response.status === 401) {
        throw new Error('UNSPLASH_INVALID_KEY')
      }
      if (response.status === 403) {
        throw new Error('UNSPLASH_RATE_LIMIT')
      }
      if (!response.ok) {
        throw new Error('UNSPLASH_ERROR')
      }

      const data = await response.json()
      return (data.results || []).map((img: UnsplashImage) => ({
        id: `unsplash-${img.id}`,
        url: img.urls.regular,
        thumbnail: img.urls.small,
        alt: img.alt_description || 'Unsplash image',
        source: 'unsplash' as const,
        photographer: img.user.name,
        photographer_url: img.user.links.html,
      }))
    } catch (error) {
      logger.error('Erreur Unsplash:', error)
      throw error
    }
  }

  const searchPexels = async (): Promise<UnifiedImage[]> => {
    if (!PEXELS_API_KEY) {
      throw new Error('PEXELS_NOT_CONFIGURED')
    }

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        }
      )

      if (response.status === 401) {
        throw new Error('PEXELS_INVALID_KEY')
      }
      if (response.status === 429) {
        throw new Error('PEXELS_RATE_LIMIT')
      }
      if (!response.ok) {
        throw new Error('PEXELS_ERROR')
      }

      const data = await response.json()
      return (data.photos || []).map((img: PexelsImage) => ({
        id: `pexels-${img.id}`,
        url: img.src.large2x,
        thumbnail: img.src.medium,
        alt: img.alt || 'Pexels image',
        source: 'pexels' as const,
        photographer: img.photographer,
        photographer_url: img.photographer_url,
      }))
    } catch (error) {
      logger.error('Erreur Pexels:', error)
      throw error
    }
  }

  const getErrorMessage = (error: Error): string => {
    const errorMessages: Record<string, string> = {
      'UNSPLASH_NOT_CONFIGURED': '⚠️ Clé API Unsplash non configurée',
      'UNSPLASH_INVALID_KEY': '❌ Clé API Unsplash invalide ou expirée',
      'UNSPLASH_RATE_LIMIT': '⏱️ Limite Unsplash atteinte (50 req/h). Attendez 1h ou utilisez Pexels',
      'UNSPLASH_ERROR': '❌ Erreur Unsplash. Vérifiez votre connexion',
      'PEXELS_NOT_CONFIGURED': '⚠️ Clé API Pexels non configurée',
      'PEXELS_INVALID_KEY': '❌ Clé API Pexels invalide ou expirée',
      'PEXELS_RATE_LIMIT': '⏱️ Limite Pexels atteinte (200 req/h). Attendez 1h ou utilisez Unsplash',
      'PEXELS_ERROR': '❌ Erreur Pexels. Vérifiez votre connexion',
    }
    return errorMessages[error.message] || '❌ Erreur lors de la recherche'
  }

  const searchImages = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    try {
      let results: UnifiedImage[] = []
      const errors: Error[] = []

      if (source === 'unsplash') {
        try {
          results = await searchUnsplash()
        } catch (e) {
          errors.push(e as Error)
        }
      } else if (source === 'pexels') {
        try {
          results = await searchPexels()
        } catch (e) {
          errors.push(e as Error)
        }
      } else {
        // Les deux sources - continuer même si l'une échoue
        const [unsplashResults, pexelsResults] = await Promise.allSettled([
          searchUnsplash(),
          searchPexels(),
        ])

        let unsplashImgs: UnifiedImage[] = []
        let pexelsImgs: UnifiedImage[] = []

        if (unsplashResults.status === 'fulfilled') {
          unsplashImgs = unsplashResults.value
        } else {
          errors.push(unsplashResults.reason)
        }

        if (pexelsResults.status === 'fulfilled') {
          pexelsImgs = pexelsResults.value
        } else {
          errors.push(pexelsResults.reason)
        }

        // Mélanger les résultats (alterner)
        const maxLen = Math.max(unsplashImgs.length, pexelsImgs.length)
        for (let i = 0; i < maxLen; i++) {
          if (unsplashImgs[i]) results.push(unsplashImgs[i])
          if (pexelsImgs[i]) results.push(pexelsImgs[i])
        }
      }

      setImages(results)

      // Afficher erreur si aucun résultat et erreurs présentes
      if (results.length === 0 && errors.length > 0) {
        setError(errors.map(e => getErrorMessage(e)).join(' | '))
      }
    } catch (error) {
      logger.error('Erreur recherche images:', error)
      setError(getErrorMessage(error as Error))
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

        {/* Sélecteur de source */}
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setSource('both')}
            className={`px-3 py-1 text-sm rounded-md transition ${
              source === 'both'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Les deux
          </button>
          <button
            type="button"
            onClick={() => setSource('unsplash')}
            className={`px-3 py-1 text-sm rounded-md transition ${
              source === 'unsplash'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Unsplash
          </button>
          <button
            type="button"
            onClick={() => setSource('pexels')}
            className={`px-3 py-1 text-sm rounded-md transition ${
              source === 'pexels'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pexels
          </button>
        </div>

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
          {source === 'both' && 'Powered by Unsplash & Pexels - Images libres de droits'}
          {source === 'unsplash' && 'Powered by Unsplash - Images libres de droits'}
          {source === 'pexels' && 'Powered by Pexels - Images libres de droits'}
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            {error}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/api-guide"
              className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              📖 Voir le guide complet
            </Link>
            <span className="text-red-300 dark:text-red-600">|</span>
            <Link
              to="/ecms/site-config"
              className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              ⚙️ Configurer maintenant
            </Link>
          </div>
        </div>
      )}

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
            Sélectionnez une image ({images.length} résultats)
          </label>
          <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {images.map(img => (
              <button
                key={img.id}
                type="button"
                onClick={() => handleSelectImage(img.url)}
                className={`relative h-24 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition ${
                  selectedUrl === img.url ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                <img
                  src={img.thumbnail}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
                {/* Badge source */}
                <div className={`absolute top-1 left-1 px-2 py-0.5 text-[10px] font-semibold rounded ${
                  img.source === 'unsplash'
                    ? 'bg-black/70 text-white'
                    : 'bg-green-500/90 text-white'
                }`}>
                  {img.source === 'unsplash' ? 'U' : 'P'}
                </div>
                {selectedUrl === img.url && (
                  <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 U = Unsplash, P = Pexels
          </p>
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
