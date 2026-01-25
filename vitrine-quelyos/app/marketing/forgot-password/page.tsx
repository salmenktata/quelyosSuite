'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { config } from '@/app/lib/config';

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const Mail = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function MarketingForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${config.api.marketing}/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible d'envoyer l'email.");
        return;
      }

      setSent(true);
    } catch {
      setError("Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        {/* Logo */}
        <Link href="/" className="mb-12 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-500 shadow-lg shadow-orange-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Quelyos Marketing</span>
        </Link>

        {!sent ? (
          <>
            {/* Header */}
            <div className="mb-8 space-y-2">
              <h1 className="text-2xl font-bold text-white lg:text-3xl">Mot de passe oublié ?</h1>
              <p className="text-slate-400">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    placeholder="vous@entreprise.com"
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 pl-12 pr-4 text-white placeholder:text-slate-500 transition-all focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-8 text-center">
              <Link
                href="/marketing/login"
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-500/20">
              <CheckCircle className="h-8 w-8 text-fuchsia-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">Email envoyé !</h1>
            <p className="mb-8 text-slate-400">
              Si un compte existe avec l&apos;adresse <span className="font-medium text-white">{email}</span>, vous recevrez un email avec les instructions.
            </p>
            <Link
              href="/marketing/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/30 px-6 font-medium text-white transition-all hover:border-slate-600/50 hover:bg-slate-800/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <Link href="/marketing/mentions-legales" className="transition-colors hover:text-slate-400">
              Mentions légales
            </Link>
            <Link href="/marketing/confidentialite" className="transition-colors hover:text-slate-400">
              Confidentialité
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-slate-600">© 2025 Quelyos. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
