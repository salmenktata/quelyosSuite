/**
 * ProductCard - Carte produit réutilisable
 *
 * Composant présentationnel pour afficher un produit
 * dans une grille ou liste. Sans logique métier, toutes
 * les actions sont gérées via callbacks.
 *
 * @module @quelyos/storefront-components
 */

import React from 'react'
import { StarRating } from './StarRating'
import { PriceDisplay } from './PriceDisplay'

export interface ProductCardProps {
  /** ID du produit */
  id: number
  /** Nom du produit */
  name: string
  /** Prix actuel */
  price: number
  /** Prix barré (compare_at_price) */
  comparePrice?: number
  /** URL de l'image principale */
  imageUrl: string
  /** Alt text de l'image */
  imageAlt?: string
  /** URL de la page produit */
  href?: string
  /** Note moyenne (0-5) */
  rating?: number
  /** Nombre d'avis */
  reviewCount?: number
  /** Stock disponible */
  stock?: number
  /** Badges (nouveau, bestseller, etc.) */
  badges?: Array<{
    label: string
    variant: 'success' | 'info' | 'warning' | 'error'
  }>
  /** Variantes couleurs disponibles */
  colors?: string[]
  /** Callback clic sur carte */
  onClick?: (productId: number) => void
  /** Callback ajout panier */
  onAddToCart?: (productId: number) => void
  /** Callback quick view */
  onQuickView?: (productId: number) => void
  /** Loading state ajout panier */
  isAddingToCart?: boolean
  /** Affichage compact */
  compact?: boolean
  /** Classe CSS additionnelle */
  className?: string
}

export function ProductCard({
  id,
  name,
  price,
  comparePrice,
  imageUrl,
  imageAlt,
  href,
  rating,
  reviewCount,
  stock,
  badges = [],
  colors = [],
  onClick,
  onAddToCart,
  onQuickView,
  isAddingToCart = false,
  compact = false,
  className = '',
}: ProductCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick(id)
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(id)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(id)
  }

  // Calculate discount percentage
  const hasDiscount = comparePrice && comparePrice > price
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0

  // Out of stock
  const isOutOfStock = stock !== undefined && stock <= 0

  const CardWrapper = href ? 'a' : 'div'

  return (
    <CardWrapper
      href={href}
      onClick={handleCardClick}
      className={`group relative flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-all hover:shadow-lg ${
        onClick || href ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-900 ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <img
          src={imageUrl}
          alt={imageAlt || name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  badge.variant === 'success'
                    ? 'bg-green-500 text-white'
                    : badge.variant === 'info'
                      ? 'bg-blue-500 text-white'
                      : badge.variant === 'warning'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                }`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded font-semibold">
              Rupture de stock
            </span>
          </div>
        )}

        {/* Quick View Button */}
        {onQuickView && !isOutOfStock && (
          <button
            onClick={handleQuickView}
            className="absolute inset-x-0 bottom-0 bg-black/75 text-white py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Aperçu rapide
          </button>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col flex-1 ${compact ? 'p-3' : 'p-4'}`}>
        {/* Product Name */}
        <h3 className={`font-medium text-gray-900 dark:text-white line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
          {name}
        </h3>

        {/* Rating & Reviews */}
        {rating !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={rating} size={compact ? 'sm' : 'md'} />
            {reviewCount !== undefined && reviewCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex gap-1 mt-2">
            {colors.slice(0, 5).map((color, idx) => (
              <div
                key={idx}
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-3">
          <PriceDisplay
            price={price}
            comparePrice={comparePrice}
            size={compact ? 'sm' : 'md'}
          />
        </div>

        {/* Add to Cart Button */}
        {onAddToCart && !isOutOfStock && (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded transition-colors ${
              compact ? 'py-1.5 text-sm mt-2' : 'py-2 text-base mt-3'
            }`}
          >
            {isAddingToCart ? 'Ajout...' : 'Ajouter au panier'}
          </button>
        )}

        {/* Stock Info */}
        {stock !== undefined && stock > 0 && stock <= 5 && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
            Plus que {stock} en stock !
          </p>
        )}
      </div>
    </CardWrapper>
  )
}
