'use client';

import Image from 'next/image';

import type { ThemeContextValue } from '../../../../engine/types';
import { Star } from 'lucide-react';

interface GridProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

export default function Grid({ config, className = '', theme }: GridProps) {
  const title = (config?.title as string) || 'Ce Que Disent Nos Clients';
  const limit = (config?.limit as number) || 3;

  // Mock data (sera remplacé par données backend)
  const testimonials: Testimonial[] = Array.from({ length: limit }, (_, i) => ({
    id: i + 1,
    name: `Client ${i + 1}`,
    role: 'Client vérifié',
    content: 'Excellente expérience d\'achat ! Produits de qualité et livraison rapide. Je recommande vivement cette boutique.',
    rating: 5,
    avatar: `https://ui-avatars.com/api/?name=Client+${i + 1}&background=random`,
  }));

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill="currentColor"
                    style={{ color: theme.colors.secondary }}
                  />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                {testimonial.content}
              </p>
              <div className="flex items-center gap-3">
                <Image src={testimonial.avatar || '/placeholder-avatar.png'} alt={testimonial.name} width={64} height={64} className="w-12 h-12 rounded-full" style={{width: "auto", height: "auto"}} unoptimized />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
