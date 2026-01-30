'use client';

import Image from 'next/image';

import Link from 'next/link';
import type { ThemeContextValue } from '../../../../engine/types';

interface SplitProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function Split({ config, className = '', theme }: SplitProps) {
  const title = (config?.title as string) || 'Nouvelle Collection';
  const subtitle = (config?.subtitle as string) || 'Découvrez nos dernières tendances';
  const ctaText = (config?.ctaText as string) || 'Voir la collection';
  const ctaUrl = (config?.ctaUrl as string) || '/products';
  const imageUrl = (config?.imageUrl as string) || '';

  return (
    <section className={`py-0 ${className}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center">
          <div className="py-16 md:py-24 px-8">
            <h2
              className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white"
              style={{ fontFamily: `var(--theme-font-headings)` }}
            >
              {title}
            </h2>
            <p className="text-lg md:text-xl mb-8 text-gray-700 dark:text-gray-300">{subtitle}</p>
            <Link
              href={ctaUrl}
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {ctaText}
            </Link>
          </div>
          <div className="h-full min-h-[400px] bg-gray-200 dark:bg-gray-700">
            {imageUrl ? (
              <Image src={imageUrl} alt={title} width={400} height={300} className="w-full h-full object-cover" style={{width: "auto", height: "auto"}} unoptimized />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                <span className="text-white text-8xl font-bold opacity-20">{title.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
