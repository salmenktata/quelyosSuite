'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: Date | string;
  className?: string;
  variant?: 'compact' | 'full' | 'badge';
  onExpire?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * Countdown Timer Component
 * Displays urgency timer for limited-time offers
 * Features:
 * - Real-time countdown
 * - Multiple display variants
 * - Auto-hide when expired
 * - Pulse animation for urgency
 */
export function CountdownTimer({
  endDate,
  className = '',
  variant = 'full',
  onExpire
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = (): TimeRemaining => {
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
      const now = new Date();
      const total = end.getTime() - now.getTime();

      if (total <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      const seconds = Math.floor((total / 1000) % 60);
      const minutes = Math.floor((total / 1000 / 60) % 60);
      const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
      const days = Math.floor(total / (1000 * 60 * 60 * 24));

      return { days, hours, minutes, seconds, total };
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Call onExpire when countdown reaches zero
      if (remaining.total <= 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpire]);

  // Don't render if expired
  if (timeRemaining.total <= 0) {
    return null;
  }

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  // Variant Badge - Compact badge for product cards
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-md text-xs font-bold ${className}`}>
        <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>
          {timeRemaining.hours}h {formatNumber(timeRemaining.minutes)}m
        </span>
      </div>
    );
  }

  // Variant Compact - Inline display
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-1 text-red-600 font-semibold">
          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>Offre expire dans:</span>
        </div>
        <div className="flex items-center gap-1 font-mono font-bold text-gray-900">
          {timeRemaining.days > 0 && (
            <>
              <span>{timeRemaining.days}j</span>
              <span className="text-gray-400">:</span>
            </>
          )}
          <span>{formatNumber(timeRemaining.hours)}h</span>
          <span className="text-gray-400">:</span>
          <span>{formatNumber(timeRemaining.minutes)}m</span>
          <span className="text-gray-400">:</span>
          <span className="text-red-600">{formatNumber(timeRemaining.seconds)}s</span>
        </div>
      </div>
    );
  }

  // Variant Full - Prominent display with boxes
  return (
    <div className={`bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">⚡ Offre à durée limitée</p>
            <p className="text-xs text-gray-600">Profitez-en avant qu'il ne soit trop tard !</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {timeRemaining.days > 0 && (
          <>
            <TimeBox value={timeRemaining.days} label="Jours" />
            <Separator />
          </>
        )}
        <TimeBox value={timeRemaining.hours} label="Heures" />
        <Separator />
        <TimeBox value={timeRemaining.minutes} label="Min" />
        <Separator />
        <TimeBox value={timeRemaining.seconds} label="Sec" highlight />
      </div>
    </div>
  );
}

// Time box component for full variant
function TimeBox({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`
        ${highlight ? 'bg-red-600 text-white' : 'bg-white text-gray-900'}
        rounded-lg shadow-md px-3 py-2 min-w-[60px] text-center
        transition-all duration-300
        ${highlight ? 'animate-pulse' : ''}
      `}>
        <span className="text-2xl font-bold font-mono">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-gray-600 font-medium mt-1">{label}</span>
    </div>
  );
}

// Separator component
function Separator() {
  return (
    <div className="text-2xl font-bold text-gray-400 pb-6">:</div>
  );
}

export default CountdownTimer;
