import { getProxiedImageUrl } from '@quelyos/config'

interface BackendImageProps {
  src: string | null
  alt: string
  className?: string
  fallback?: React.ReactNode
}

/**
 * Composant pour afficher les images provenant du backend
 * Gère automatiquement le préfixe de l'URL et le fallback
 */
export function BackendImage({ src, alt, className, fallback }: BackendImageProps) {
  if (!src) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className={className}>
        <svg
          className="w-full h-full text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  // Utiliser getProxiedImageUrl pour masquer backend (anonymisation)
  const imageUrl = getProxiedImageUrl(src)

  return <img src={imageUrl} alt={alt} className={className} />
}
