import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ShieldCheck } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { gateway } from '@/lib/api'

export function Login() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { trackEvent } = useAnalytics()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugInfo({ status: 'Tentative de connexion...', timestamp: new Date().toISOString() })

    try {
      console.log('[LOGIN] Tentative avec:', { email, backend: import.meta.env.VITE_BACKEND_URL })
      setDebugInfo({ status: '⏳ Appel API en cours...', email, backend: import.meta.env.VITE_BACKEND_URL })

      const result = await gateway.login(email, password)

      console.log('[LOGIN] Résultat brut:', result)
      console.log('[LOGIN] Type:', typeof result, 'Success:', result?.success)
      setDebugInfo({ status: '📦 Réponse reçue', result, rawType: typeof result })

      // Vérifier que result existe
      if (!result) {
        console.error('[LOGIN] Result est null/undefined')
        setDebugInfo({ status: '⚠️ Résultat vide', result: 'null/undefined' })
        setError('Réponse vide du serveur')
        return
      }

      if (result.success === true) {
        console.log('[LOGIN] ✅ Authentification réussie')
        trackEvent('login_success', { login_method: 'password' })
        setDebugInfo({ status: '✅ Succès ! Redirection...', result, user: result.user })

        // Rediriger immédiatement (useAuth vérifiera l'auth au chargement)
        setTimeout(() => {
          console.log('[LOGIN] Navigation vers /')
          // Force reload pour que useAuth() se réinitialise
          window.location.href = '/'
        }, 1000)
      } else {
        console.log('[LOGIN] ❌ Authentification échouée')
        trackEvent('login_failed', { error: result.error })
        setError(result.error || 'Identifiants invalides ou accès refusé')
        setDebugInfo({ status: '❌ Échec authentification', result, error: result.error })
      }
    } catch (err) {
      console.error('[LOGIN] Exception capturée:', err)
      trackEvent('login_error', { error: 'network_error' })
      setError('Erreur de connexion au serveur')
      setDebugInfo({
        status: '💥 Exception',
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      })
    } finally {
      setLoading(false)
      console.log('[LOGIN] Fin du processus')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-10 h-10 text-white" />
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
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
            Accès réservé aux super administrateurs
          </p>

          {/* Panneau Debug */}
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700">
              <div className="text-xs font-mono">
                <div className="font-semibold text-gray-900 dark:text-white mb-2">🔍 Debug</div>
                <div className="space-y-1 text-gray-700 dark:text-gray-300">
                  <div><span className="font-semibold">Status:</span> {debugInfo.status}</div>
                  {debugInfo.email && <div><span className="font-semibold">Email:</span> {debugInfo.email}</div>}
                  {debugInfo.backend && <div><span className="font-semibold">Backend:</span> {debugInfo.backend}</div>}
                  {debugInfo.timestamp && <div><span className="font-semibold">Time:</span> {debugInfo.timestamp}</div>}
                  {debugInfo.result && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">Résultat API</summary>
                      <pre className="mt-2 p-2 bg-white dark:bg-gray-950 rounded overflow-auto max-h-60 text-xs">
                        {JSON.stringify(debugInfo.result, null, 2)}
                      </pre>
                    </details>
                  )}
                  {debugInfo.error && (
                    <div className="mt-2 text-red-600 dark:text-red-400">
                      <span className="font-semibold">Erreur:</span> {debugInfo.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
