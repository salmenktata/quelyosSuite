import { useState, useRef, DragEvent } from 'react'
import { BackendImage } from './BackendImage'
import { Button } from './Button'
import { Modal } from './Modal'
import {
  useAttributeValueImages,
  useUploadAttributeValueImages,
  useDeleteAttributeValueImage,
  useReorderAttributeValueImages,
} from '../../hooks/useAttributeImages'
import { logger } from '@quelyos/logger'

interface AttributeValueImageGalleryProps {
  productId: number
  ptavId: number // Product Template Attribute Value ID
  ptavName: string // Nom pour affichage (ex: "Couleur: Rouge")
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

/**
 * Modal de galerie d'images pour une valeur d'attribut spécifique (PTAV)
 * Ex: Galerie d'images pour la couleur "Rouge" d'un T-shirt
 */
export function AttributeValueImageGallery({
  productId,
  ptavId,
  ptavName,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AttributeValueImageGalleryProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useAttributeValueImages(productId, ptavId)
  const images = data?.images || []

  const uploadMutation = useUploadAttributeValueImages(productId, ptavId)
  const deleteMutation = useDeleteAttributeValueImage(productId, ptavId)
  const reorderMutation = useReorderAttributeValueImages(productId, ptavId)

  const maxImages = 10

  // Convertir fichier en base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  // Handler upload fichiers
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (images.length + files.length > maxImages) {
      onError?.(`Maximum ${maxImages} images autorisées`)
      return
    }

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        onError?.(`${file.name} n'est pas une image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        onError?.(`${file.name} est trop volumineux (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      const imagesData = await Promise.all(
        validFiles.map(async (file) => {
          const base64 = await fileToBase64(file)
          return {
            name: file.name,
            image_1920: base64,
          }
        })
      )

      await uploadMutation.mutateAsync(imagesData)
      onSuccess?.(`${imagesData.length} image(s) uploadée(s)`)
    } catch (_error) {
      logger.error('Upload error:', error)
      onError?.("Erreur lors de l'upload des images")
    } finally {
      setUploading(false)
    }
  }

  // Drag & Drop zone
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // Suppression d'image
  const handleDelete = async (imageId: number) => {
    try {
      await deleteMutation.mutateAsync(imageId)
      onSuccess?.('Image supprimée')
    } catch (_error) {
      logger.error('Delete error:', error)
      onError?.('Erreur lors de la suppression')
    }
  }

  // Réorganisation drag & drop
  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = async (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    const imageIds = newImages.map((img) => img.id)
    try {
      await reorderMutation.mutateAsync(imageIds)
    } catch (_error) {
      logger.error('Reorder error:', error)
    }

    setDraggedIndex(index)
  }

  const handleImageDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Images: ${ptavName}`} size="lg" hideDefaultActions={true}>
      <div className="space-y-4">
        {/* Zone d'upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
          } cursor-pointer`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-gray-600 dark:text-gray-400">Upload en cours...</span>
            </div>
          ) : (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Cliquez pour uploader
                  </span>{' '}
                  ou glissez-déposez
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG, GIF jusqu'à 5MB ({images.length}/{maxImages} images)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Galerie d'images */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Images ({images.length}) - Glissez pour réorganiser
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map(
                (
                  image: { id: number; name: string; url: string; sequence: number },
                  index: number
                ) => (
                  <div
                    key={image.id}
                    className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-move"
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, index)}
                    onDragOver={(e) => handleImageDragOver(e, index)}
                    onDragEnd={handleImageDragEnd}
                  >
                    <div className="aspect-square">
                      <BackendImage
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <svg
                              className="w-12 h-12 text-gray-400"
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
                        }
                      />
                    </div>

                    {/* Overlay avec actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                        loading={deleteMutation.isPending}
                        className="shadow-lg"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>

                    {/* Indicateur de séquence */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      #{image.sequence}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
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
            <p>Aucune image pour cette valeur</p>
            <p className="text-sm mt-1">
              Les images uploadées ici seront partagées par toutes les variantes ayant cette valeur
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
