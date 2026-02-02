/**
 * Token Service - Gestion JWT pour Dashboard
 *
 * Gère :
 * - Stockage sécurisé des tokens (memory + localStorage backup)
 * - Vérification d'expiration
 * - Refresh automatique avant expiration
 * - Événements d'auth (login, logout, expired)
 */

import { logger } from '@quelyos/logger'

// Types
interface TokenPayload {
  uid: number
  login: string
  tenant_id?: number
  tenant_domain?: string
  exp: number
  iat: number
}

interface TokenState {
  accessToken: string | null
  expiresAt: number | null // timestamp en ms
  user: {
    id: number
    login: string
    name?: string
    email?: string
    groups?: string[]
    permissions?: {
      modules: Record<string, { level: string; pages: Record<string, string> }>
      is_manager: boolean
    }
    tenantId?: number
    tenantDomain?: string
  } | null
}

type AuthEventType = 'login' | 'logout' | 'expired' | 'refreshed'
type AuthEventListener = (event: AuthEventType, data?: unknown) => void

// Constants
const STORAGE_KEY = 'quelyos_dashboard_auth'
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000 // Refresh 2 min avant expiration

class TokenService {
  private state: TokenState = {
    accessToken: null,
    expiresAt: null,
    user: null,
  }

  private refreshTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<AuthEventListener> = new Set()
  private refreshPromise: Promise<boolean> | null = null

  constructor() {
    this.loadFromStorage()
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Stocke les tokens après login
   */
  setTokens(
    accessToken: string,
    expiresIn: number,
    user?: {
      id: number
      name: string
      login: string
      email?: string
      groups?: string[]
      permissions?: {
        modules: Record<string, { level: string; pages: Record<string, string> }>
        is_manager: boolean
      }
      tenant_id?: number
      tenant_domain?: string
    }
  ) {
    const payload = this.decodeToken(accessToken)
    if (!payload) {
      logger.error('[TokenService] Invalid access token')
      return
    }

    const expiresAt = Date.now() + expiresIn * 1000

    this.state = {
      accessToken,
      expiresAt,
      user: user
        ? {
            id: user.id,
            login: user.login,
            name: user.name,
            email: user.email,
            groups: user.groups,
            permissions: user.permissions,
            tenantId: user.tenant_id,
            tenantDomain: user.tenant_domain,
          }
        : {
            id: payload.uid,
            login: payload.login,
            tenantId: payload.tenant_id,
            tenantDomain: payload.tenant_domain,
          },
    }

    this.saveToStorage()
    this.scheduleRefresh()
    this.emit('login', this.state.user)

    logger.info('[TokenService] Tokens stored, expires at', new Date(expiresAt).toISOString())
  }

  /**
   * Retourne le token d'accès actuel
   */
  getAccessToken(): string | null {
    if (!this.state.accessToken) return null

    // Vérifier expiration
    if (this.isExpired()) {
      logger.warn('[TokenService] Token expired')
      this.clear()
      this.emit('expired')
      return null
    }

    return this.state.accessToken
  }

  /**
   * Retourne les infos utilisateur
   */
  getUser() {
    return this.state.user
  }

  /**
   * Vérifie si authentifié (token valide et non expiré)
   */
  isAuthenticated(): boolean {
    return !!this.state.accessToken && !this.isExpired()
  }

  /**
   * Vérifie si le token est expiré
   */
  isExpired(): boolean {
    if (!this.state.expiresAt) return true
    return Date.now() >= this.state.expiresAt
  }

  /**
   * Retourne le temps restant avant expiration (en secondes)
   */
  getTimeRemaining(): number {
    if (!this.state.expiresAt) return 0
    const remaining = Math.floor((this.state.expiresAt - Date.now()) / 1000)
    return Math.max(0, remaining)
  }

  /**
   * Vérifie si un refresh est nécessaire bientôt
   */
  needsRefresh(): boolean {
    if (!this.state.expiresAt) return false
    return Date.now() >= this.state.expiresAt - REFRESH_THRESHOLD_MS
  }

  /**
   * Efface les tokens (logout)
   */
  clear() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    this.state = {
      accessToken: null,
      expiresAt: null,
      user: null,
    }

    this.removeFromStorage()
    this.emit('logout')

    logger.info('[TokenService] Tokens cleared')
  }

  /**
   * Enregistre un listener d'événements auth
   */
  subscribe(listener: AuthEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Définit la fonction de refresh (appelée par useAuth)
   */
  private refreshFn: (() => Promise<boolean>) | null = null

  setRefreshFunction(fn: () => Promise<boolean>) {
    this.refreshFn = fn
  }

  /**
   * Force un refresh du token
   */
  async refresh(): Promise<boolean> {
    // Éviter les refreshs concurrents
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    if (!this.refreshFn) {
      logger.warn('[TokenService] No refresh function set')
      return false
    }

    this.refreshPromise = this.refreshFn()
      .then((success) => {
        if (success) {
          this.emit('refreshed')
        }
        return success
      })
      .finally(() => {
        this.refreshPromise = null
      })

    return this.refreshPromise
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private emit(event: AuthEventType, data?: unknown) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data)
      } catch (e) {
        logger.error('[TokenService] Listener error', e)
      }
    })
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const payload = JSON.parse(atob(parts[1]))
      return payload as TokenPayload
    } catch {
      return null
    }
  }

  private scheduleRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    if (!this.state.expiresAt) return

    const refreshAt = this.state.expiresAt - REFRESH_THRESHOLD_MS
    const delay = Math.max(0, refreshAt - Date.now())

    if (delay > 0) {
      this.refreshTimer = setTimeout(() => {
        logger.info('[TokenService] Auto-refresh triggered')
        this.refresh()
      }, delay)

      logger.debug('[TokenService] Refresh scheduled in', Math.floor(delay / 1000), 'seconds')
    }
  }

  private saveToStorage() {
    try {
      const data = {
        accessToken: this.state.accessToken,
        expiresAt: this.state.expiresAt,
        user: this.state.user,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      logger.warn('[TokenService] Failed to save to storage', e)
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const data = JSON.parse(stored)

      // Vérifier si le token n'est pas expiré
      if (data.expiresAt && data.expiresAt > Date.now()) {
        this.state = {
          accessToken: data.accessToken,
          expiresAt: data.expiresAt,
          user: data.user,
        }
        this.scheduleRefresh()
        logger.info('[TokenService] Restored from storage')
      } else {
        this.removeFromStorage()
      }
    } catch (e) {
      logger.warn('[TokenService] Failed to load from storage', e)
      this.removeFromStorage()
    }
  }

  private removeFromStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      // Nettoyer aussi les anciennes clés legacy
      localStorage.removeItem('session_id')
      localStorage.removeItem('backend_session_token')
      localStorage.removeItem('user')
      localStorage.removeItem('tenant_id')
    } catch {
      // Ignore
    }
  }
}

// Singleton export
export const tokenService = new TokenService()
