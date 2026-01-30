/**
 * BaseApiClient - Classe de base pour tous les clients API
 *
 * Factorise la logique commune entre api.ts, api-base.ts et backend-rpc.ts :
 * - Gestion authentification (session_id)
 * - Fetch avec headers standardisés
 * - Error handling unifié
 * - Retry logic avec exponential backoff
 * - Circuit breaker integration
 * - Request/Response logging
 */

import { logger } from '@quelyos/logger'
import { backendCircuitBreaker } from './circuitBreaker'
import { withRetry, RETRY_CONFIGS, type RetryConfig } from './retry'
import { getRequestIdHeaders } from './requestId'

/**
 * Configuration du client API
 */
export interface ApiClientConfig {
  /** URL de base de l'API */
  baseUrl: string
  /** Headers par défaut */
  defaultHeaders?: Record<string, string>
  /** Timeout par défaut (ms) */
  timeout?: number
  /** Configuration retry */
  retryConfig?: Partial<RetryConfig>
  /** Utiliser le circuit breaker */
  useCircuitBreaker?: boolean
  /** Credentials mode */
  credentials?: RequestCredentials
}

/**
 * Options pour une requête
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Body de la requête (sera stringifié) */
  body?: unknown
  /** Query params */
  params?: Record<string, string | number | boolean | undefined>
  /** Désactiver retry pour cette requête */
  skipRetry?: boolean
  /** Désactiver circuit breaker pour cette requête */
  skipCircuitBreaker?: boolean
  /** Timeout spécifique pour cette requête */
  timeout?: number
}

/**
 * Erreur API standardisée
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: string,
    public requestUrl?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toString(): string {
    return `${this.name}: ${this.message} (${this.statusCode}) - ${this.requestUrl || 'unknown'}`
  }
}

/**
 * Classe de base pour clients API
 */
