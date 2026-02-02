'use client';

import Image from 'next/image';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ThemeContextValue } from '../../../../engine/types';
import type { Product } from '@quelyos/types';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface Grid4ColsProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function Grid4Cols({ config, className = '', theme }: Grid4ColsProps) {
  const limit = (config?.limit as number) || 8;
  const sortBy = (config?.sortBy as string) || 'bestsellers';
  const title = (config?.title as string) || 'Nos Produits Phares';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await backendClient.getProducts({
          limit,
          is_featured: sortBy === 'bestsellers',
        });

        if (response.success && response.products) {
          setProducts(response.products);
        }
      } catch (error) {
        logger.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [limit, sortBy]);

  if (loading) {
    return (
      <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
        <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mx-auto mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div
        className="container mx-auto px-4"
        style={{ maxWidth: theme.spacing.containerWidth }}
      >
        <h2
          className="text-3xl md:text-5xl font-bold text-center mb-12 text-gray-900 dark:text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, limit).map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug || product.id}`}
              className="group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} width={400} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" style={{width: "auto", height: "auto"}} unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Pas d&apos;image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
                  {product.name}
                </h3>
                <p
                  className="text-xl font-bold"
                  style={{ color: theme.colors.primary }}
                >
                  {(product.price || 0).toFixed(2)} TND
                </p>
                <button
                  className="mt-4 w-full py-2 px-4 rounded-lg font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Ajouter au panier
                    logger.debug('Ajouter au panier:', product.id);
                  }}
                >
                  Ajouter au panier
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
