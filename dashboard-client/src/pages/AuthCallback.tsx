import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { tokenService } from '../lib/tokenService'
import { getDefaultModulePath } from '../lib/defaultModule'

/**
 * Auth callback page for SSO handoff from vitrine (localhost:3000)
 * Receives JWT token via URL params and stores via tokenService
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('access_token') || searchParams.get('session_id')
    const expiresIn = searchParams.get('expires_in')
    const uid = searchParams.get('uid')
    const name = searchParams.get('name')

    if (accessToken && uid) {
      // Store via tokenService
      tokenService.setTokens(
        accessToken,
        expiresIn ? parseInt(expiresIn, 10) : 900,
        {
          id: parseInt(uid, 10),
          name: name || 'Utilisateur',
          login: '',
        }
      )

      const defaultPath = getDefaultModulePath()
      navigate(defaultPath, { replace: true })
    } else {
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
