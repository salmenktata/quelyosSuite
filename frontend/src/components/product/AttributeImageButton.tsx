'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { isLightColor } from '@/lib/variants';

// SVG CheckIcon inline
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

interface AttributeImageButtonProps {
  image?: string;
  label: string;
  price?: number;
  currency?: string;
  stock?: number;
  inStock: boolean;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  colorHex?: string; // Couleur hex si pas d'image
}

export function AttributeImageButton({
  image,
  label,
  price,
  currency = 'TND',
  stock,
  inStock,
  selected,
  disabled,
  onClick,
  colorHex,
}: AttributeImageButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-3 border-2 rounded-xl transition-all duration-300
        ${selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : !disabled
            ? 'border-gray-300 hover:border-primary hover:shadow-md'
            : 'border-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
      `}
    >
      {/* Image thumbnail 56x56 OU pastille de couleur */}
      {image ? (
        <div className="w-14 h-14 mb-2 bg-gray-50 rounded-lg overflow-hidden">
          <img
            src={image}
            alt={label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : colorHex ? (
        <div
          className={`w-14 h-14 mb-2 rounded-lg border-2 ${
            isLightColor(colorHex) ? 'border-gray-300' : 'border-transparent'
          }`}
          style={{ backgroundColor: colorHex }}
          aria-label={`Couleur ${label}`}
        />
      ) : null}

      {/* Label */}
      <p className={`text-sm font-semibold mb-1 ${selected ? 'text-primary' : 'text-gray-900'}`}>
        {label}
      </p>

      {/* Prix si différent */}
      {price && (
        <p className="text-xs text-gray-600 mb-1">
          {price.toFixed(2)} {currency}
        </p>
      )}

      {/* Stock indicator */}
      {inStock && stock !== undefined && (
        <p className={`text-xs ${stock <= 3 ? 'text-orange-600' : 'text-green-700'}`}>
          ● {stock} en stock
        </p>
      )}

      {/* Checkmark si selected */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
        >
          <CheckIcon className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* Overlay "Épuisé" si disabled */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
          <span className="text-xs text-red-600 font-bold px-2 py-1 bg-red-50 rounded">
            Épuisé
          </span>
        </div>
      )}
    </motion.button>
  );
}
