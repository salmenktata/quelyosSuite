'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Card, Badge, Button } from '@/components/common';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
  onQuickView?: (productId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
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

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product.id);
  };

  const mainImage = product.images.find(img => img.id === 0) || product.images[0];
  const imageUrl = mainImage ? mainImage.url : '/placeholder-product.png';

  // Calculate discount percentage
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.list_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.list_price) / product.compare_at_price!) * 100)
    : 0;

  // Extract unique colors from variants
  const colorVariants = React.useMemo(() => {
    if (!product.variants) return [];
    const colors: string[] = [];
    product.variants.forEach(variant => {
      const colorAttr = variant.attributes.find(
        attr => attr.name.toLowerCase() === 'couleur' || attr.name.toLowerCase() === 'color'
      );
      if (colorAttr && !colors.includes(colorAttr.value)) {
        colors.push(colorAttr.value);
      }
    });
    return colors;
  }, [product.variants]);

  // Map color names to hex codes
  const colorToHex: Record<string, string> = {
    'noir': '#000000',
    'black': '#000000',
    'blanc': '#FFFFFF',
    'white': '#FFFFFF',
    'rouge': '#EF4444',
    'red': '#EF4444',
    'bleu': '#3B82F6',
    'blue': '#3B82F6',
    'vert': '#22C55E',
    'green': '#22C55E',
    'jaune': '#EAB308',
    'yellow': '#EAB308',
    'orange': '#F97316',
    'rose': '#EC4899',
    'pink': '#EC4899',
    'violet': '#8B5CF6',
    'purple': '#8B5CF6',
    'gris': '#6B7280',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'marron': '#92400E',
    'brown': '#92400E',
    'beige': '#D4B896',
  };

  const getColorHex = (colorName: string): string => {
    const lowerColor = colorName.toLowerCase();
    return colorToHex[lowerColor] || '#E5E7EB';
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card hover className="group h-full flex flex-col overflow-hidden card-hover">
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {/* Product Image with zoom effect */}
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Left Badges - Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {product.is_new && (
              <span className="badge-new">Nouveau</span>
            )}
            {product.is_featured && (
              <Badge variant="warning" size="sm">Vedette</Badge>
            )}
            {product.is_bestseller && (
              <span className="badge-hot">Best-seller</span>
            )}
            {!product.in_stock && (
              <Badge variant="danger" size="sm">Epuise</Badge>
            )}
          </div>

          {/* Right Badge - Discount percentage */}
          {hasDiscount && (
            <div className="absolute top-2 right-2 z-10">
              <span className="badge-discount">-{discountPercent}%</span>
            </div>
          )}

          {/* Quick View Overlay */}
          {onQuickView && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
              <button
                onClick={handleQuickView}
                className="bg-white text-gray-900 px-5 py-2.5 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-100 shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Apercu rapide
                </span>
              </button>
            </div>
          )}

          {/* Wishlist button */}
          <button
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 hover:scale-110 transition-all duration-300 z-10 opacity-0 group-hover:opacity-100"
            style={{ right: hasDiscount ? '4.5rem' : '0.5rem' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add to wishlist
            }}
          >
            <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.category.name}</p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Color Swatches */}
          {colorVariants.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              {colorVariants.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: getColorHex(color) }}
                  title={color}
                />
              ))}
              {colorVariants.length > 4 && (
                <span className="text-xs text-gray-500 ml-1">+{colorVariants.length - 4}</span>
              )}
            </div>
          )}

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-xl font-bold text-primary">
                {product.list_price.toFixed(2)} {product.currency.symbol}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {product.compare_at_price!.toFixed(2)} {product.currency.symbol}
                </span>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              variant="primary"
              fullWidth
              disabled={!product.in_stock}
              isLoading={isAdding}
              onClick={handleAddToCart}
              className="group-hover:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {product.in_stock ? 'Ajouter au panier' : 'Epuise'}
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;
