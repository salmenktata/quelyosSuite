'use client';

import React from 'react';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';

interface FreeShippingBarProps {
  cartTotal: number;
  className?: string;
  variant?: 'compact' | 'full';
}

export const FreeShippingBar: React.FC<FreeShippingBarProps> = ({
  cartTotal,
  className = '',
  variant = 'full',
}) => {
  const freeShippingThreshold = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 150;
  const currencySymbol = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL || 'TND';

  const remaining = Math.max(0, freeShippingThreshold - cartTotal);
  const progress = Math.min(100, (cartTotal / freeShippingThreshold) * 100);
  const isFreeShipping = remaining === 0;

  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        {isFreeShipping ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Livraison gratuite !</span>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Plus que <span className="font-bold text-primary">{remaining.toFixed(2)} {currencySymbol}</span> pour la livraison gratuite
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 ${className}`}>
      {isFreeShipping ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-green-700 text-lg">Livraison gratuite !</p>
            <p className="text-sm text-green-600">Votre commande bénéficie de la livraison offerte</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Plus que <span className="font-bold text-primary">{remaining.toFixed(2)} {currencySymbol}</span> pour la livraison gratuite !
              </span>
            </div>
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
          </div>

          {/* Barre de progression */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Indicateur du seuil */}
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0 {currencySymbol}</span>
            <span>{freeShippingThreshold} {currencySymbol}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeShippingBar;
