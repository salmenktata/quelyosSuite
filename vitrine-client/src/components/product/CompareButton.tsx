'use client';

import React from 'react';
import { useComparisonStore } from '@/store/comparisonStore';
import { useSiteConfig } from '@/hooks/useSiteConfig';

interface CompareButtonProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url?: string;
  };
  size?: 'sm' | 'md';
}

const CompareButton: React.FC<CompareButtonProps> = ({ product, size = 'md' }) => {
  // Fonctionnalité de comparaison désactivée
  return null;

  /* DÉSACTIVÉ - Code original
  const { addProduct, removeProduct, isInComparison, canAdd } = useComparisonStore();
  const { data: siteConfig } = useSiteConfig();

  const inComparison = isInComparison(product.id);

  // Ne pas afficher si la fonctionnalité est désactivée
  if (!siteConfig?.compare_enabled) {
    return null;
  }
  */

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inComparison) {
      removeProduct(product.id);
    } else {
      if (canAdd() || inComparison) {
        addProduct(product);
      }
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        rounded-lg font-medium transition-all
        ${inComparison
          ? 'bg-primary text-white hover:bg-primary-dark'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }
        flex items-center gap-2
      `}
      title={inComparison ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
        />
      </svg>
      {inComparison ? 'Dans la comparaison' : 'Comparer'}
    </button>
  );
};

export default CompareButton;
