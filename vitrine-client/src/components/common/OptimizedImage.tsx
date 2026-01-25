/**
 * OptimizedImage - Wrapper optimisé pour les images de produits
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string; // Responsive images: "(max-width: 768px) 100vw, 50vw"
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  sizes, // Responsive images
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={"flex items-center justify-center bg-gray-100 " + className}>
        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  const imgClassName = "transition-opacity duration-300 " + (isLoading ? 'opacity-0' : 'opacity-100');

  return (
    <div className={"relative " + className}>
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes} // Responsive images
          className={imgClassName}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          priority={priority}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width || 400}
          height={height || 400}
          sizes={sizes} // Responsive images
          className={imgClassName}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          priority={priority}
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-shimmer" />
      )}
    </div>
  );
};

export default OptimizedImage;
