'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ThemeContextValue } from '../../../../engine/types';

interface CenteredProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function Centered({ config, className = '', theme }: CenteredProps) {
  const title = (config?.title as string) || 'Offre à Durée Limitée';
  const [defaultEndDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
  const endDate = (config?.endDate as string) || defaultEndDate;
  const ctaText = (config?.ctaText as string) || 'Profiter de l\'offre';
  const ctaUrl = (config?.ctaUrl as string) || '/products';

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <section className={`py-16 md:py-24 ${className}`} style={{ backgroundColor: theme.colors.accent }}>
      <div className="container mx-auto px-4 text-center" style={{ maxWidth: theme.spacing.containerWidth }}>
        <h2
          className="text-3xl md:text-5xl font-bold mb-8 text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>

        <div className="flex justify-center gap-4 md:gap-8 mb-8">
          {[
            { value: timeLeft.days, label: 'Jours' },
            { value: timeLeft.hours, label: 'Heures' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Secondes' },
          ].map((item, index) => (
            <div key={index} className="text-white">
              <div className="text-4xl md:text-6xl font-bold mb-2">{String(item.value).padStart(2, '0')}</div>
              <div className="text-sm md:text-base opacity-90">{item.label}</div>
            </div>
          ))}
        </div>

        <Link
          href={ctaUrl}
          className="inline-block px-8 py-3 bg-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
          style={{ color: theme.colors.accent }}
        >
          {ctaText}
        </Link>
      </div>
    </section>
  );
}
