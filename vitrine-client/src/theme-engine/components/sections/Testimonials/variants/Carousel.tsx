'use client';

import Image from 'next/image';

import { useState } from 'react';
import type { ThemeContextValue } from '../../../../engine/types';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
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

export default function Carousel({ config, className = '', theme }: CarouselProps) {
  const title = (config?.title as string) || 'Témoignages Clients';

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Amina Ben Salem',
      role: 'Acheteuse régulière',
      content: 'Service impeccable ! Les produits sont conformes aux descriptions et la livraison est toujours à temps.',
      rating: 5,
      avatar: 'https://ui-avatars.com/api/?name=Amina+Ben+Salem&background=random',
    },
    {
      id: 2,
      name: 'Mohamed Trabelsi',
      role: 'Client depuis 2 ans',
      content: 'Je commande régulièrement et je n\'ai jamais été déçu. Excellent rapport qualité-prix.',
      rating: 5,
      avatar: 'https://ui-avatars.com/api/?name=Mohamed+Trabelsi&background=random',
    },
    {
      id: 3,
      name: 'Sarah Bouazizi',
      role: 'Cliente satisfaite',
      content: 'Interface intuitive et service client réactif. Je recommande à 100% !',
      rating: 5,
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Bouazizi&background=random',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

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

        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800 p-12 rounded-2xl relative">
            <div className="flex gap-1 justify-center mb-6">
              {Array.from({ length: current.rating }).map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  fill="currentColor"
                  style={{ color: theme.colors.secondary }}
                />
              ))}
            </div>
            <p className="text-xl text-gray-700 dark:text-gray-300 text-center mb-8 italic">
              {current.content}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Image src={current.avatar || '/placeholder-avatar.png'} alt={current.name} width={64} height={64} className="w-16 h-16 rounded-full" style={{width: "auto", height: "auto"}} unoptimized />
              <div className="text-left">
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  {current.name}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {current.role}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                style={{ color: theme.colors.primary }}
                aria-label="Témoignage précédent"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={next}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                style={{ color: theme.colors.primary }}
                aria-label="Témoignage suivant"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Indicateurs */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_testimonial, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'w-8' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={
                    index === currentIndex
                      ? { backgroundColor: theme.colors.primary }
                      : undefined
                  }
                  aria-label={`Aller au témoignage ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
