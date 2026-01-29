/**
 * Hook d'authentification avec gestion des cookies HttpOnly
 *
 * Gère :
 * - Vérification de l'authentification
 * - Refresh automatique du token de session
 * - Logout
 * - Informations utilisateur
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { gateway } from '@/lib/api'
import { useAnalytics } from './useAnalytics'

interface User {
  id: number
  name: string
  email: string
  login: string
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  error: string | null
}

const AUTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000 // 5 minutes avant expiration

export function useAuth() {
  const navigate = useNavigate()
  const { identifyUser, resetUser, trackEvent } = useAnalytics()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  })

  /**
   * Vérifie l'authentification via l'endpoint /api/auth/user-info
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await gateway.post<{ success: boolean; user?: User; error?: string }>(
        '/api/auth/user-info',
        {}
      )

      if (response.success && response.user) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user,
          error: null,
        })
        // Identifier l'utilisateur dans Posthog
        identifyUser(response.user.id, {
          name: response.user.name,
          email: response.user.email,
          login: response.user.login,
        })
        return true
      }

      // Non authentifié
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: response.error || 'Non authentifié',
      })
      return false
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Erreur d\'authentification',
      })
      return false
    }
  }, [])

  /**
   * Rafraîchit le token de session via /api/auth/refresh
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await gateway.post<{ success: boolean; user?: User; error?: string }>(
        '/api/auth/refresh',
        {}
      )

      if (response.success && response.user) {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: true,
          user: response.user!,
          error: null,
        }))
        return true
      }

      // Refresh failed → logout
      console.warn('[Auth] Token refresh failed, logging out')
      await logout()
      return false
    } catch (error) {
      console.error('[Auth] Token refresh error:', error)
      await logout()
      return false
    }
  }, [])

  /**
   * Déconnecte l'utilisateur
   */
  const logout = useCallback(async () => {
    try {
      await gateway.post('/api/auth/logout', {})
      trackEvent('logout')
    } catch (error) {
      console.error('[Auth] Logout error:', error)
    } finally {
      // Reset Posthog user
      resetUser()
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      })
      navigate('/login', { replace: true })
    }
  }, [navigate, trackEvent, resetUser])

  /**
   * Login manuel (si besoin de forcer un check)
   */
  const login = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))
    const authenticated = await checkAuth()
    return authenticated
  }, [checkAuth])

  /**
   * Vérifie l'auth au montage du composant
   */
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  /**
   * Vérifie périodiquement l'authentification et refresh si nécessaire
   */
  useEffect(() => {
    if (!authState.isAuthenticated) return

    // Vérifier toutes les 5 minutes
    const checkInterval = setInterval(() => {
      checkAuth()
    }, AUTH_CHECK_INTERVAL)

    // Refresh préventif toutes les 25 minutes (session expire dans 30min)
    const refreshInterval = setInterval(() => {
      refreshToken()
    }, 25 * 60 * 1000)

    return () => {
      clearInterval(checkInterval)
      clearInterval(refreshInterval)
    }
  }, [authState.isAuthenticated, checkAuth, refreshToken])

  return {
    ...authState,
    checkAuth,
    refreshToken,
    logout,
    login,
  }
}
