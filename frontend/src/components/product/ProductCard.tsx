/**
 * Card produit - Style lesportif.com.tn
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils/formatting';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/common/Button';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartStore();
  const [isAdding, setIsAdding] = React.useState(false);

  // Calculer le pourcentage de réduction (simulation)
  const hasDiscount = product.is_featured; // Simulation: featured = en promo
  const discountPercent = hasDiscount ? 20 : 0;
  const originalPrice = hasDiscount ? product.list_price * 1.25 : product.list_price;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Erreur ajout panier:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const mainImage = product.images && product.images.length > 0
    ? product.images[0].url
    : '/placeholder-product.png';

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative">
        {/* Badge promo */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
            -{discountPercent}%
          </div>
        )}

        {/* Badge "Nouveau" */}
        {product.is_new && (
          <div className="absolute top-2 right-2 bg-secondary text-gray-800 text-xs font-semibold px-2 py-1 rounded-md z-10">
            NOUVEAU
          </div>
        )}

        {/* Image produit */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Overlay "Aperçu rapide" au survol */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              isLoading={isAdding}
              className="rounded-full"
            >
              {isAdding ? 'Ajout...' : 'Ajouter au panier'}
            </Button>
          </div>

          {/* Indicateur stock */}
          {!product.in_stock && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-100 text-red-800 text-xs font-medium py-1 px-2 rounded text-center">
              Rupture de stock
            </div>
          )}
        </div>

        {/* Informations produit */}
        <div className="p-4">
          {/* Catégorie */}
          {product.category && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.category.name}
            </p>
          )}

          {/* Titre produit */}
          <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 h-10">
            {product.name}
          </h3>

          {/* Prix */}
          <div className="flex items-baseline gap-2 mb-3">
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(originalPrice, product.currency.symbol)}
              </span>
            )}
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.list_price, product.currency.symbol)}
            </span>
          </div>

          {/* Bouton sélectionner options (pour variants) */}
          {product.variants && product.variants.length > 1 ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full text-sm"
            >
              Sélectionner options
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              isLoading={isAdding}
              disabled={!product.in_stock}
              className="w-full rounded-full text-sm"
            >
              {!product.in_stock ? 'Rupture' : isAdding ? 'Ajout...' : 'Ajouter au panier'}
            </Button>
          )}
        </div>

        {/* Badge bestseller */}
        {product.is_bestseller && (
          <div className="absolute top-1/2 -right-2 bg-gold text-white text-xs font-bold px-3 py-1 rounded-l-full transform -translate-y-1/2">
            ⭐ TOP
          </div>
        )}
      </div>
    </Link>
  );
}
