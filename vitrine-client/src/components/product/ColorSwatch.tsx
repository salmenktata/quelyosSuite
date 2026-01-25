'use client';

import React from 'react';
import { Motion } from '@/components/common/Motion';
import { isLightColor } from '@/lib/variants';

interface ColorSwatchProps {
  color: string;
  colorName: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  onHover?: () => void; // Callback au survol (change image)
  onLeave?: () => void; // Callback quand on quitte le survol
  size?: 'sm' | 'md';
}

/**
 * Pastille de couleur compacte style Zalando
 * Taille : 32x32px (sm) ou 40x40px (md)
 */
export function ColorSwatch({
  color,
  colorName,
  selected,
  disabled,
  onClick,
  onHover,
  onLeave,
  size = 'md',
}: ColorSwatchProps) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <Motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => !disabled && onHover?.()}
      onMouseLeave={() => onLeave?.()}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`
        relative ${sizeClass} rounded-full transition-all duration-200
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
      `}
      title={`${colorName}${disabled ? ' - Épuisé' : ''}`}
      aria-label={`${colorName}${selected ? ' (sélectionné)' : ''}${disabled ? ' (épuisé)' : ''}`}
    >
      {/* Couleur */}
      <div
        className={`
          w-full h-full rounded-full transition-all duration-200
          ${isLightColor(color) ? 'border-2 border-gray-300' : 'border-2 border-transparent'}
          ${selected
            ? 'ring-2 ring-primary ring-offset-2'
            : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
          }
        `}
        style={{ backgroundColor: color }}
      />

      {/* Checkmark si sélectionné */}
      {selected && (
        <Motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <svg
            className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${isLightColor(color) ? 'text-gray-900' : 'text-white'} drop-shadow-lg`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Motion.div>
      )}

      {/* Croix si épuisé */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-full h-0.5 bg-red-500 rotate-45" />
          <div className="absolute w-full h-0.5 bg-red-500 -rotate-45" />
        </div>
      )}
    </Motion.button>
  );
}
