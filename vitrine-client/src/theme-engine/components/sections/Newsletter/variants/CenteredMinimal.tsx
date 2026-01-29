'use client';

import { useState } from 'react';
import type { ThemeContextValue } from '../../../../engine/types';
import { Mail } from 'lucide-react';

interface CenteredMinimalProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function CenteredMinimal({ config, className = '', theme }: CenteredMinimalProps) {
  const title = (config?.title as string) || 'Restez Informé';
  const subtitle = (config?.subtitle as string) || 'Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // TODO: Appel API backend pour inscription newsletter
      // await fetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) });

      // Simulation pour POC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div
        className="container mx-auto px-4 text-center"
        style={{ maxWidth: theme.spacing.containerWidth }}
      >
        <Mail
          size={48}
          className="mx-auto mb-6"
          style={{ color: theme.colors.primary }}
        />
        <h2
          className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
          style={{ fontFamily: `var(--theme-font-headings)` }}
        >
          {title}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
              disabled={status === 'loading'}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              }}
            >
              {status === 'loading' ? 'Inscription...' : "S'inscrire"}
            </button>
          </div>

          {status === 'success' && (
            <p className="mt-4 text-green-600 dark:text-green-400">
              Merci ! Vous êtes inscrit à notre newsletter.
            </p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-red-600 dark:text-red-400">
              Une erreur est survenue. Veuillez réessayer.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
