'use client';

import Image from 'next/image';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

interface CarouselProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function Carousel({ config, className = '', theme }: CarouselProps) {
  const limit = (config?.limit as number) || 12;
  const title = (config?.title as string) || 'Nos Catégories';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

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

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('categories-carousel');
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft + scrollAmount);
    }
  };

  if (loading) {
    return (
      <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
        <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mx-auto mb-12"></div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-transform"
            style={{ color: theme.colors.primary }}
            aria-label="Précédent"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            id="categories-carousel"
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-8"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug || category.id}`}
                className="flex-shrink-0 w-48 group"
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                  {category.image_url ? (
                    <Image src={category.image_url} alt={category.name} width={300} height={200} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" style={{width: "auto", height: "auto"}} unoptimized />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.muted }}
                    >
                      <span className="text-white text-3xl font-bold opacity-30">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-center text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  {category.product_count} produits
                </p>
              </Link>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-transform"
            style={{ color: theme.colors.primary }}
            aria-label="Suivant"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
