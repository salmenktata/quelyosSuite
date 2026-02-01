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

const Building2 = ({ className }: { className?: string}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const Layers = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] animate-pulse rounded-full bg-purple-500/20 blur-[100px] delay-1000" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">
          {/* Logo */}
          <div className="flex items-start justify-between">
            <Link href="/" className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Quelyos</h1>
                <p className="text-xs uppercase tracking-widest text-indigo-200/80">Suite TPE/PME</p>
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
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>30 jours gratuits • Aucune carte requise</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                Pilotez toute votre entreprise
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  depuis une seule plateforme
                </span>
              </h2>
              <p className="max-w-lg text-lg text-slate-300/90">
                9 modules intégrés : Finance, Store, CRM, Stock, RH, Point de Vente, Marketing, Support — tout synchronisé automatiquement.
              </p>

              {/* Features highlights */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300">Prévisions IA 90 jours • Précision 85-90%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                    <Layers className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-300">+250 fonctionnalités • API REST complète</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                    <Users className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className="text-sm text-slate-300">2 500+ entreprises nous font confiance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-4 w-4 text-indigo-300" />
                <span>100% RGPD</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Zap className="h-4 w-4 text-indigo-300" />
                <span>Infrastructure Sécurisée</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="h-4 w-4 text-indigo-300" />
                <span>Solution Complète</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Rejoignez les TPE et PME qui simplifient leur gestion avec Quelyos Suite
            </p>
          </div>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="relative flex w-full flex-col justify-center bg-slate-950 lg:w-1/2 xl:w-[45%]">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-indigo-500/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-purple-500/20 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-6 py-12 lg:px-12">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
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
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-bold text-white lg:text-3xl">Créer votre compte Quelyos</h2>
            <p className="text-slate-400">
              Accédez à la suite ERP complète. Démarrez gratuitement pendant 30 jours, aucune carte bancaire requise.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <Check className="h-3 w-3" />
                9 modules inclus
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400">
                <Check className="h-3 w-3" />
                Installation 5 min
              </span>
            </div>
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
                  className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 pl-12 pr-4 text-white placeholder:text-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Adresse email professionnelle
              </label>
              <input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 text-white placeholder:text-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 pr-12 text-white placeholder:text-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-300"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900/50 text-indigo-500 focus:ring-indigo-500/20"
              />
              <label htmlFor="terms" className="text-sm text-slate-400">
                J&apos;accepte les{' '}
                <Link href="/legal/cgu" className="text-indigo-400 underline hover:text-indigo-300" target="_blank">
                  conditions d&apos;utilisation
                </Link>
                {' '}et la{' '}
                <Link href="/legal/confidentialite" className="text-indigo-400 underline hover:text-indigo-300" target="_blank">
                  politique de confidentialité
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
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <span>Démarrer mon essai gratuit</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  30 jours gratuits
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Sans CB
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Sans engagement
                </span>
              </div>
              <p className="text-center text-xs text-slate-600">
                Accès immédiat à tous les modules après inscription
              </p>
            </div>
          </form>

          {/* Login link */}
          <div className="mt-8 space-y-3 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-950 px-4 text-xs text-slate-500">Vous avez déjà un compte ?</span>
              </div>
            </div>
            <Link
              href="/auth/login"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/30 font-medium text-slate-300 transition-all hover:border-indigo-500/50 hover:bg-slate-800/50 hover:text-white"
            >
              <span>Se connecter</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <Link href="/legal/mentions-legales" className="transition-colors hover:text-slate-400">Mentions légales</Link>
              <Link href="/legal/confidentialite" className="transition-colors hover:text-slate-400">Confidentialité</Link>
            </div>
            <p className="mt-4 text-center text-xs text-slate-600">© 2026 Quelyos. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  );
}
