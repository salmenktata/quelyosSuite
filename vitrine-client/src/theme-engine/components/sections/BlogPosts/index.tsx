'use client';

import { lazy, Suspense } from 'react';
import type { SectionProps } from '../../../engine/types';

const Grid3Cols = lazy(() => import('./variants/Grid3Cols'));

export default function BlogPosts({ variant: _variant = 'grid-3cols', config, className, theme }: SectionProps) {
  return (
    <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
      <Grid3Cols config={config} className={className} theme={theme} />
    </Suspense>
  );
}
