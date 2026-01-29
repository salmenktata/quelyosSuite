/**
 * Client API pour Super Admin
 *
 * Gère les appels HTTP vers le backend avec gestion automatique des cookies.
 */

import { logger } from './logger'
import { config } from './config'

class ApiGateway {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  /**
   * Effectue une requête POST vers le backend
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      logger.debug('[API] POST', endpoint, { data })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Envoie automatiquement les cookies HttpOnly
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      })

      // Gérer les erreurs HTTP
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error('[API] HTTP Error', response.status, errorText)

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        } as T
      }

      // Parser la réponse JSON
      const result = await response.json()
      logger.debug('[API] Response', endpoint, result)

      return result
    } catch (error) {
      logger.error('[API] Request failed', endpoint, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      } as T
    }
  }

  /**
   * Effectue une requête GET vers le backend
   */
  async get<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      logger.debug('[API] GET', endpoint)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error('[API] HTTP Error', response.status, errorText)

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        } as T
      }

      const result = await response.json()
      logger.debug('[API] Response', endpoint, result)

      return result
    } catch (error) {
      logger.error('[API] Request failed', endpoint, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      } as T
    }
  }

  /**
   * Effectue une requête PUT vers le backend
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      logger.debug('[API] PUT', endpoint, { data })

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error('[API] HTTP Error', response.status, errorText)

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        } as T
      }

      const result = await response.json()
      logger.debug('[API] Response', endpoint, result)

      return result
    } catch (error) {
      logger.error('[API] Request failed', endpoint, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      } as T
    }
  }

  /**
   * Effectue une requête DELETE vers le backend
   */
  async delete<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      logger.debug('[API] DELETE', endpoint)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error('[API] HTTP Error', response.status, errorText)

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        } as T
      }

      const result = await response.json()
      logger.debug('[API] Response', endpoint, result)

      return result
    } catch (error) {
      logger.error('[API] Request failed', endpoint, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      } as T
    }
  }

  /**
   * Authentification utilisateur
   */
  async login(login: string, password: string): Promise<{
    success: boolean
    error?: string
    user?: { id: number; name: string; email: string; login: string }
  }> {
    logger.debug('[API] login() called with:', login)

    const response = await this.post<any>('/api/auth/sso-login', {
      jsonrpc: '2.0',
      method: 'call',
      params: { login, password },
      id: 1,
    })

    // Gérer format JSON-RPC ou JSON simple
    const result = response.result || response

    logger.debug('[API] login() result:', result)

    return result
  }
}

// Instance singleton du client API
export const gateway = new ApiGateway(config.apiUrl)
