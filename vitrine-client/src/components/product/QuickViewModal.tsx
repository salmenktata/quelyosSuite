'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { backendClient } from '@/lib/backend/client';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/common';
import { logger } from '@/lib/logger';

interface ProductVariant {
  id: number;
  name: string;
  price: number;
  stock_available: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  discount_percentage: number;
  currency: string;
  stock_available: boolean;
  stock_quantity: number;
  images: string[];
  variants: ProductVariant[];
  attributes: Record<string, string[]>;
}

interface QuickViewModalProps {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Quick View Modal
 * Shows product details in a modal for quick browsing
 * Features:
 * - Image gallery with navigation
 * - Variant selection
 * - Add to cart
 * - Link to full product page
 */
export function QuickViewModal({ productId, isOpen, onClose }: QuickViewModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const { addToCart } = useCartStore();

  useEffect(() => {
    if (isOpen && productId) {
      loadProduct();
    }
  }, [isOpen, productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      const response = await backendClient.getProduct(productId);

      if (response.success && response.product) {
        setProduct(response.product as unknown as Product);

        // Set default variant if available
        if (response.product.variants && response.product.variants.length > 0) {
          setSelectedVariant(response.product.variants[0].id);
        }
      }
    } catch (_error) {
      logger.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);

      await addToCart(
        selectedVariant || product.id,
        quantity
      );

      // Close modal after successful add
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (_error) {
      logger.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Fermer"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : product ? (
          <div className="grid gap-6 p-6 lg:grid-cols-2">
            {/* Left: Images */}
            <div>
              {/* Main Image */}
              <div className="relative mb-4 overflow-hidden rounded-lg bg-gray-100">
                <div className="relative aspect-square">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[currentImageIndex]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        className="h-24 w-24 text-gray-400"
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
                  )}
                </div>

                {/* Image Navigation */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-lg transition-all hover:bg-white"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-lg transition-all hover:bg-white"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all h-16 w-16 ${
                        currentImageIndex === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="flex flex-col">
              {/* Product Name */}
              <h2 className="mb-2 text-2xl font-bold text-gray-900">{product.name}</h2>

              {/* Price */}
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.discount_percentage > 0 && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.price * (1 + product.discount_percentage / 100))}
                    </span>
                    <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                      -{product.discount_percentage}%
                    </span>
                  </>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="mb-6 text-gray-700">{product.short_description}</p>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock_available ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">En stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Rupture de stock</span>
                  </div>
                )}
              </div>

              {/* Variants */}
              {product.variants.length > 0 && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Variante
                  </label>
                  <select
                    value={selectedVariant || ''}
                    onChange={(e) => setSelectedVariant(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {product.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} - {formatPrice(variant.price)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Quantité
                </label>
                <div className="flex w-32 items-center rounded-lg border border-gray-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-primary"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full border-x border-gray-300 px-3 py-2 text-center focus:outline-none"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-primary"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto space-y-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.stock_available || addingToCart}
                  variant="primary"
                  className="w-full"
                >
                  {addingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}
                </Button>

                <Link href={`/products/${product.slug}`} onClick={onClose}>
                  <Button variant="outline" className="w-full">
                    Voir les détails complets
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-gray-600">Produit introuvable</p>
          </div>
        )}
      </div>
    </div>
  );
}