export class BaseApiClient {
  protected config: Required<ApiClientConfig>

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      defaultHeaders: config.defaultHeaders || {},
      timeout: config.timeout || 30000,
      retryConfig: config.retryConfig || RETRY_CONFIGS.api,
      useCircuitBreaker: config.useCircuitBreaker ?? true,
      credentials: config.credentials || 'omit',
    }
  }

  /**
   * Récupère le token d'authentification
   */
  protected getAuthToken(): string | null {
    // Priorité : session_id (nouveau) > backend_session_token (legacy)
    const sessionId = localStorage.getItem('session_id')
    if (sessionId && sessionId !== 'null' && sessionId !== 'undefined' && sessionId.trim() !== '') {
      return sessionId
    }

    const legacyToken = localStorage.getItem('backend_session_token')
    if (legacyToken && legacyToken !== 'null') {
      return legacyToken
    }

    return null
  }

  /**
   * Construit les headers de la requête
   */
  protected buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.defaultHeaders,
      ...getRequestIdHeaders(),
      ...customHeaders,
    }

    // Ajouter le token d'auth si disponible
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Construit l'URL complète avec query params
   */
  protected buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, this.config.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Gère les erreurs HTTP
   */
  protected async handleHttpError(response: Response, requestUrl: string): Promise<never> {
    const statusCode = response.status

    // Tentative de récupération du corps de la réponse
    let errorBody: string | undefined
    try {
      errorBody = await response.text()
    } catch {
      // Ignorer si impossible de lire le body
    }

    // Session expirée (401) - rediriger vers login
    if (statusCode === 401 && !import.meta.env.DEV) {
      this.handleSessionExpired()
    }

    const message = `HTTP ${statusCode}: ${response.statusText}`
    throw new ApiError(message, statusCode, errorBody, requestUrl)
  }

  /**
   * Gère l'expiration de session
   */
  protected handleSessionExpired(): void {
    logger.warn('[BaseApiClient] Session expired, redirecting to login')
    localStorage.removeItem('session_id')
    localStorage.removeItem('backend_session_token')
    localStorage.removeItem('user')

    if (!import.meta.env.DEV) {
      window.location.href = '/login'
    }
  }

  /**
   * Exécute une requête avec timeout
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(`Request timeout after ${timeout}ms`, 408, undefined, url)
      }
      throw error
    }
  }

  /**
   * Exécute une requête avec retry et circuit breaker
   */
  protected async executeRequest<T>(
    url: string,
    options: RequestInit,
    requestOptions: RequestOptions = {}
  ): Promise<T> {
    const timeout = requestOptions.timeout || this.config.timeout

    // Fonction de fetch
    const doFetch = async (): Promise<T> => {
      const response = await this.fetchWithTimeout(url, options, timeout)

      if (!response.ok) {
        await this.handleHttpError(response, url)
      }

      return response.json()
    }

    // Avec circuit breaker
    const executeWithCircuitBreaker = async (): Promise<T> => {
      if (requestOptions.skipCircuitBreaker || !this.config.useCircuitBreaker) {
        return doFetch()
      }
      return backendCircuitBreaker.execute(doFetch)
    }

    // Avec retry
    if (requestOptions.skipRetry) {
      return executeWithCircuitBreaker()
    }

    const retryResult = await withRetry(executeWithCircuitBreaker, this.config.retryConfig)

    if (retryResult.success && retryResult.data) {
      return retryResult.data
    }

    throw retryResult.error || new Error('Request failed after retries')
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params)
    const headers = this.buildHeaders(options.headers as Record<string, string>)

    logger.debug('[BaseApiClient] GET:', url)

    // Extraire uniquement les propriétés RequestInit compatibles
    const { body: _body, params: _params, skipRetry: _skipRetry, skipCircuitBreaker: _skipCircuitBreaker, timeout: _timeout, ...requestInit } = options

    return this.executeRequest<T>(url, {
      method: 'GET',
      headers,
      credentials: this.config.credentials,
      ...requestInit,
    }, options)
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params)
    const headers = this.buildHeaders(options.headers as Record<string, string>)

    logger.debug('[BaseApiClient] POST:', url, body)

    // Extraire uniquement les propriétés RequestInit compatibles
    const { body: _optionsBody, params: _params, skipRetry: _skipRetry, skipCircuitBreaker: _skipCircuitBreaker, timeout: _timeout, ...requestInit } = options

    return this.executeRequest<T>(url, {
      method: 'POST',
      headers,
      credentials: this.config.credentials,
      body: body ? JSON.stringify(body) : undefined,
      ...requestInit,
    }, options)
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params)
    const headers = this.buildHeaders(options.headers as Record<string, string>)

    logger.debug('[BaseApiClient] PUT:', url, body)

    // Extraire uniquement les propriétés RequestInit compatibles
    const { body: _optionsBody, params: _params, skipRetry: _skipRetry, skipCircuitBreaker: _skipCircuitBreaker, timeout: _timeout, ...requestInit } = options

    return this.executeRequest<T>(url, {
      method: 'PUT',
      headers,
      credentials: this.config.credentials,
      body: body ? JSON.stringify(body) : undefined,
      ...requestInit,
    }, options)
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params)
    const headers = this.buildHeaders(options.headers as Record<string, string>)

    logger.debug('[BaseApiClient] PATCH:', url, body)

    // Extraire uniquement les propriétés RequestInit compatibles
    const { body: _optionsBody, params: _params, skipRetry: _skipRetry, skipCircuitBreaker: _skipCircuitBreaker, timeout: _timeout, ...requestInit } = options

    return this.executeRequest<T>(url, {
      method: 'PATCH',
      headers,
      credentials: this.config.credentials,
      body: body ? JSON.stringify(body) : undefined,
      ...requestInit,
    }, options)
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params)
    const headers = this.buildHeaders(options.headers as Record<string, string>)

    logger.debug('[BaseApiClient] DELETE:', url)

    // Extraire uniquement les propriétés RequestInit compatibles
    const { body: _optionsBody, params: _params, skipRetry: _skipRetry, skipCircuitBreaker: _skipCircuitBreaker, timeout: _timeout, ...requestInit } = options

    return this.executeRequest<T>(url, {
      method: 'DELETE',
      headers,
      credentials: this.config.credentials,
      ...requestInit,
    }, options)
  }

  /**
   * Requête JSON-RPC (pour backend Odoo)
   */
  async rpc<T>(endpoint: string, params?: Record<string, unknown>): Promise<{
    success: boolean
    data?: T
    error?: string
  }> {
    const url = this.buildUrl(endpoint)
    const headers = this.buildHeaders()

    logger.debug('[BaseApiClient] RPC:', url, params)

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers,
        credentials: this.config.credentials,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: params || {},
          id: Math.random(),
        }),
      }, this.config.timeout)

      if (!response.ok) {
        if (response.status === 401) {
          this.handleSessionExpired()
        }
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`,
        }
      }

      const json = await response.json()

      if (json.error) {
        const errorMessage = json.error.data?.message || json.error.message || 'API Error'
        return {
          success: false,
          error: errorMessage,
        }
      }

      return {
        success: true,
        data: json.result,
      }
    } catch (error) {
      logger.error('[BaseApiClient] RPC error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
