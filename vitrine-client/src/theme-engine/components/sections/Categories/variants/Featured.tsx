'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ThemeContextValue } from '../../../../engine/types';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  product_count: number;
}

interface FeaturedProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function Featured({ config, className = '', theme }: FeaturedProps) {
  const limit = (config?.limit as number) || 3;
  const title = (config?.title as string) || 'Catégories Vedettes';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await backendClient.getCategories({ limit });
        if (response.success && response.categories) {
          setCategories(response.categories as unknown as Category[]);
        }
      } catch (error) {
        logger.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [limit]);

  if (loading) {
    return (
      <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
        <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mx-auto mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
        <h2
          className="text-3xl md:text-5xl font-bold text-center mb-12 text-gray-900 dark:text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.slice(0, limit).map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug || category.id}`}
              className={`group relative rounded-lg overflow-hidden hover:shadow-2xl transition-all ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              style={{ minHeight: index === 0 ? '500px' : '240px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.secondary }}
                >
                  <span className="text-white text-6xl font-bold opacity-20">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className={`absolute ${index === 0 ? 'bottom-8 left-8' : 'bottom-4 left-4'} z-20`}>
                <h3
                  className={`${
                    index === 0 ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
                  } font-bold text-white mb-2`}
                >
                  {category.name}
                </h3>
                <p className="text-white/90">
                  {category.product_count} produit{category.product_count > 1 ? 's' : ''}
                </p>
                <button
                  className="mt-4 px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff',
                  }}
                >
                  Explorer
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
