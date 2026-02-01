'use client';

import { FormEvent, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { config } from '@/app/lib/config';

// Icônes inline
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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

const Globe = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V10m6 10V4M6 20v-4" />
  </svg>
);

const CreditCard = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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

// Icônes OAuth
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

function RegisterLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-indigo-400">Chargement...</div>
    </div>
  );
}

function RegisterForm() {
   
  const _searchParams = useSearchParams();

  const [form, setForm] = useState({ email: '', password: '', companyName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  // Password strength checker
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
      const response = await fetch(`${config.api.finance}/auth/register`, {
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

      // Rediriger vers le dashboard après inscription
      window.location.href = config.finance.dashboard;
    } catch {
      setError('Impossible de créer le compte.');
    } finally {
      setLoading(false);
    }
  }

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    window.location.href = `${config.api.finance}/auth/oauth/${provider}`;
  };

  const features = [
    { Icon: BarChart3, title: 'Dashboard intelligent', desc: 'Visualisation en temps réel de votre trésorerie' },
    { Icon: CreditCard, title: 'Multi-comptes', desc: 'Gérez tous vos comptes bancaires en un seul endroit' },
    { Icon: Zap, title: 'Automatisation', desc: 'Catégorisation et rapports automatiques' },
    { Icon: Shield, title: 'Sécurité maximale', desc: 'Chiffrement bancaire et conformité RGPD' },
  ];

  const plans = [
    { name: 'Starter', price: 'Gratuit', popular: false },
    { name: 'Pro', price: '29€/mois', popular: true },
    { name: 'Enterprise', price: 'Sur mesure', popular: false },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche - Branding & Avantages */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-violet-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] animate-pulse rounded-full bg-indigo-500/20 blur-[100px] delay-1000" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">
          {/* Logo */}
          <div className="flex items-start justify-between">
            <Link href="/" className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Quelyos</h1>
                <p className="text-xs uppercase tracking-widest text-indigo-200/80">Finance Platform</p>
              </div>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xl:inline">Retour</span>
            </Link>
          </div>

          {/* Main content */}
          <div className="my-auto space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                <span>Démarrez gratuitement - Aucune carte requise</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                Créez votre espace
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                  financier premium
                </span>
              </h2>
              <p className="max-w-lg text-lg text-slate-300/90">
                Rejoignez plus de 2 500 entreprises qui font confiance à Quelyos pour piloter leurs finances.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
                    <feature.Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Plans preview */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-300">Choisissez votre plan après inscription :</p>
              <div className="flex gap-3">
                {plans.map((plan, i) => (
                  <div key={i} className={`flex-1 rounded-xl border p-3 ${plan.popular ? 'border-indigo-500/50 bg-indigo-500/20' : 'border-white/10 bg-white/5'}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{plan.name}</span>
                      {plan.popular && <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] text-white">Populaire</span>}
                    </div>
                    <p className="text-xs font-medium text-indigo-300">{plan.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>RGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>SSL Sécurisé</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Globe className="h-4 w-4 text-indigo-400" />
              <span>Marchés internationaux</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="relative flex w-full flex-col justify-center bg-slate-950 lg:w-1/2 xl:w-[45%]">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-violet-500/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-indigo-500/20 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-6 py-12 lg:px-12">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg">
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

          {/* OAuth Buttons */}
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/30 font-medium text-white transition-all hover:border-slate-600/50 hover:bg-slate-800/50 disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <GoogleIcon />
                  <span>S&apos;inscrire avec Google</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('linkedin')}
              disabled={!!oauthLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/30 font-medium text-white transition-all hover:border-slate-600/50 hover:bg-slate-800/50 disabled:opacity-50"
            >
              {oauthLoading === 'linkedin' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <LinkedInIcon />
                  <span>S&apos;inscrire avec LinkedIn</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500">OU</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="companyName">
                Nom de l&apos;entreprise
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="companyName"
                  type="text"
                  placeholder="Ma Société SAS"
                  className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 pl-12 pr-4 text-white placeholder:text-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
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
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password strength indicator */}
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

              <p className="text-xs text-slate-500">Minimum 8 caractères avec majuscules, chiffres et caractères spéciaux.</p>
            </div>

            {/* Terms */}
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
                <Link href="/finance/cgu" className="text-indigo-400 underline hover:text-indigo-300">
                  conditions d&apos;utilisation
                </Link>{' '}
                et la{' '}
                <Link href="/finance/confidentialite" className="text-indigo-400 underline hover:text-indigo-300">
                  politique de confidentialité
                </Link>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-400 hover:to-violet-400 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* Benefits reminder */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Gratuit pour commencer
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Sans carte bancaire
              </span>
            </div>
          </form>

          {/* Login link */}
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-slate-400">Déjà un compte ?</p>
            <Link
              href="/finance/login"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/30 font-medium text-white transition-all hover:border-slate-600/50 hover:bg-slate-800/50"
            >
              <span>Se connecter</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <Link href="/finance/mentions-legales" className="transition-colors hover:text-slate-400">Mentions légales</Link>
              <Link href="/finance/confidentialite" className="transition-colors hover:text-slate-400">Confidentialité</Link>
              <Link href="/finance/cgu" className="transition-colors hover:text-slate-400">CGU</Link>
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
