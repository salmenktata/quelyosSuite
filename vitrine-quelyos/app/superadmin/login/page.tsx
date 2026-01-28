'use client';

import { FormEvent, useState, Suspense } from 'react';
import Link from 'next/link';

const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Mail = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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

const AlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const Loader = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const Fingerprint = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
  </svg>
);

function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Loader className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading] = useState(false);

  function handlePasskeyLogin() {
    // Redirect via proxy to hide backend URL
    window.location.href = '/api/backend-passkey-redirect';
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use proxy API to authenticate against backend (avoids CORS)
      const response = await fetch('/api/backend-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Identifiants invalides');
        return;
      }

      // Redirect via proxy SSO endpoint (hides backend URL)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/backend-sso-redirect';

      const loginInput = document.createElement('input');
      loginInput.type = 'hidden';
      loginInput.name = 'login';
      loginInput.value = email;
      form.appendChild(loginInput);

      const passwordInput = document.createElement('input');
      passwordInput.type = 'hidden';
      passwordInput.name = 'password';
      passwordInput.value = password;
      form.appendChild(passwordInput);

      const dbInput = document.createElement('input');
      dbInput.type = 'hidden';
      dbInput.name = 'db';
      dbInput.value = 'quelyos';
      form.appendChild(dbInput);

      document.body.appendChild(form);
      form.submit();
    } catch {
      setError('Impossible de se connecter. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-slate-500/5 blur-[120px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        {/* Logo */}
        <Link href="/" className="mb-12 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-slate-700 shadow-lg shadow-violet-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Super Admin</span>
        </Link>

        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-bold text-white lg:text-3xl">Accès administrateur</h1>
          <p className="text-slate-400">
            Connectez-vous pour accéder au panneau de gestion.
          </p>
        </div>

        {/* Warning */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Accès restreint aux administrateurs autorisés uniquement.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="login">
              Identifiant
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                id="login"
                type="text"
                placeholder="admin"
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 pl-12 pr-4 text-white placeholder:text-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 pl-12 pr-12 text-white placeholder:text-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
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
            disabled={loading || passkeyLoading}
            className="relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-slate-700 font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Vérification...</span>
              </span>
            ) : (
              'Accéder au panneau'
            )}
          </button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-950 px-3 text-slate-500">ou</span>
            </div>
          </div>

          {/* Passkey button */}
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={loading || passkeyLoading}
            className="relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50 font-medium text-slate-300 transition-all hover:border-violet-500/50 hover:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passkeyLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Authentification...</span>
              </span>
            ) : (
              <>
                <Fingerprint className="h-5 w-5" />
                <span>Utiliser un Passkey</span>
              </>
            )}
          </button>
        </form>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <p className="text-center text-xs text-slate-600">
            Accès sécurisé - Toutes les connexions sont enregistrées
          </p>
          <p className="mt-2 text-center text-xs text-slate-700">
            © 2025 Quelyos. Panneau d&apos;administration.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
