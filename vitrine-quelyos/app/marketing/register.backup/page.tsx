'use client';

import { FormEvent, useState, Suspense } from 'react';
import Link from 'next/link';
import { config } from '@/app/lib/config';

// Icônes inline
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Building2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOff = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

function RegisterLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-fuchsia-400">Chargement...</div>
    </div>
  );
}

function RegisterForm() {
  const [form, setForm] = useState({ email: '', password: '', companyName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(form.password);
  const strengthLabels = ['', 'Faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Excellent'];
  const strengthColors = ['', 'bg-red-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-500'];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.companyName || !form.email || !form.password) {
      setError('Merci de renseigner tous les champs.');
      return;
    }

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.api.marketing}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Impossible de créer le compte.');
        return;
      }

      window.location.href = config.marketing.dashboard;
    } catch {
      setError('Impossible de créer le compte.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche - Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-gray-950 via-fuchsia-950 to-orange-950 lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-fuchsia-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] animate-pulse rounded-full bg-orange-500/20 blur-[100px] delay-1000" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">
          {/* Logo */}
          <div className="flex items-start justify-between">
            <Link href="/" className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-500 shadow-lg shadow-orange-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Quelyos</h1>
                <p className="text-xs uppercase tracking-widest text-fuchsia-200/80">Marketing Platform</p>
              </div>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xl:inline">Retour</span>
            </Link>
          </div>

          {/* Main content */}
          <div className="my-auto space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/20 px-3 py-1.5 text-xs font-medium text-fuchsia-300 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                <span>Démarrez gratuitement - Aucune carte requise</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                Boostez votre présence
                <br />
                <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  sur les réseaux sociaux
                </span>
              </h2>
              <p className="max-w-lg text-lg text-slate-300/90">
                L&apos;IA qui gère vos réseaux sociaux pendant que vous gérez votre business.
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-4 w-4 text-fuchsia-300" />
              <span>RGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Zap className="h-4 w-4 text-fuchsia-300" />
              <span>IA 100% Française</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="relative flex w-full flex-col justify-center bg-gray-950 lg:w-1/2 xl:w-[45%]">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-fuchsia-500/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-orange-500/20 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-6 py-12 lg:px-12">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-500 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Quelyos</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-bold text-white lg:text-3xl">Créer un compte</h2>
            <p className="text-slate-400">Commencez gratuitement, évoluez selon vos besoins.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="companyName">
                Nom de l&apos;entreprise
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="companyName"
                  type="text"
                  placeholder="Ma Société"
                  className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 pl-12 pr-4 text-white placeholder:text-slate-500 transition-all focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 text-white placeholder:text-slate-500 transition-all focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 pr-12 text-white placeholder:text-slate-500 transition-all focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {form.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-slate-800'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Force : <span className={passwordStrength >= 4 ? 'text-emerald-400' : passwordStrength >= 3 ? 'text-yellow-400' : 'text-red-400'}>{strengthLabels[passwordStrength]}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900/50 text-fuchsia-500 focus:ring-fuchsia-500/20"
              />
              <label htmlFor="terms" className="text-sm text-slate-400">
                J&apos;accepte les{' '}
                <Link href="/marketing/cgu" className="text-fuchsia-400 underline hover:text-fuchsia-300">
                  conditions d&apos;utilisation
                </Link>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-fuchsia-400 hover:to-orange-400 hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte gratuit</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-fuchsia-400" />
                Gratuit pour commencer
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-fuchsia-400" />
                Sans carte bancaire
              </span>
            </div>
          </form>

          {/* Login link */}
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-slate-400">Déjà un compte ?</p>
            <Link
              href="/marketing/login"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/30 font-medium text-white transition-all hover:border-slate-600/50 hover:bg-slate-800/50"
            >
              <span>Se connecter</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <Link href="/marketing/mentions-legales" className="transition-colors hover:text-slate-400">Mentions légales</Link>
              <Link href="/marketing/confidentialite" className="transition-colors hover:text-slate-400">Confidentialité</Link>
            </div>
            <p className="mt-4 text-center text-xs text-slate-600">© 2026 Quelyos. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingRegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  );
}
