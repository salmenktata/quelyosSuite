'use client';

import React, { useEffect, useState } from 'react';
import { backendClient } from '@/lib/backend/client';
import { formatPrice } from '@/lib/utils/formatting';
import { logger } from '@/lib/logger';

interface VolumeTier {
  min_quantity: number;
  price: number;
  discount_percent: number;
  savings_per_unit: number;
}

interface VolumePricingProps {
  productId: number;
  basePrice: number;
  currency?: string;
  onQuantitySelect?: (quantity: number) => void;
}

export function VolumePricing({
  productId,
  basePrice,
  currency = 'TND',
  onQuantitySelect,
}: VolumePricingProps) {
  const [tiers, setTiers] = useState<VolumeTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVolumePricing();
  }, [productId]);

  const fetchVolumePricing = async () => {
    try {
      const response = await backendClient.getProductVolumePricing(productId);
      if (response.success && response.data && response.data.tiers.length > 0) {
        setTiers(response.data.tiers);
      }
    } catch (error) {
      logger.error('Error fetching volume pricing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || tiers.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 my-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
        </svg>
        <h4 className="font-semibold text-green-800 dark:text-green-200">Prix degressifs</h4>
      </div>

      <div className="space-y-2">
        {/* Prix unitaire de base */}
        <div className="flex items-center justify-between py-2 px-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-300">1 unite</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatPrice(basePrice, currency)}</span>
        </div>

        {/* Paliers de prix */}
        {tiers.map((tier, _index) => (
          <button
            key={tier.min_quantity}
            onClick={() => onQuantitySelect?.(tier.min_quantity)}
            className="w-full flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-transparent hover:border-green-500 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {tier.min_quantity}+ unites
              </span>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
                -{tier.discount_percent}%
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatPrice(tier.price, currency)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">/u</span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-green-700 dark:text-green-300 mt-3 text-center">
        Cliquez sur un palier pour selectionner la quantite
      </p>
    </div>
  );
}
