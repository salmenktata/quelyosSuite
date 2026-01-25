/**
 * Composants Skeleton pour états de chargement
 * Améliore la perception de performance et évite les layout shifts
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Composant Skeleton de base
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  animation = 'shimmer',
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={`
        bg-gray-200
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      aria-busy="true"
      aria-live="polite"
    />
  );
};

/**
 * Skeleton pour carte produit (vue grille)
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image skeleton */}
      <div className="relative aspect-square">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* Contenu skeleton */}
      <div className="p-4 space-y-3">
        {/* Catégorie */}
        <Skeleton className="w-1/3 h-3" />

        {/* Titre */}
        <Skeleton className="w-full h-5" />
        <Skeleton className="w-2/3 h-5" />

        {/* Prix */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-16 h-4" />
        </div>

        {/* Bouton */}
        <Skeleton className="w-full h-10 rounded-lg mt-3" />
      </div>
    </div>
  );
};

/**
 * Skeleton pour carte produit (vue liste)
 */
export const ProductCardListSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
      {/* Image skeleton */}
      <Skeleton className="w-48 h-48 flex-shrink-0 rounded-none" />

      {/* Contenu skeleton */}
      <div className="flex-1 p-6 space-y-3">
        {/* Catégorie + Badge */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>

        {/* Titre */}
        <Skeleton className="w-3/4 h-6" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-5/6 h-4" />
        </div>

        {/* Prix et action */}
        <div className="flex items-center justify-between pt-4">
          <div className="space-y-2">
            <Skeleton className="w-24 h-7" />
            <Skeleton className="w-20 h-4" />
          </div>
          <Skeleton className="w-32 h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton pour page détail produit
 */
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-2 h-4" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-2 h-4" />
          <Skeleton className="w-32 h-4" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galerie d'images skeleton */}
          <div className="space-y-4">
            {/* Image principale */}
            <Skeleton className="w-full aspect-square rounded-xl" />

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
            </div>
          </div>

          {/* Infos produit skeleton */}
          <div className="space-y-6">
            {/* Titre */}
            <div className="space-y-3">
              <Skeleton className="w-3/4 h-8" />
              <Skeleton className="w-1/2 h-8" />
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <Skeleton className="w-32 h-10" />
              <Skeleton className="w-24 h-5" />
            </div>

            {/* Description courte */}
            <div className="space-y-2 pt-4 border-t">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
            </div>

            {/* Variants */}
            <div className="space-y-3 pt-4">
              <Skeleton className="w-24 h-5" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            </div>

            {/* Quantité et actions */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-32 h-12 rounded-lg" />
                <Skeleton className="flex-1 h-12 rounded-lg" />
              </div>
              <Skeleton className="w-full h-12 rounded-lg" />
            </div>

            {/* Infos complémentaires */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center space-y-2">
                <Skeleton className="w-12 h-12 mx-auto rounded-lg" />
                <Skeleton className="w-20 h-3 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="w-12 h-12 mx-auto rounded-lg" />
                <Skeleton className="w-20 h-3 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="w-12 h-12 mx-auto rounded-lg" />
                <Skeleton className="w-20 h-3 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mt-12 space-y-6">
          <div className="flex gap-6 border-b">
            <Skeleton className="w-32 h-10" />
            <Skeleton className="w-32 h-10" />
            <Skeleton className="w-32 h-10" />
          </div>

          <div className="space-y-3">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-4/5 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Grille de skeletons pour la page produits
 */
interface ProductGridSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 12,
  viewMode = 'grid',
}) => {
  const SkeletonComponent = viewMode === 'grid' ? ProductCardSkeleton : ProductCardListSkeleton;

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      }
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
};

export default Skeleton;
