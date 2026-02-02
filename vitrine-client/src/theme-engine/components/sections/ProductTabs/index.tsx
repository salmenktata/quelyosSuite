'use client';

import { lazy, Suspense } from 'react';
import type { SectionProps } from '../../../engine/types';

const Tabbed = lazy(() => import('./variants/Tabbed'));

export default function ProductTabs({ variant: _variant = 'tabbed', config, className, theme }: SectionProps) {
  return (
    <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
      <Tabbed config={config} className={className} theme={theme} />
    </Suspense>
  );
}
