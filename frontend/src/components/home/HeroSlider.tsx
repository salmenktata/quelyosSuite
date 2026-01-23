'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: {
    text: string;
    link: string;
  };
  ctaSecondary?: {
    text: string;
    link: string;
  };
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Bienvenue sur Le Sportif',
    subtitle: 'Votre boutique sport en ligne',
    description: 'Découvrez notre collection de produits de sport et d\'équipements de qualité. Des prix compétitifs et une livraison rapide partout en Tunisie.',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop',
    cta: {
      text: 'Voir nos produits',
      link: '/products',
    },
    ctaSecondary: {
      text: 'Promotions 🔥',
      link: '/products?is_featured=true',
    },
  },
  {
    id: 2,
    title: 'Nouveautés 2026',
    subtitle: 'Collection Printemps-Été',
    description: 'Découvrez les dernières tendances et innovations pour votre pratique sportive. Qualité premium et designs exclusifs.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&h=600&fit=crop',
    cta: {
      text: 'Découvrir',
      link: '/products?is_new=true',
    },
  },
  {
    id: 3,
    title: 'Promotions Exclusives',
    subtitle: 'Jusqu\'à -60% sur une sélection',
    description: 'Ne manquez pas nos offres limitées sur vos produits préférés. Stock limité, profitez-en maintenant !',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&h=600&fit=crop',
    cta: {
      text: 'Voir les promos',
      link: '/products?is_featured=true',
    },
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Image de fond */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
          </div>

          {/* Contenu */}
          <div className="relative container mx-auto px-4 max-w-7xl h-full flex items-center">
            <div className="max-w-2xl text-white z-20">
              {/* Subtitle */}
              <div className="inline-block bg-[#01613a] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                {slide.subtitle}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                {slide.title}
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-xl">
                {slide.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Link href={slide.cta.link}>
                  <button className="bg-[#01613a] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#024d2e] transition-colors shadow-lg">
                    {slide.cta.text}
                  </button>
                </Link>
                {slide.ctaSecondary && (
                  <Link href={slide.ctaSecondary.link}>
                    <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-[#01613a] transition-colors">
                      {slide.ctaSecondary.text}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        aria-label="Slide précédent"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        aria-label="Slide suivant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-[#01613a] transition-all duration-[5000ms] ease-linear"
            style={{ width: '100%' }}
            key={currentSlide}
          />
        </div>
      )}
    </div>
  );
}
