interface OdooImageProps {
  src: string | null
  alt: string
  className?: string
  fallback?: React.ReactNode
}

/**
 * Composant pour afficher les images provenant d'Odoo
 * Gère automatiquement le préfixe de l'URL et le fallback
 */
export function OdooImage({ src, alt, className, fallback }: OdooImageProps) {
  // En développement, utiliser l'URL complète d'Odoo
  // En production, les images passeront par le même domaine
  const ODOO_URL = import.meta.env.VITE_ODOO_URL || 'http://localhost:8069'

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

  // Si l'URL commence déjà par http, l'utiliser telle quelle
  // Sinon, préfixer avec l'URL Odoo
  const imageUrl = src.startsWith('http') ? src : `${ODOO_URL}${src}`

  return <img src={imageUrl} alt={alt} className={className} />
}
