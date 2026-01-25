'use client';

import React from 'react';
import { Motion } from '@/components/common/Motion';

interface AttributePillProps {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AttributePill({
  label,
  selected,
  disabled,
  onClick,
  size = 'md',
}: AttributePillProps) {
  // Tailles responsives
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  return (
    <Motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        border-2 rounded-xl font-semibold transition-all duration-300
        ${selected
          ? 'bg-primary text-white border-primary shadow-md'
          : !disabled
            ? 'border-gray-300 text-gray-900 hover:border-primary hover:shadow-sm'
            : 'border-gray-200 text-gray-400 cursor-not-allowed'
        }
        ${disabled ? 'opacity-40 line-through' : 'cursor-pointer'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        min-w-[44px]
      `}
    >
      {label}
    </Motion.button>
  );
}
