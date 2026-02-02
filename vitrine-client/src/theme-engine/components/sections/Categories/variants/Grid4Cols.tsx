'use client';

import Image from 'next/image';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ThemeContextValue } from '../../../../engine/types';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count: number;
}

interface Grid4ColsProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function Grid4Cols({ config, className = '', theme }: Grid4ColsProps) {
  const limit = (config?.limit as number) || 8;
  const title = (config?.title as string) || 'Nos Catégories';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await backendClient.getCategories({ limit });

        if (response.success && response.categories) {
          setCategories(response.categories as unknown as Category[]);
        }
      } catch (_error) {
        logger.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [limit]);

  if (loading) {
    return (
      <section className={`py-16 md:py-24 bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mx-auto mb-12"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 md:py-24 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
        <h2
          className="text-3xl md:text-5xl font-bold text-center mb-12 text-gray-900 dark:text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.slice(0, limit).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug || category.id}`}
              className="group relative aspect-square rounded-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
              {category.image_url ? (
                <Image src={category.image_url} alt={category.name} width={300} height={200} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" style={{width: "auto", height: "auto"}} unoptimized />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.secondary }}
                >
                  <span className="text-white text-4xl font-bold opacity-30">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-200">
                  {category.product_count} produit{category.product_count > 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
