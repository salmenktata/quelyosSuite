'use client';

import React from 'react';
import { Motion } from '@/components/common/Motion';

interface SizeButtonProps {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  stockInfo?: {
    inStock: boolean;
    qty?: number;
  };
}

/**
 * Bouton de taille/attribut compact style Zalando
 * Grid layout pour affichage optimal
 */
export function SizeButton({
  label,
  selected,
  disabled,
  onClick,
  stockInfo,
}: SizeButtonProps) {
  // Déterminer le message de stock
  const getStockMessage = () => {
    if (disabled || !stockInfo?.inStock) return 'Épuisé';
    if (stockInfo.qty === 1) return 'Dernière pièce';
    if (stockInfo.qty && stockInfo.qty <= 3) return `${stockInfo.qty} restants`;
    return null;
  };

  const stockMessage = getStockMessage();
  const isLowStock = stockInfo?.qty && stockInfo.qty <= 3 && stockInfo.inStock;

  return (
    <Motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`
        relative px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
        border-2
        ${selected
          ? 'border-primary bg-primary text-white'
          : disabled
            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border-gray-300 text-gray-900 hover:border-primary hover:bg-gray-50'
        }
        ${isLowStock && !selected ? 'border-orange-400' : ''}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
      `}
      aria-label={`${label}${selected ? ' (sélectionné)' : ''}${stockMessage ? ` - ${stockMessage}` : ''}`}
    >
      {/* Label principal */}
      <span className="block font-semibold">{label}</span>

      {/* Info stock (si pertinent) */}
      {stockMessage && (
        <span className={`block text-xs mt-0.5 ${
          disabled
            ? 'text-gray-400'
            : isLowStock
              ? 'text-orange-600'
              : 'text-red-600'
        }`}>
          {stockMessage}
        </span>
      )}

      {/* Croix si épuisé */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
    </Motion.button>
  );
}
