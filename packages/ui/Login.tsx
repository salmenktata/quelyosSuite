/**
 * Login Component - Generic login page for all SaaS
 * 
 * Usage:
 *   import { Login } from '@quelyos/ui'
 *   import { useAuth } from '@/lib/[module]/compat/auth'
 *   import { branding } from '@/config/branding'
 *   
 *   <Login useAuth={useAuth} branding={branding} />
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface Branding {
  name: string
  shortName: string
  description: string
  color: string
}

interface UseAuthHook {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

interface LoginProps {
  useAuth: () => UseAuthHook
  branding: Branding
}

export function Login({ useAuth, branding }: LoginProps) {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.success) {
      navigate('/', { replace: true })
    } else {
      setError(result.error || 'Identifiants invalides')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div
            className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: branding.color }}
          >
            {branding.shortName.charAt(0)}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {branding.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {branding.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email ou Login
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1"
              style={{
                borderColor: error ? undefined : undefined,
                ['--tw-ring-color' as string]: branding.color
              }}
              placeholder="email@example.com ou login"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1"
              style={{
                ['--tw-ring-color' as string]: branding.color
              }}
              placeholder="Mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: branding.color }}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
