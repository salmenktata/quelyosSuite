'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { backendClient } from '@/lib/backend/client';
import { Button } from '@/components/common';
import type { Product } from '@quelyos/types';
import { logger } from '@/lib/logger';

interface RecommendationsCarouselProps {
  productId: number;
  title?: string;
  limit?: number;
  type?: 'recommendations' | 'upsell';
}

/**
 * Product Recommendations Carousel
 * Displays recommended or upsell products in a scrollable carousel
 */
export const RecommendationsCarousel = memo(function RecommendationsCarousel({
  productId,
  title = 'Vous aimerez aussi',
  limit = 8,
  type = 'recommendations',
}: RecommendationsCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [productId, type]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      if (type === 'upsell') {
        const response = await backendClient.getUpsellProducts(productId, limit);
        if (response.success && response.products) {
          setProducts(response.products);
        }
      } else {
        const response = await backendClient.getRecommendations(productId, limit);
        if (response.success && response.data?.products) {
          setProducts(response.data.products);
        }
      }
    } catch (err) {
      logger.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">{title}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 aspect-square rounded-lg bg-gray-200"></div>
              <div className="mb-2 h-4 rounded bg-gray-200"></div>
              <div className="h-4 w-2/3 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; // Don't show anything if error or no products
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

        {/* Navigation buttons for mobile scroll */}
        <div className="flex gap-2 md:hidden">
          <button
            onClick={() => {
              const container = document.getElementById(
                `recommendations-${productId}`
              );
              if (container) {
                container.scrollBy({ left: -300, behavior: 'smooth' });
              }
            }}
            className="rounded-full border border-gray-300 p-2 hover:bg-gray-100"
            aria-label="Précédent"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              const container = document.getElementById(
                `recommendations-${productId}`
              );
              if (container) {
                container.scrollBy({ left: 300, behavior: 'smooth' });
              }
            }}
            className="rounded-full border border-gray-300 p-2 hover:bg-gray-100"
            aria-label="Suivant"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Products Grid/Carousel */}
      <div
        id={`recommendations-${productId}`}
        className="scrollbar-hide grid grid-cols-2 gap-4 overflow-x-auto md:grid-cols-4 lg:grid-cols-5"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
          >
            {/* Product Image */}
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={product.images?.[0]?.url || product.image_url || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 200px"
              />

              {/* Quick View Badge for Upsell */}
              {type === 'upsell' && (
                <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
                  Upgrade
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-1 flex-col">
              <h3 className="mb-2 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary">
                {product.name}
              </h3>

              {/* Rating (if available) */}
              {product.avg_rating !== undefined && product.review_count && product.review_count > 0 && (
                <div className="mb-2 flex items-center gap-1 text-xs">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.round(product.avg_rating!)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-500">({product.review_count})</span>
                </div>
              )}

              {/* Price */}
              <div className="mt-auto">
                <p className="text-lg font-bold text-primary">
                  {formatPrice(product.price ?? 0)}
                </p>
              </div>
            </div>

            {/* Add to Cart Button (Quick Action) */}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to cart functionality
                logger.debug('Add to cart:', product.id);
              }}
            >
              Ajouter
            </Button>
          </Link>
        ))}
      </div>

      {/* Custom scrollbar hiding */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
});
