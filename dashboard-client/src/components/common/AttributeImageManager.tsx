import { useState } from 'react'
import { Badge } from './Badge'
import { Skeleton } from './Skeleton'
import { OdooImage } from './OdooImage'
import { AttributeValueImageGallery } from './AttributeValueImageGallery'
import {
  useProductAttributeImages,
  type AttributeLineWithImages,
  type AttributeValueWithImages,
} from '../../hooks/useAttributeImages'

interface AttributeImageManagerProps {
  productId: number
  disabled?: boolean
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

/**
 * Composant pour gérer les images par valeur d'attribut.
 * Affiche les lignes d'attributs (ex: Couleur, Taille) avec pour chaque valeur
 * une miniature, un compteur d'images et un bouton pour gérer la galerie.
 */
export function AttributeImageManager({
  productId,
  disabled = false,
  onSuccess,
  onError,
}: AttributeImageManagerProps) {
  const { data: attributeLines, isLoading, error } = useProductAttributeImages(productId)

  // État pour le modal de galerie d'images
  const [selectedPtav, setSelectedPtav] = useState<{
    id: number
    name: string
    attributeName: string
  } | null>(null)

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
        <p className="text-red-600 dark:text-red-400 text-sm">
          Erreur lors du chargement des attributs: {error.message}
        </p>
      </div>
    )
  }

  if (!attributeLines || attributeLines.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Aucun attribut configuré sur ce produit.
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
          Ajoutez des attributs (couleur, taille...) pour pouvoir gérer les images par valeur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-gray-500"
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
        <h4 className="font-medium text-gray-900 dark:text-white">Images par Attribut</h4>
      </div>

      {attributeLines.map((line) => (
        <AttributeLineSection
          key={line.id}
          line={line}
          disabled={disabled}
          onSelectValue={(value) =>
            setSelectedPtav({
              id: value.ptav_id,
              name: value.name,
              attributeName: line.attribute_name,
            })
          }
        />
      ))}

      {/* Modal de galerie d'images */}
      {selectedPtav && (
        <AttributeValueImageGallery
          productId={productId}
          ptavId={selectedPtav.id}
          ptavName={`${selectedPtav.attributeName}: ${selectedPtav.name}`}
          isOpen={true}
          onClose={() => setSelectedPtav(null)}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </div>
  )
}

interface AttributeLineSectionProps {
  line: AttributeLineWithImages
  disabled: boolean
  onSelectValue: (value: AttributeValueWithImages) => void
}

function AttributeLineSection({ line, disabled, onSelectValue }: AttributeLineSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculer le total d'images pour cette ligne d'attribut
  const totalImages = line.values.reduce((sum, v) => sum + v.image_count, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header cliquable pour expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-gray-900 dark:text-white">{line.attribute_name}</span>
          <Badge variant="info" className="text-xs">
            {line.values.length} valeur{line.values.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <Badge variant={totalImages > 0 ? 'success' : 'neutral'} className="text-xs">
          {totalImages} image{totalImages > 1 ? 's' : ''}
        </Badge>
      </button>

      {/* Contenu expandable */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {line.values.map((value) => (
              <AttributeValueCard
                key={value.ptav_id}
                value={value}
                displayType={line.display_type}
                disabled={disabled}
                onClick={() => onSelectValue(value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface AttributeValueCardProps {
  value: AttributeValueWithImages
  displayType: string
  disabled: boolean
  onClick: () => void
}

function AttributeValueCard({ value, displayType, disabled, onClick }: AttributeValueCardProps) {
  const hasImages = value.image_count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group rounded-lg border-2 p-3 text-left transition-all
        ${
          hasImages
            ? 'border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500'
            : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Miniature ou placeholder */}
      <div className="aspect-square mb-2 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
        {value.first_image_url ? (
          <OdooImage
            src={value.first_image_url}
            alt={value.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* Afficher pastille couleur si c'est un attribut couleur */}
            {displayType === 'color' && value.html_color ? (
              <div
                className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-500"
                style={{ backgroundColor: value.html_color }}
              />
            ) : (
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Nom de la valeur et pastille couleur */}
      <div className="flex items-center gap-2">
        {displayType === 'color' && value.html_color && (
          <div
            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"
            style={{ backgroundColor: value.html_color }}
          />
        )}
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {value.name}
        </span>
      </div>

      {/* Compteur d'images */}
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {value.image_count} image{value.image_count !== 1 ? 's' : ''}
        </span>
        {/* Span stylé comme bouton (pas <Button> pour éviter button > button invalid DOM) */}
        <span
          className={`
            px-2 py-1 text-xs rounded font-medium
            text-indigo-600 dark:text-indigo-400
            opacity-0 group-hover:opacity-100 transition-opacity
            ${disabled ? '' : 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'}
          `}
        >
          {hasImages ? 'Gérer' : 'Ajouter'}
        </span>
      </div>

      {/* Badge compteur en haut à droite si images présentes */}
      {hasImages && (
        <Badge
          variant="info"
          className="absolute -top-2 -right-2 text-xs min-w-[20px] h-5 flex items-center justify-center"
        >
          {value.image_count}
        </Badge>
      )}
    </button>
  )
}
