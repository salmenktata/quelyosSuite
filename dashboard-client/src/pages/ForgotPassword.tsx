import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { logger } from '@quelyos/logger'

// Icônes inline
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const Mail = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Key = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // TODO: Implémenter l'envoi d'email de reset
      // const result = await api.resetPassword(email)

      // Simulation pour le moment
      await new Promise(resolve => setTimeout(resolve, 1500))

      logger.info('Password reset requested for:', email)
      setSuccess(true)
    } catch (_err) {
      logger.error('Reset password error:', err)
      setError('Impossible d\'envoyer l\'email. Vérifiez l\'adresse.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { Icon: Key, text: 'Lien sécurisé unique' },
    { Icon: Clock, text: 'Expire après 24h' },
    { Icon: Lock, text: 'Chiffrement end-to-end' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche - Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-gray-950 via-fuchsia-950 to-orange-950 lg:flex lg:w-1/2 xl:w-[55%]">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-fuchsia-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] animate-pulse rounded-full bg-orange-500/20 blur-[100px] delay-1000" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">
          {/* Logo & Brand */}
          <div className="flex items-start justify-between">
            <Link to="/login" className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-500 shadow-lg shadow-orange-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Quelyos</h1>
                <p className="text-xs uppercase tracking-widest text-fuchsia-200/80">Backoffice</p>
              </div>
            </Link>
            <Link to="/login" className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xl:inline">Retour</span>
            </Link>
          </div>

          {/* Main content */}
          <div className="my-auto space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/20 px-3 py-1.5 text-xs font-medium text-fuchsia-300 backdrop-blur-sm">
                <Shield className="h-3.5 w-3.5" />
                <span>Réinitialisation sécurisée</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                Récupération de
                <br />
                <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
                  votre compte
                </span>
              </h2>
              <p className="max-w-lg text-lg text-slate-300/90">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-200/90">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20">
                    <feature.Icon className="h-3.5 w-3.5 text-fuchsia-300" />
                  </div>
                  {feature.text}
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20">
                  <Mail className="h-4 w-4 text-fuchsia-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Vérifiez votre boîte mail</p>
                  <p className="text-xs text-slate-400">
                    Le lien de réinitialisation sera envoyé à l&apos;adresse email associée à votre compte.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-4 w-4 text-fuchsia-300" />
              <span>Sécurisé SSL</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lock className="h-4 w-4 text-orange-300" />
              <span>Chiffrement AES-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="relative flex w-full flex-col justify-center bg-gray-950 lg:w-1/2 xl:w-[45%]">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-fuchsia-500/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-orange-500/20 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-6 py-12 lg:px-12">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/login" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-500 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Quelyos</span>
            </Link>
            <Link to="/login" className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-bold text-white lg:text-3xl">
              {success ? 'Email envoyé !' : 'Mot de passe oublié ?'}
            </h2>
            <p className="text-slate-400">
              {success
                ? "Consultez votre boîte mail pour réinitialiser votre mot de passe."
                : "Pas de problème, nous allons vous aider à le récupérer."}
            </p>
          </div>

          {success ? (
            /* Success State */
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-fuchsia-500/20">
                  <CheckCircle2 className="h-10 w-10 text-fuchsia-400" />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-fuchsia-300" />
                  <p className="font-medium text-white">Email envoyé à</p>
                </div>
                <p className="text-sm text-fuchsia-200">{email}</p>
                <p className="text-xs text-slate-400">
                  Si vous ne recevez pas l&apos;email dans quelques minutes, vérifiez votre dossier spam.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-fuchsia-400 hover:to-orange-400 hover:shadow-orange-500/40"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span>Retour à la connexion</span>
                </Link>

                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="w-full text-sm text-slate-400 transition-colors hover:text-slate-300"
                >
                  Renvoyer l&apos;email
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-fuchsia-400 hover:to-orange-400 hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Envoyer le lien de réinitialisation</span>
                  </>
                )}
              </button>

              {/* Back to login */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Retour à la connexion</span>
                </Link>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <p className="text-center text-xs text-slate-600">
              © 2026 Quelyos. Backoffice sécurisé.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
