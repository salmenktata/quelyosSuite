'use client';

import { useState } from 'react';
import type { ThemeContextValue } from '../../../../engine/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  sku: string;
}

export default function Carousel({ config, className = '', theme }: CarouselProps) {
  const limit = (config?.limit as number) || 8;
  const title = (config?.title as string) || 'Nos Produits Phares';

  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock data (sera remplacé par appel API backend)
  const products: Product[] = Array.from({ length: limit }, (_, i) => ({
    id: i + 1,
    name: `Produit ${i + 1}`,
    price: 99.99 + i * 10,
    image: `/images/products/product-${(i % 4) + 1}.jpg`,
    sku: `PROD-${i + 1}`,
  }));

  const visibleProducts = 4;
  const maxIndex = Math.max(0, products.length - visibleProducts);

  const next = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section className={`py-16 md:py-24 bg-gray-50 dark:bg-gray-800 ${className}`}>
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

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out gap-6"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleProducts)}%)` }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0"
                  style={{ width: `calc((100% - 4.5rem) / ${visibleProducts})` }}
                >
                  <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition-all">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400?text=Product';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <p
                        className="text-xl font-bold"
                        style={{ color: theme.colors.primary }}
                      >
                        {product.price.toFixed(2)} TND
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons navigation */}
          {currentIndex > 0 && (
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
              style={{ color: theme.colors.primary }}
              aria-label="Produit précédent"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {currentIndex < maxIndex && (
            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
              style={{ color: theme.colors.primary }}
              aria-label="Produit suivant"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
