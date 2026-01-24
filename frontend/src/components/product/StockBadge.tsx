/**
 * StockBadge - Indicateur de stock dynamique
 * Affiche le statut du stock avec des couleurs et animations appropriées
 */

import React from 'react';

interface StockBadgeProps {
  /** Quantité en stock */
  stock: number;
  /** Taille du badge */
  size?: 'sm' | 'md' | 'lg';
  /** Afficher le nombre exact si stock faible */
  showCount?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  stock,
  size = 'md',
  showCount = true,
  className = '',
}) => {
  // Configuration selon le niveau de stock
  const getStockConfig = () => {
    if (stock === 0) {
      return {
        label: 'Rupture de stock',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        dotColor: 'bg-red-500',
        animate: false,
      };
    } else if (stock < 5) {
      return {
        label: showCount ? `Plus que ${stock} en stock !` : 'Stock limité !',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        dotColor: 'bg-orange-500',
        animate: true,
      };
    } else if (stock < 10) {
      return {
        label: showCount ? `Plus que ${stock} en stock` : 'Stock limité',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        dotColor: 'bg-yellow-500',
        animate: false,
      };
    } else {
      return {
        label: 'En stock',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        dotColor: 'bg-green-500',
        animate: false,
      };
    }
  };

  // Tailles selon le prop size
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 rounded text-xs',
      dot: 'w-1.5 h-1.5',
      gap: 'gap-1.5',
    },
    md: {
      container: 'px-3 py-1.5 rounded-md text-sm',
      dot: 'w-2 h-2',
      gap: 'gap-2',
    },
    lg: {
      container: 'px-4 py-2 rounded-lg text-base',
      dot: 'w-2.5 h-2.5',
      gap: 'gap-2.5',
    },
  };

  const config = getStockConfig();
  const sizes = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center
        ${sizes.container}
        ${sizes.gap}
        ${config.bgColor}
        ${config.textColor}
        font-medium
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {/* Dot indicateur avec animation optionnelle */}
      <div
        className={`
          ${sizes.dot}
          ${config.dotColor}
          rounded-full
          ${config.animate ? 'animate-pulse-slow' : ''}
        `}
        aria-hidden="true"
      />

      {/* Label */}
      <span>{config.label}</span>
    </div>
  );
};

/**
 * Variante compacte pour affichage dans les cartes produits
 */
export const StockIndicator: React.FC<{ inStock: boolean; stock?: number }> = ({
  inStock,
  stock
}) => {
  if (!inStock) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        <span className="font-medium">Rupture</span>
      </div>
    );
  }

  if (stock !== undefined && stock < 10) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-orange-600">
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse-slow" />
        <span className="font-medium">Stock limité</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
      <span className="font-medium">En stock</span>
    </div>
  );
};

export default StockBadge;
