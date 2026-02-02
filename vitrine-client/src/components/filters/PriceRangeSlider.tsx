/**
 * PriceRangeSlider - Slider de prix dual range avec debounce
 * Applique automatiquement le filtre après un délai (sans bouton "Appliquer")
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Motion } from '@/components/common/Motion';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number, max: number) => void;
  debounceDelay?: number;
  currency?: string;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
  debounceDelay = 500,
  currency = 'TND',
}) => {
  const [localMin, setLocalMin] = useState(currentMin);
  const [localMax, setLocalMax] = useState(currentMax);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalMin(currentMin);
    setLocalMax(currentMax);
  }, [currentMin, currentMax]);

  useEffect(() => {
    if (!isDragging) {
      const timer = setTimeout(() => {
        if (localMin !== currentMin || localMax !== currentMax) {
          onChange(localMin, localMax);
        }
      }, debounceDelay);

      return () => clearTimeout(timer);
    }
  }, [localMin, localMax, isDragging, currentMin, currentMax, debounceDelay, onChange]);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, localMax - 10);
    setLocalMin(newMin);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, localMin + 10);
    setLocalMax(newMax);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-primary">{localMin} {currency}</span>
        <span className="text-gray-400">-</span>
        <span className="text-primary">{localMax} {currency}</span>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="w-full"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="w-full"
        />
      </div>

      {isDragging && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center text-gray-500"
        >
          Relâchez pour appliquer
        </Motion.div>
      )}
    </div>
  );
};

export default PriceRangeSlider;
