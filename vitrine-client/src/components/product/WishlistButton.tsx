'use client';

import React, { useState } from 'react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/lib/logger';

interface WishlistButtonProps {
  productId: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  size: _size = 'md',
  showLabel = false,
}) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const inWishlist = isInWishlist(productId);

  const _sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const _iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Vous devez être connecté pour ajouter des produits à votre liste de souhaits');
      return;
    }

    setIsLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      logger.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        \${sizes[size]}
        flex items-center justify-center gap-2
        rounded-full
        \${inWishlist 
          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
          : 'bg-white text-gray-600 hover:bg-gray-50'
        }
        border-2 \${inWishlist ? 'border-red-600' : 'border-gray-300'}
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-110
        shadow-sm hover:shadow-md
      `}
      aria-label={inWishlist ? 'Retirer de la wishlist' : 'Ajouter à la wishlist'}
      title={inWishlist ? 'Retirer de la wishlist' : 'Ajouter à la wishlist'}
    >
      {isLoading ? (
        <div className={`animate-spin \${iconSizes[size]}`}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      ) : (
        <svg 
          className={`\${iconSizes[size]} transition-all`}
          fill={inWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {inWishlist ? 'Dans la wishlist' : 'Wishlist'}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;
