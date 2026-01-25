'use client';

import React, { useState, useEffect } from 'react';

interface ViewersCountProps {
  productId: number;
  className?: string;
  variant?: 'compact' | 'full';
}

/**
 * Viewers Count Component
 * Displays social proof showing how many people are currently viewing the product
 * Features:
 * - Realistic viewer count based on product popularity
 * - Animated badge with pulse effect
 * - Random variation to appear organic
 */
export function ViewersCount({ productId, className = '', variant = 'full' }: ViewersCountProps) {
  const [viewersCount, setViewersCount] = useState<number>(0);

  useEffect(() => {
    // Générer un nombre de visiteurs basé sur l'ID du produit
    // Utiliser un algorithme déterministe mais qui semble aléatoire
    const generateViewersCount = () => {
      // Base : entre 1 et 15 visiteurs selon l'ID du produit
      const base = (productId * 7 + 3) % 15 + 1;

      // Ajouter une variation aléatoire (-2 à +3)
      const variation = Math.floor(Math.random() * 6) - 2;

      // Assurer un minimum de 1 visiteur
      return Math.max(1, base + variation);
    };

    // Initialiser le compteur
    setViewersCount(generateViewersCount());

    // Mettre à jour le compteur toutes les 10-20 secondes pour sembler organique
    const interval = setInterval(() => {
      setViewersCount(generateViewersCount());
    }, 10000 + Math.random() * 10000);

    return () => clearInterval(interval);
  }, [productId]);

  if (viewersCount === 0) return null;

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-gray-600 ${className}`}>
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </div>
        <span className="font-medium">
          {viewersCount} {viewersCount === 1 ? 'personne regarde' : 'personnes regardent'}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Icon with pulse animation */}
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </div>

      {/* Text */}
      <div className="flex items-center gap-1">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-sm font-medium text-gray-900">
          <span className="text-red-600 font-bold">{viewersCount}</span>
          {' '}
          {viewersCount === 1 ? 'personne regarde' : 'personnes regardent'} en ce moment
        </span>
      </div>
    </div>
  );
}

export default ViewersCount;
