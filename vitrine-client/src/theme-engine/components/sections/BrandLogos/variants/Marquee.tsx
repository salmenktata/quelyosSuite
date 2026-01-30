'use client';

import Image from 'next/image';

import type { ThemeContextValue } from '../../../../engine/types';

interface MarqueeProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

const DEFAULT_BRANDS = Array.from({ length: 8 }, (_, i) => ({ name: `Brand ${i + 1}`, logo: '' }));

export default function Marquee({ config, className = '', theme }: MarqueeProps) {
  const brands = (config?.brands as typeof DEFAULT_BRANDS) || DEFAULT_BRANDS;

  return (
    <section className={`py-8 bg-gray-50 dark:bg-gray-900 overflow-hidden ${className}`}>
      <div className="flex gap-12 animate-marquee">
        {[...brands, ...brands].map((brand, index) => (
          <div key={index} className="flex-shrink-0 flex items-center justify-center opacity-60">
            {brand.logo ? (
              <Image src={brand.logo} alt={brand.name} width={200} height={80} className="max-h-12 w-auto grayscale" style={{width: "auto", height: "auto"}} unoptimized />
            ) : (
              <div className="text-gray-400 dark:text-gray-600 font-bold text-xl px-8">{brand.name}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
