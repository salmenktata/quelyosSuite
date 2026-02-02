'use client';

import { lazy, Suspense } from 'react';
import type { SectionProps } from '../../../engine/types';

const Fullscreen = lazy(() => import('./variants/Fullscreen'));

export default function VideoHero({ variant: _variant = 'fullscreen', config, className, theme }: SectionProps) {
  return (
    <Suspense fallback={<div className="h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
      <Fullscreen config={config} className={className} theme={theme} />
    </Suspense>
  );
}
