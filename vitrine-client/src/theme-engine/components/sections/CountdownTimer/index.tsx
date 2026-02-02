'use client';

import { lazy, Suspense } from 'react';
import type { SectionProps } from '../../../engine/types';

const Centered = lazy(() => import('./variants/Centered'));

export default function CountdownTimer({ variant: _variant = 'centered', config, className, theme }: SectionProps) {
  return (
    <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
      <Centered config={config} className={className} theme={theme} />
    </Suspense>
  );
}
