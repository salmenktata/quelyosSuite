'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Card, Badge, Button } from '@/components/common';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const mainImage = product.images.find(img => img.id === 0) || product.images[0];
  const imageUrl = mainImage ? mainImage.url : '/placeholder-product.png';

  return (
    <Link href={`/products/${product.slug}`}>
      <Card hover className="h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_new && (
              <Badge variant="info">Nouveau</Badge>
            )}
            {product.is_featured && (
              <Badge variant="warning">Vedette</Badge>
            )}
            {!product.in_stock && (
              <Badge variant="danger">Épuisé</Badge>
            )}
          </div>

          {/* Wishlist button - à implémenter plus tard */}
          <button
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add to wishlist
            }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
            {product.name}
          </h3>

          {product.category && (
            <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
          )}

          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-[#01613a]">
                {product.list_price.toFixed(2)} {product.currency.symbol}
              </span>
            </div>

            <Button
              variant="primary"
              fullWidth
              disabled={!product.in_stock}
              isLoading={isAdding}
              onClick={handleAddToCart}
            >
              {product.in_stock ? 'Ajouter au panier' : 'Épuisé'}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;
