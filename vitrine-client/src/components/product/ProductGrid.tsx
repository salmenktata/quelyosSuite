/**
 * ProductGrid - Grille de produits avec animations stagger
 * Wrapper animé pour afficher une collection de produits
 */

'use client';

import React from 'react';
import { Motion, AnimatePresence } from '@/components/common/Motion';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

interface ProductGridProps {
  /** Contenu de la grille (cartes produits) */
  children: React.ReactNode;
  /** Mode d'affichage */
  viewMode?: 'grid' | 'list';
  /** Classes CSS supplémentaires */
  className?: string;
}

/**
 * Grille de produits avec animations d'entrée en cascade
 * Les produits apparaissent un par un avec un effet stagger
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  children,
  viewMode = 'grid',
  className = '',
}) => {
  // Classes selon le mode d'affichage
  const gridClasses = viewMode === 'grid'
    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    : 'space-y-4';

  return (
    <Motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={`${gridClasses} ${className}`}
    >
      <AnimatePresence mode="popLayout">
        {React.Children.map(children, (child, index) => (
          <Motion.div
            key={index}
            variants={staggerItem}
            layout
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {child}
          </Motion.div>
        ))}
      </AnimatePresence>
    </Motion.div>
  );
};

export default ProductGrid;
