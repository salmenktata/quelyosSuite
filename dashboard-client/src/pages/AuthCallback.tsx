import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDefaultModulePath } from '../lib/defaultModule'

/**
 * Auth callback page for SSO handoff from vitrine (localhost:3000)
 * Receives session params via URL and stores them in localStorage
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const uid = searchParams.get('uid')
    const name = searchParams.get('name')
    const from = searchParams.get('from') // 'finance' or 'marketing'

    if (sessionId && uid) {
      // Store session info for the dashboard
      localStorage.setItem('session_id', sessionId)
      localStorage.setItem('user', JSON.stringify({
        id: parseInt(uid, 10),
        name: name || 'Utilisateur',
        email: '',
      }))
      localStorage.setItem('auth_source', from || 'unknown')

      // Redirect to default module
      const defaultPath = getDefaultModulePath()
      navigate(defaultPath, { replace: true })
    } else {
      // No valid session, redirect to login
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Connexion en cours...</p>
      </div>
    </div>
  )
}
