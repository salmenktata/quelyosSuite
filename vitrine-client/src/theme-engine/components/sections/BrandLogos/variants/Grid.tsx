'use client';

import Image from 'next/image';

import type { ThemeContextValue } from '../../../../engine/types';

interface GridProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

const DEFAULT_BRANDS = [
  { name: 'Brand 1', logo: '' },
  { name: 'Brand 2', logo: '' },
  { name: 'Brand 3', logo: '' },
  { name: 'Brand 4', logo: '' },
  { name: 'Brand 5', logo: '' },
  { name: 'Brand 6', logo: '' },
];

export default function Grid({ config, className = '', theme }: GridProps) {
  const title = (config?.title as string) || 'Nos Partenaires';
  const brands = (config?.brands as typeof DEFAULT_BRANDS) || DEFAULT_BRANDS;

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
            >
              {brand.logo ? (
                <Image src={brand.logo} alt={brand.name} width={200} height={80} className="max-h-12 w-auto" style={{width: "auto", height: "auto"}} unoptimized />
              ) : (
                <div className="text-gray-400 dark:text-gray-600 font-bold text-xl">{brand.name}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
