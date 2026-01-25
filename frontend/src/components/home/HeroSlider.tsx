'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useHeroSlides } from '@/hooks/useHeroSlides';

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  cta_text: string;
  cta_link: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
}

const SLIDE_DURATION = 5000; // 5 seconds per slide

// Fallback slides si aucune donnée backend
const fallbackSlides: Slide[] = [
  {
    id: 1,
    title: 'Bienvenue sur Le Sportif',
    subtitle: 'Votre boutique sport en ligne',
    description: 'Decouvrez notre collection de produits de sport et d\'equipements de qualite. Des prix competitifs et une livraison rapide partout en Tunisie.',
    image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop',
    cta_text: 'Voir nos produits',
    cta_link: '/products',
    cta_secondary_text: 'Promotions',
    cta_secondary_link: '/products?is_featured=true',
  },
];

export function HeroSlider() {
  const { slides: apiSlides, loading } = useHeroSlides();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Utiliser slides API ou fallback
  const slides = apiSlides.length > 0 ? apiSlides : fallbackSlides;

  // ⚠️ TOUS LES HOOKS DOIVENT ÊTRE AVANT LES EARLY RETURNS

  // Progress animation
  useEffect(() => {
    if (!isAutoPlaying) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const animationFrame = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(animationFrame);
      }
    };

    const frameId = requestAnimationFrame(animationFrame);
    return () => cancelAnimationFrame(frameId);
  }, [currentSlide, isAutoPlaying]);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 300);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setIsTransitioning(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setIsTransitioning(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  // ⚠️ EARLY RETURNS APRÈS TOUS LES HOOKS

  // Masquer la section si aucun slide (pas de fallback)
  if (!loading && apiSlides.length === 0 && fallbackSlides.length === 0) {
    return null;
  }

  // Skeleton loader pendant chargement
  if (loading) {
    return (
      <div className="h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px] bg-gray-200 animate-pulse" />
    );
  }

  return (
    <div
      className="relative h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px] overflow-hidden bg-gray-900"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide
              ? 'opacity-100 z-10 scale-100'
              : 'opacity-0 z-0 scale-105'
          } ${isTransitioning ? 'blur-sm' : ''}`}
        >
          {/* Background Image with Ken Burns effect */}
          <div
            className={`absolute inset-0 transition-transform duration-[8000ms] ease-out ${
              index === currentSlide ? 'scale-110' : 'scale-100'
            }`}
          >
            {slide.image_url && (
              <Image
                src={slide.image_url}
                alt={slide.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            )}
            {/* Multi-layer gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative container mx-auto px-4 max-w-7xl h-full flex items-center">
            <div
              className={`max-w-2xl text-white z-20 transition-all duration-700 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
            >
              {/* Subtitle Badge */}
              {slide.subtitle && (
                <div className="inline-flex items-center gap-2 bg-primary/90 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {slide.subtitle}
                </div>
              )}

              {/* Title with gradient effect */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                  {slide.title}
                </span>
              </h1>

              {/* Description */}
              {slide.description && (
                <p className="text-base sm:text-lg md:text-xl mb-8 text-gray-200 max-w-xl leading-relaxed">
                  {slide.description}
                </p>
              )}

              {/* CTAs with lesportif.com.tn styling */}
              <div className="flex flex-wrap gap-4">
                <Link href={slide.cta_link}>
                  <button className="group bg-primary text-white px-8 py-3.5 rounded-[20px] font-semibold hover:bg-primary-dark transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2">
                    {slide.cta_text}
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </Link>
                {slide.cta_secondary_text && slide.cta_secondary_link && (
                  <Link href={slide.cta_secondary_link}>
                    <button className="group border-2 border-white text-white px-8 py-3.5 rounded-[20px] font-semibold hover:bg-white hover:text-primary transition-all duration-300 backdrop-blur-sm flex items-center gap-2">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                      {slide.cta_secondary_text}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - Hidden on mobile */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 group hidden sm:block"
        aria-label="Slide precedent"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 group hidden sm:block"
        aria-label="Slide suivant"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Bottom Controls Container */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Dots Navigation */}
        <div className="flex justify-center gap-3 pb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8 shadow-lg'
                  : 'bg-white/40 w-2 hover:bg-white/60'
              }`}
              aria-label={`Aller au slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 bg-black/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
        {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>
    </div>
  );
}
