import { useState, useRef, DragEvent } from 'react'
import { OdooImage } from './OdooImage'
import { Button } from './Button'
import { logger } from '@quelyos/logger'

export interface ProductImage {
  id: number
  name: string
  url: string
  sequence: number
}

export interface ImageGalleryProps {
  images: ProductImage[]
  onUpload: (images: { name: string; image_1920: string }[]) => Promise<void>
  onDelete: (imageId: number) => Promise<void>
  onReorder: (imageIds: number[]) => Promise<void>
  maxImages?: number
  disabled?: boolean
}

/**
 * Composant de galerie d'images avec upload drag & drop et gestion
 */
export function ImageGallery({
  images,
  onUpload,
  onDelete,
  onReorder,
  maxImages = 10,
  disabled = false,
}: ImageGalleryProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convertir fichier en base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        // Extraire seulement la partie base64 (sans le préfixe data:image/...)
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  // Handler upload fichiers
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return

    // Vérifier limite d'images
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images autorisées`)
      return
    }

    // Valider types
    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} n'est pas une image`)
        return false
      }
      // Limiter taille 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} est trop volumineux (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      // Convertir en base64
      const imagesData = await Promise.all(
        validFiles.map(async (file) => {
          const base64 = await fileToBase64(file)
          return {
            name: file.name,
            image_1920: base64,
          }
        })
      )

      await onUpload(imagesData)
    } catch (error) {
      logger.error('Upload error:', error)
      alert('Erreur lors de l\'upload des images')
    } finally {
      setUploading(false)
    }
  }

  // Drag & Drop zone
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!disabled) {
      const files = e.dataTransfer.files
      handleFiles(files)
    }
  }

  // Réorganisation drag & drop
  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Réorganiser visuellement (optimistic UI)
    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    // Appeler onReorder avec les nouveaux IDs
    const imageIds = newImages.map((img) => img.id)
    onReorder(imageIds).catch((error) => {
      logger.error('Reorder error:', error)
    })

    setDraggedIndex(index)
  }

  const handleImageDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
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
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-move"
                draggable={!disabled}
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragEnd={handleImageDragEnd}
              >
                {/* Image */}
                <div className="aspect-square">
                  <OdooImage
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
                    onClick={() => !disabled && onDelete(image.id)}
                    disabled={disabled}
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
