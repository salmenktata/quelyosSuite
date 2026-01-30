'use client';

import React, { useMemo } from 'react';
import { MapPin, Truck } from 'lucide-react';
import {
  GOVERNORATES,
  SHIPPING_ZONES,
  getDefaultShippingPrice,
  type ShippingZone,
} from '@/data/tunisia-governorates';

interface GovernorateState {
  id: number;
  name: string;
  code: string;
  zone: ShippingZone;
  zone_label: string;
  shipping_price: number;
}

interface GovernorateSelectProps {
  value: string;
  onChange: (code: string, state?: GovernorateState) => void;
  states?: GovernorateState[];
  zonePrices?: Record<ShippingZone, number>;
  freeThreshold?: number;
  cartTotal?: number;
  error?: string;
  disabled?: boolean;
  showPrice?: boolean;
}

export const GovernorateSelect: React.FC<GovernorateSelectProps> = ({
  value,
  onChange,
  states,
  zonePrices,
  freeThreshold = 150,
  cartTotal = 0,
  error,
  disabled = false,
  showPrice = true,
}) => {
  const governorates = useMemo(() => {
    if (states && states.length > 0) {
      return states;
    }
    return GOVERNORATES.map((g) => ({
      id: 0,
      name: g.name,
      code: g.code,
      zone: g.zone,
      zone_label: SHIPPING_ZONES.find((z) => z.code === g.zone)?.label || g.zone,
      shipping_price: zonePrices?.[g.zone] ?? getDefaultShippingPrice(g.zone),
    }));
  }, [states, zonePrices]);

  const groupedByZone = useMemo(() => {
    const groups: Record<string, GovernorateState[]> = {};
    for (const g of governorates) {
      const zoneKey = g.zone_label || g.zone;
      if (!groups[zoneKey]) {
        groups[zoneKey] = [];
      }
      groups[zoneKey].push(g);
    }
    return groups;
  }, [governorates]);

  const selectedGovernorate = useMemo(
    () => governorates.find((g) => g.code === value),
    [governorates, value]
  );

  const isFreeShipping = freeThreshold > 0 && cartTotal >= freeThreshold;
  const shippingPrice = selectedGovernorate?.shipping_price ?? 0;
  const displayPrice = isFreeShipping ? 0 : shippingPrice;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const state = governorates.find((g) => g.code === code);
    onChange(code, state);
  };

  return (
    <div className="w-full">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <MapPin className="h-4 w-4" />
        Gouvernorat *
      </label>

      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 border rounded-lg text-gray-900 dark:text-white
          bg-white dark:bg-gray-800
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
        `}
      >
        <option value="">Sélectionner votre gouvernorat</option>
        {Object.entries(groupedByZone).map(([zoneLabel, zoneGovernorates]) => (
          <optgroup key={zoneLabel} label={zoneLabel}>
            {zoneGovernorates.map((g) => (
              <option key={g.code} value={g.code}>
                {g.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {showPrice && selectedGovernorate && (
        <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Truck className="h-4 w-4" />
              <span>Frais de livraison ({selectedGovernorate.zone_label})</span>
            </div>
            <div className="text-right">
              {isFreeShipping ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm line-through text-gray-400">
                    {shippingPrice.toFixed(2)} TND
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Gratuit
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-gray-900 dark:text-white">
                  {displayPrice.toFixed(2)} TND
                </span>
              )}
            </div>
          </div>

          {!isFreeShipping && freeThreshold > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Livraison gratuite dès {freeThreshold.toFixed(0)} TND d&apos;achat
              {cartTotal > 0 && (
                <span className="ml-1">
                  (encore {(freeThreshold - cartTotal).toFixed(2)} TND)
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GovernorateSelect;
