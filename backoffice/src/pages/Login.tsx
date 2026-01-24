import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Input, Button } from '../components/common'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Rediriger si déjà connecté (seulement en production)
  useEffect(() => {
    // En mode DEV, ne pas rediriger automatiquement car l'auth est désactivée
    if (import.meta.env.DEV) {
      return
    }

    const sessionId = localStorage.getItem('session_id')
    const user = localStorage.getItem('user')

    if (sessionId && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('========== LOGIN SUBMIT ==========')
    console.log('Email:', email)
    console.log('Password length:', password.length)

    try {
      console.log('Calling api.login...')
      const result = await api.login(email, password)
      console.log('Login result:', result)

      if (result.success) {
        console.log('Login successful, navigating to /dashboard')
        console.log('localStorage session_id:', localStorage.getItem('session_id'))
        console.log('localStorage user:', localStorage.getItem('user'))
        navigate('/dashboard')
      } else {
        console.log('Login failed:', result.error)
        setError(result.error || 'Échec de la connexion')
      }
    } catch (err) {
      console.error('Login exception:', err)
      setError('Erreur de connexion. Vérifiez vos identifiants.')
    } finally {
      setLoading(false)
      console.log('========== LOGIN END ==========')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Quelyos</h1>
            <p className="text-gray-600 dark:text-gray-400">Backoffice - Connexion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email ou Login"
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="admin"
            />

            <Input
              label="Mot de passe"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Se souvenir de moi</span>
              </label>
              <a href="#" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                Mot de passe oublié ?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version 0.0.1 - En développement
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Identifiants par défaut : admin / admin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
