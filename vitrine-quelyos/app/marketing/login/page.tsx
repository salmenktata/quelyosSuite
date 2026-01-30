'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';

// Icônes inline
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V10m6 10V4M6 20v-4" />
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

const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Globe = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Icônes OAuth
const FacebookIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80" />
        <stop offset="25%" stopColor="#F77737" />
        <stop offset="50%" stopColor="#E1306C" />
        <stop offset="75%" stopColor="#C13584" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-fuchsia-400">Chargement...</div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate credentials against backend via proxy
      const response = await fetch('/api/backend-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Identifiants invalides');
      }

      // Redirect to dashboard with session handoff params
      const params = new URLSearchParams({
        session_id: data.session_id || '',
        uid: String(data.uid),
        name: data.name || email,
        from: 'marketing',
      });
      window.location.href = `http://localhost:5175/auth-callback?${params.toString()}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    setError(`Connexion ${provider} bientôt disponible !`);
    setTimeout(() => setOauthLoading(null), 1000);
  };

  const stats = [
    { value: '20 min', label: 'Par semaine', Icon: Clock },
    { value: '4x', label: "Plus d'engagement", Icon: BarChart3 },
    { value: '0', label: 'Expertise requise', Icon: Users },
  ];

  const features = [
    'IA spécialisée pour vos contenus',
    'Calendrier éditorial intelligent',
    'Inbox unifiée multi-réseaux',
    'Analytics et KPIs business',
  ];

  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche - Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-gray-950 via-fuchsia-950 to-orange-950 lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-fuchsia-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] animate-pulse rounded-full bg-orange-500/20 blur-[100px] delay-1000" />
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
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-fuchsia-200 backdrop-blur-sm">
                <Globe className="h-3.5 w-3.5" />
                <span>Facebook - Instagram - Bientôt TikTok</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                Le marketing social,
                <br />
                <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  automatisé par l&apos;IA
                </span>
              </h2>
              <p className="max-w-lg text-lg text-slate-300/90">
                20 minutes par semaine, zéro expertise, des clients en plus.
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-200/90">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-fuchsia-300" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4">
              {stats.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <stat.Icon className="h-4 w-4 text-fuchsia-300" />
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
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
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="h-4 w-4 text-orange-300" />
              <span>Planning auto</span>
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
            <h2 className="text-2xl font-bold text-white lg:text-3xl">Bon retour !</h2>
            <p className="text-slate-400">Connectez-vous pour accéder à votre espace marketing.</p>
          </div>

          {/* OAuth Buttons */}
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth('Facebook')}
              disabled={!!oauthLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#1877F2]/30 bg-[#1877F2]/10 font-medium text-white transition-all hover:bg-[#1877F2]/20 disabled:opacity-50"
            >
              {oauthLoading === 'Facebook' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <FacebookIcon />
                  <span>Continuer avec Facebook</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('Instagram')}
              disabled={!!oauthLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 font-medium text-white transition-all hover:from-purple-500/20 hover:to-pink-500/20 disabled:opacity-50"
            >
              {oauthLoading === 'Instagram' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <InstagramIcon />
                  <span>Continuer avec Instagram</span>
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

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Identifiant
              </label>
              <input
                id="email"
                type="text"
                placeholder="admin"
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 text-white placeholder:text-slate-500 transition-all focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300" htmlFor="password">
                  Mot de passe
                </label>
                <Link href="/marketing/forgot-password" className="text-xs text-fuchsia-300 transition-colors hover:text-fuchsia-200">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 pr-12 text-white placeholder:text-slate-500 transition-all focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900/50 text-fuchsia-500 focus:ring-fuchsia-500/20"
              />
              <label htmlFor="remember" className="text-sm text-slate-400">
                Se souvenir de moi
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-fuchsia-400 hover:to-orange-400 hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Create account link */}
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-slate-400">Pas encore de compte ?</p>
            <Link
              href="/register"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/30 font-medium text-white transition-all hover:border-slate-600/50 hover:bg-slate-800/50"
            >
              <span>Créer un compte gratuit</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <Link href="/marketing/mentions-legales" className="transition-colors hover:text-slate-400">Mentions légales</Link>
              <Link href="/marketing/confidentialite" className="transition-colors hover:text-slate-400">Confidentialité</Link>
              <Link href="/marketing/cgu" className="transition-colors hover:text-slate-400">CGU</Link>
            </div>
            <p className="mt-4 text-center text-xs text-slate-600">© 2026 Quelyos. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
