'use client';

import { useState, useEffect } from 'react';
import type { ThemeColors } from '../../../../engine/types';

interface FullscreenAutoplayProps {
  config?: Record<string, unknown>;
  className?: string;
  colors: ThemeColors;
}

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  cta?: { text: string; url: string };
}

export default function FullscreenAutoplay({ config, className = '', colors }: FullscreenAutoplayProps) {
  const height = (config?.height as string) || '90vh';
  const interval = (config?.interval as number) || 5000;
  const _animation = (config?.animation as string) || 'fade';

  // Données par défaut (seront remplacées par données backend)
  const slides: Slide[] = (config?.slides as Slide[]) || [
    {
      image: '/images/hero/slide-1.jpg',
      title: 'Nouvelle Collection Été 2026',
      subtitle: 'Découvrez nos pièces exclusives',
      cta: { text: 'Découvrir', url: '/shop' },
    },
    {
      image: '/images/hero/slide-2.jpg',
      title: 'Jusqu&#39;à -50% sur les Bestsellers',
      subtitle: 'Profitez de nos offres exceptionnelles',
      cta: { text: 'Voir les offres', url: '/promotions' },
    },
    {
      image: '/images/hero/slide-3.jpg',
      title: 'Livraison Gratuite',
      subtitle: 'Sur toutes vos commandes dès 100 TND',
      cta: { text: 'En savoir plus', url: '/shipping' },
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, slides.length]);

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

          {/* Contenu */}
          <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
            <div className="max-w-4xl">
              <h1
                className="text-5xl md:text-7xl font-bold text-white mb-4"
                style={{ fontFamily: `var(--theme-font-headings)` }}
              >
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                {slide.subtitle}
              </p>
              {slide.cta && (
                <a
                  href={slide.cta.url}
                  className="inline-block px-8 py-4 text-lg font-semibold rounded-lg transition-all hover:scale-105"
                  style={{
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                  }}
                >
                  {slide.cta.text}
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Indicateurs */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_slide, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Aller à la slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
