import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react'

function TOTPInput({ onSubmit, loading, error }: {
  onSubmit: (code: string) => void
  loading: boolean
  error: string
}) {
  const [code, setCode] = useState('')
  const [isBackupMode, setIsBackupMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [isBackupMode])

  const handleChange = useCallback((value: string) => {
    if (isBackupMode) {
      // Format backup: XXXX-XXXX (lettres + chiffres + tiret)
      const cleaned = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
      setCode(cleaned)
      if (cleaned.length === 9 && cleaned.includes('-')) {
        onSubmit(cleaned)
      }
    } else {
      // TOTP: 6 chiffres uniquement
      const digits = value.replace(/\D/g, '').slice(0, 6)
      setCode(digits)
      if (digits.length === 6) {
        onSubmit(digits)
      }
    }
  }, [isBackupMode, onSubmit])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim()
    handleChange(pasted)
  }, [handleChange])

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isBackupMode ? 'Code de secours' : 'Vérification 2FA'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
          {isBackupMode
            ? 'Saisissez un code de secours (format XXXX-XXXX)'
            : 'Saisissez le code à 6 chiffres de votre application'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          onPaste={handlePaste}
          disabled={loading}
          autoComplete="one-time-code"
          inputMode={isBackupMode ? 'text' : 'numeric'}
          placeholder={isBackupMode ? 'XXXX-XXXX' : '000000'}
          className="w-full px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent disabled:opacity-50"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          Vérification...
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setCode('')
          setIsBackupMode(!isBackupMode)
        }}
        className="w-full flex items-center justify-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
      >
        <KeyRound className="w-4 h-4" />
        {isBackupMode ? 'Utiliser le code TOTP' : 'Utiliser un code de secours'}
      </button>
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const { login, verify2FA, cancel2FA, requires2FA, isLoading: authLoading, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)

      if (result.success && !result.requires2FA) {
        navigate('/', { replace: true })
      } else if (!result.success) {
        setError(result.error || 'Identifiants invalides')
      }
      // Si requires2FA, le state useAuth gère l'affichage
    } catch (_err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = useCallback(async (code: string) => {
    const result = await verify2FA(code)
    if (result.success) {
      navigate('/', { replace: true })
    }
  }, [verify2FA, navigate])

  const handleCancel2FA = useCallback(() => {
    cancel2FA()
    setError('')
  }, [cancel2FA])

  const isSubmitting = loading || authLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {requires2FA ? (
            <>
              <button
                onClick={handleCancel2FA}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <TOTPInput
                onSubmit={handleVerify2FA}
                loading={authLoading}
                error={authError || ''}
              />
            </>
          ) : (
            <>
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-4xl">✨</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quelyos Super Admin</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administration plateforme SaaS</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email ou Login
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                    placeholder="admin ou admin@quelyos.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
                Accès réservé aux super administrateurs
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
