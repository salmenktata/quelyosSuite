/**
 * Hook d'authentification avec JWT Bearer
 *
 * Gère :
 * - Authentification via JWT access token
 * - Refresh automatique avec rotation
 * - Logout
 * - Informations utilisateur
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { gateway } from '@/lib/api/gateway'
import { tokenService } from '@/lib/tokenService'
import { useAnalytics } from './useAnalytics'
import { logger } from '@/lib/logger'

interface User {
  id: number
  name: string
  email: string
  login: string
  tenant_id?: number
  tenant_domain?: string
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  error: string | null
  requires2FA: boolean
  pendingToken: string | null
}

interface LoginResponse {
  success: boolean
  access_token?: string
  expires_in?: number
  user?: User
  error?: string
  requires_2fa?: boolean
  pending_token?: string
}

interface RefreshResponse {
  success: boolean
  access_token?: string
  expires_in?: number
  user?: User
  error?: string
}

interface MeResponse {
  success: boolean
  user?: User
  claims?: {
    tenant_id?: number
    tenant_domain?: string
    exp?: number
  }
  error?: string
}

export function useAuth() {
  const navigate = useNavigate()
  const { identifyUser, resetUser, trackEvent } = useAnalytics()
  const initialized = useRef(false)

  // Initialiser depuis tokenService
  const [authState, setAuthState] = useState<AuthState>(() => {
    const isAuthenticated = tokenService.isAuthenticated()
    const storedUser = tokenService.getUser()

    return {
      isAuthenticated,
      isLoading: !isAuthenticated, // Si déjà auth, pas besoin de charger
      user: storedUser ? {
        id: storedUser.id,
        name: '',
        email: '',
        login: storedUser.login,
        tenant_id: storedUser.tenantId,
        tenant_domain: storedUser.tenantDomain,
      } : null,
      error: null,
      requires2FA: false,
      pendingToken: null,
    }
  })

  /**
   * Vérifie l'authentification via /api/auth/me (JWT Bearer)
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    // Si pas de token, pas la peine de vérifier
    if (!tokenService.isAuthenticated()) {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      }))
      return false
    }

    try {
      const response = await gateway.get<MeResponse>('/api/auth/me')

      if (response.success && response.user) {
        const user: User = {
          ...response.user,
          tenant_id: response.claims?.tenant_id,
          tenant_domain: response.claims?.tenant_domain,
        }

        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          user,
          error: null,
        }))

        // Identifier dans Posthog
        identifyUser(response.user.id, {
          name: response.user.name,
          email: response.user.email,
          login: response.user.login,
        })

        return true
      }

      // Token invalide
      tokenService.clear()
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: response.error || 'Non authentifié',
      }))
      return false

    } catch (error) {
      logger.error('[Auth] checkAuth error:', error)
      tokenService.clear()
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Erreur',
      }))
      return false
    }
  }, [identifyUser])

  /**
   * Rafraîchit les tokens via /api/auth/refresh
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('[Auth] Refreshing tokens...')

      const response = await gateway.post<RefreshResponse>('/api/auth/refresh', {})

      if (response.success && response.access_token && response.user) {
        // Stocker les nouveaux tokens
        tokenService.setTokens(
          response.access_token,
          response.expires_in || 900,
          response.user
        )

        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: true,
          user: response.user!,
          error: null,
        }))

        logger.info('[Auth] Tokens refreshed successfully')
        return true
      }

      // Refresh failed
      logger.warn('[Auth] Token refresh failed:', response.error)
      tokenService.clear()
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: response.error || 'Session expirée',
      }))
      return false

    } catch (error) {
      logger.error('[Auth] Token refresh error:', error)
      tokenService.clear()
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Erreur de refresh',
      }))
      return false
    }
  }, [])

  /**
   * Login avec credentials
   */
  const loginWithCredentials = useCallback(async (
    login: string,
    password: string
  ): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await gateway.post<LoginResponse>('/api/auth/sso-login', {
        login,
        password,
      })

      // 2FA requis — stocker pending_token et signaler
      if (response.requires_2fa && response.pending_token) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          requires2FA: true,
          pendingToken: response.pending_token!,
          error: null,
        }))
        return { success: true, requires2FA: true }
      }

      if (response.success && response.access_token && response.user) {
        // Stocker les tokens
        tokenService.setTokens(
          response.access_token,
          response.expires_in || 900,
          response.user
        )

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user,
          error: null,
          requires2FA: false,
          pendingToken: null,
        })

        // Identifier dans Posthog
        identifyUser(response.user.id, {
          name: response.user.name,
          email: response.user.email,
          login: response.user.login,
        })

        trackEvent('login', { method: 'credentials' })
        return { success: true }
      }

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: response.error || 'Identifiants invalides',
      }))
      return { success: false, error: response.error }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion'
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }))
      return { success: false, error: message }
    }
  }, [identifyUser, trackEvent])

  /**
   * Vérifie le code TOTP 2FA
   */
  const verify2FA = useCallback(async (
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await gateway.post<LoginResponse>('/api/auth/2fa/verify', {
        pending_token: authState.pendingToken,
        code,
      })

      if (response.success && response.access_token && response.user) {
        tokenService.setTokens(
          response.access_token,
          response.expires_in || 900,
          response.user
        )

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user,
          error: null,
          requires2FA: false,
          pendingToken: null,
        })

        identifyUser(response.user.id, {
          name: response.user.name,
          email: response.user.email,
          login: response.user.login,
        })

        trackEvent('login', { method: '2fa' })
        return { success: true }
      }

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: response.error || 'Code invalide',
      }))
      return { success: false, error: response.error || 'Code invalide' }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de vérification'
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }))
      return { success: false, error: message }
    }
  }, [authState.pendingToken, identifyUser, trackEvent])

  /**
   * Annule le flow 2FA
   */
  const cancel2FA = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      requires2FA: false,
      pendingToken: null,
    })
  }, [])

  /**
   * Déconnecte l'utilisateur
   */
  const logout = useCallback(async () => {
    try {
      await gateway.post('/api/auth/logout', {})
      trackEvent('logout')
    } catch (error) {
      logger.error('[Auth] Logout error:', error)
    } finally {
      tokenService.clear()
      resetUser()
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        requires2FA: false,
        pendingToken: null,
      })
      navigate('/login', { replace: true })
    }
  }, [navigate, trackEvent, resetUser])

  /**
   * Configuration initiale
   */
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Connecter la fonction de refresh au tokenService
    tokenService.setRefreshFunction(refreshToken)

    // Écouter les événements du tokenService
    const unsubscribe = tokenService.subscribe((event) => {
      if (event === 'expired') {
        logger.warn('[Auth] Token expired, redirecting to login')
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'Session expirée',
          requires2FA: false,
          pendingToken: null,
        })
        navigate('/login', { replace: true })
      }
    })

    // Vérifier l'auth si on a un token
    if (tokenService.isAuthenticated()) {
      checkAuth()
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }

    return unsubscribe
  }, [checkAuth, refreshToken, navigate])

  return {
    ...authState,
    checkAuth,
    refreshToken,
    logout,
    login: loginWithCredentials,
    verify2FA,
    cancel2FA,
  }
}
