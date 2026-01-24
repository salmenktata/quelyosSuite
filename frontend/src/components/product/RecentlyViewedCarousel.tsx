/**
 * RecentlyViewedCarousel - Carousel horizontal des produits récemment consultés
 * Affiche les produits récemment vus avec scroll horizontal
 */

'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { formatPrice } from '@/lib/utils/formatting';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

export const RecentlyViewedCarousel: React.FC = () => {
  const { products } = useRecentlyViewedStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ne rien afficher s'il n'y a pas de produits
  if (products.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mt-12 pt-8 border-t border-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Récemment consultés
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Défiler vers la gauche"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Défiler vers la droite"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            variants={staggerItem}
            custom={index}
            className="flex-shrink-0 w-48"
          >
            <Link
              href={`/products/${product.slug}`}
              className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Style pour cacher la scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.section>
  );
};

export default RecentlyViewedCarousel;
