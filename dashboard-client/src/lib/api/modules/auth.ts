/**
 * Module Auth - Authentification et gestion session
 */

import type { APIResponse, LoginResponse, SessionResponse } from '@/types'
import type { Customer } from '@/types'
import { logger } from '@quelyos/logger'
import { tokenService } from '../../tokenService'

interface JWTLoginResponse {
  success: boolean
  access_token?: string
  expires_in?: number
  user?: {
    id: number
    name: string
    login: string
    email?: string
    groups?: string[]
    tenant_id?: number
    tenant_domain?: string
  }
  error?: string
  requires_2fa?: boolean
  pending_token?: string
}

/**
 * Login avec JWT Bearer
 */
export async function login(baseUrl: string, email: string, password: string): Promise<LoginResponse> {
  logger.debug('[API] login() called with email:', email)

  const url = `${baseUrl}/api/auth/sso-login`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ login: email, password }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = (await response.json()) as JWTLoginResponse
  logger.debug('[API] login() result:', result)

  // 2FA requis
  if (result.requires_2fa && result.pending_token) {
    logger.debug('[API] Login requires 2FA')
    return {
      success: true,
      requires_2fa: true,
      pending_token: result.pending_token,
    } as LoginResponse & { requires_2fa: boolean; pending_token: string }
  }

  if (result.success && result.access_token && result.user) {
    logger.debug('[API] Login successful, storing JWT tokens')

    tokenService.setTokens(result.access_token, result.expires_in || 900, result.user)

    logger.debug('[API] JWT stored, user:', result.user.name)

    return {
      success: true,
      authenticated: true,
      session_id: result.access_token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email || result.user.login,
        login: result.user.login,
        groups: result.user.groups || [],
      },
    } as LoginResponse
  } else {
    logger.warn('[API] Login failed:', result.error)
    return {
      success: false,
      error: result.error || 'Identifiants invalides',
    } as LoginResponse
  }
}

/**
 * Vérifie le code TOTP 2FA et complète le login
 */
export async function verify2FA(baseUrl: string, pendingToken: string, code: string): Promise<LoginResponse> {
  const url = `${baseUrl}/api/auth/2fa/verify`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ pending_token: pendingToken, code }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = (await response.json()) as JWTLoginResponse

  if (result.success && result.access_token && result.user) {
    tokenService.setTokens(result.access_token, result.expires_in || 900, result.user)

    return {
      success: true,
      authenticated: true,
      session_id: result.access_token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email || result.user.login,
        login: result.user.login,
        groups: result.user.groups || [],
      },
    } as LoginResponse
  }

  return {
    success: false,
    error: result.error || 'Code invalide',
  } as LoginResponse
}

/**
 * Rafraîchit le token JWT
 */
export async function refreshToken(baseUrl: string): Promise<boolean> {
  try {
    logger.info('[API] Refreshing JWT token...')

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!response.ok) {
      logger.warn('[API] Refresh failed with status:', response.status)
      return false
    }

    const result = (await response.json()) as JWTLoginResponse

    if (result.success && result.access_token && result.user) {
      tokenService.setTokens(result.access_token, result.expires_in || 900, result.user)
      logger.info('[API] JWT token refreshed successfully')
      return true
    }

    logger.warn('[API] Refresh failed:', result.error)
    return false
  } catch (error) {
    logger.error('[API] Refresh error:', error)
    return false
  }
}

/**
 * Récupère les infos utilisateur
 */
export async function getUserInfo(baseUrl: string): Promise<APIResponse<{ user: { id: number; name: string; email: string; login: string; groups: string[] } }>> {
  const accessToken = tokenService.getAccessToken()
  if (!accessToken) {
    return { success: false, error: 'Non authentifié' } as APIResponse<{ user: { id: number; name: string; email: string; login: string; groups: string[] } }>
  }

  const url = `${baseUrl}/api/auth/me`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

/**
 * Déconnexion
 */
export async function logout(baseUrl: string): Promise<APIResponse> {
  try {
    const accessToken = tokenService.getAccessToken()
    if (accessToken) {
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
    }
  } catch (error) {
    logger.error('[API] Logout error:', error)
  } finally {
    tokenService.clear()
  }
  return { success: true }
}

/**
 * Vérifie la session
 */
export async function checkSession(baseUrl: string): Promise<SessionResponse> {
  if (!tokenService.isAuthenticated()) {
    return { success: false, is_authenticated: false }
  }

  try {
    const userInfo = await getUserInfo(baseUrl)
    if (userInfo.success && userInfo.data?.user) {
      return {
        success: true,
        is_authenticated: true,
        user: userInfo.data.user,
      }
    }
    return { success: false, is_authenticated: false }
  } catch {
    return { success: false, is_authenticated: false }
  }
}

/**
 * Créer un compte client
 */
export async function register(
  requestFn: <T>(endpoint: string, data?: unknown) => Promise<T>,
  data: { name: string; email: string; password: string; phone?: string }
): Promise<APIResponse<{ user: Customer }>> {
  return requestFn<APIResponse<{ user: Customer }>>('/api/ecommerce/auth/register', data)
}
