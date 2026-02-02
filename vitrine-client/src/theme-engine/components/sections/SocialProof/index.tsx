'use client';

import { lazy, Suspense } from 'react';
import type { SectionProps } from '../../../engine/types';

const Stats = lazy(() => import('./variants/Stats'));

export default function SocialProof({ variant: _variant = 'stats', config, className, theme }: SectionProps) {
  return (
    <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
      <Stats config={config} className={className} theme={theme} />
    </Suspense>
  );
}
