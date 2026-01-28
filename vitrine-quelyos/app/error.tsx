'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log only digest, not full error message (security)
    logger.error('Page error:', { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4">Erreur</h1>
        <h2 className="text-2xl font-semibold text-slate-600 dark:text-slate-300 mb-4">
          Une erreur s&apos;est produite
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Quelque chose ne s&apos;est pas passé comme prévu.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
