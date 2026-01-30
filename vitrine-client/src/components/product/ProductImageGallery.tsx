/**
 * ProductImageGallery - Galerie d&apos;images avancée pour produits
 * Features: swipe gestures, keyboard navigation, zoom modal, thumbnails
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Motion, AnimatePresence, type PanInfo } from '@/components/common/Motion';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { carouselItem } from '@/lib/animations/variants';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface Image {
  url: string;
  alt?: string;
  is_main?: boolean;
}

interface ProductImageGalleryProps {
  /** Images du produit */
  images: Image[];
  /** Nom du produit (pour alt text fallback) */
  productName: string;
  /** Callback quand l&apos;image change */
  onImageChange?: (index: number) => void;
  /** Image de preview temporaire (survol couleur) - surcharge l&apos;image principale */
  previewImageUrl?: string;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
  onImageChange,
  previewImageUrl,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [direction, setDirection] = useState(0);

  // Ensure images is always an array with at least a placeholder
  const safeImages: Image[] = images && images.length > 0
    ? images
    : [{ url: '/placeholder-product.svg', alt: productName, is_main: true }];

  // Gestion de la sélection d&apos;image
  const handleImageSelect = (index: number) => {
    setDirection(index > selectedIndex ? 1 : -1);
    setSelectedIndex(index);
    onImageChange?.(index);
  };

  // Navigation suivant/précédent
  const goToNext = () => {
    if (selectedIndex < safeImages.length - 1) {
      setDirection(1);
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      onImageChange?.(newIndex);
    }
  };

  const goToPrev = () => {
    if (selectedIndex > 0) {
      setDirection(-1);
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      onImageChange?.(newIndex);
    }
  };

  // Navigation clavier
  useKeyboardNav({
    onLeft: goToPrev,
    onRight: goToNext,
    onEscape: () => setIsModalOpen(false),
    enabled: true,
  });

  // Gestion du swipe
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      goToNext();
    } else if (swipe > swipeConfidenceThreshold) {
      goToPrev();
    }
  };

  // Si previewImageUrl est défini (survol couleur), l&apos;utiliser comme image principale
  const currentImage = previewImageUrl
    ? { url: previewImageUrl, alt: 'Aperçu couleur' }
    : (safeImages[selectedIndex] || safeImages[0]);

  return (
    <div className="space-y-4">
      {/* Image principale avec swipe */}
      <div
        className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in"
        onClick={() => setIsModalOpen(true)}
      >
        <AnimatePresence initial={false} custom={direction}>
          <Motion.img
            key={selectedIndex}
            src={getProxiedImageUrl(currentImage.url)}
            alt={currentImage.alt || productName}
            custom={direction}
            variants={carouselItem}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Boutons navigation (desktop) */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              disabled={selectedIndex === 0}
              className={`
                absolute left-3 top-1/2 -translate-y-1/2
                bg-white/90 hover:bg-white
                rounded-full p-2 shadow-lg
                transition-all duration-200
                ${selectedIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
                hidden md:block
              `}
              aria-label="Image précédente"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={selectedIndex === safeImages.length - 1}
              className={`
                absolute right-3 top-1/2 -translate-y-1/2
                bg-white/90 hover:bg-white
                rounded-full p-2 shadow-lg
                transition-all duration-200
                ${selectedIndex === safeImages.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
                hidden md:block
              `}
              aria-label="Image suivante"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Indicateurs de page (mobile) */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 md:hidden">
            {safeImages.map((_, index) => (
              <Motion.div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 w-2'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: index === selectedIndex ? 1 : 0.8 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails (desktop) */}
      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageSelect(index)}
              className={`
                relative aspect-square rounded-lg overflow-hidden
                border-2 transition-all duration-200
                ${
                  index === selectedIndex
                    ? 'border-primary ring-2 ring-primary/20 scale-105'
                    : 'border-gray-200 hover:border-primary/50'
                }
              `}
              aria-label={`Voir l&apos;image ${index + 1}`}
            >
              <Image
                src={getProxiedImageUrl(image.url)}
                alt={image.alt || `${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal Zoom */}
      <AnimatePresence>
        {isModalOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              aria-label="Fermer le zoom"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <Motion.img
              src={getProxiedImageUrl(currentImage.url)}
              alt={currentImage.alt || productName}
              className="max-w-full max-h-full object-contain"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation dans modal */}
            {safeImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  disabled={selectedIndex === 0}
                  className={`
                    absolute left-4 top-1/2 -translate-y-1/2
                    bg-white/20 hover:bg-white/30 backdrop-blur-sm
                    rounded-full p-3 text-white
                    transition-all duration-200
                    ${selectedIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
                  `}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  disabled={selectedIndex === safeImages.length - 1}
                  className={`
                    absolute right-4 top-1/2 -translate-y-1/2
                    bg-white/20 hover:bg-white/30 backdrop-blur-sm
                    rounded-full p-3 text-white
                    transition-all duration-200
                    ${selectedIndex === safeImages.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
                  `}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Compteur */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                  {selectedIndex + 1} / {safeImages.length}
                </div>
              </>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductImageGallery;
