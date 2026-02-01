/**
 * API Gateway pour Quelyos Dashboard
 *
 * Centralise toutes les requêtes API avec:
 * - Routing intelligent
 * - Load balancing
 * - Circuit breaker
 * - Rate limiting côté client
 * - Retry automatique
 * - Cache
 * - Transformation des requêtes/réponses
 */

import { config } from '@/lib/config'
import { CircuitBreaker } from './circuitBreaker'
import { withRetry, RETRY_CONFIGS } from './retry'
import { tokenService } from '@/lib/tokenService'

// Types
export interface GatewayRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  timeout?: number
  retry?: boolean
  cache?: boolean | number
  signal?: AbortSignal
  responseType?: 'json' | 'blob' | 'text' | 'arraybuffer'
}

export interface GatewayResponse<T = unknown> {
  data: T
  status: number
  headers: Headers
  cached: boolean
  duration: number
}

export interface GatewayConfig {
  baseUrl: string
  timeout: number
  retryAttempts: number
  cacheEnabled: boolean
  cacheTtl: number
}

// Configuration par défaut
const defaultConfig: GatewayConfig = {
  baseUrl: config.apiUrl,
  timeout: config.apiTimeout,
  retryAttempts: config.apiRetryAttempts,
  cacheEnabled: config.cacheEnabled,
  cacheTtl: config.cacheTtl,
}

// Circuit breakers par service
const circuitBreakers = new Map<string, CircuitBreaker>()

// Cache en mémoire
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}
const cache = new Map<string, CacheEntry<unknown>>()

// Rate limiting
interface RateLimitState {
  tokens: number
  lastRefill: number
}
const rateLimitState: RateLimitState = {
  tokens: 100,
  lastRefill: Date.now(),
}
const RATE_LIMIT_REFILL_RATE = 10 // tokens par seconde
const RATE_LIMIT_MAX_TOKENS = 100

// =============================================================================
// GATEWAY CLASS
// =============================================================================

class APIGateway {
  private config: GatewayConfig

  constructor(config: GatewayConfig = defaultConfig) {
    this.config = config
  }

  /**
   * Exécute une requête via le gateway
   */
  async request<T>(req: GatewayRequest): Promise<GatewayResponse<T>> {
    const startTime = performance.now()

    // Rate limiting
    if (!this.checkRateLimit()) {
      throw new GatewayError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    }

    // Générer la clé de cache
    const cacheKey = this.getCacheKey(req)

    // Vérifier le cache pour GET
    if (req.method === 'GET' && (req.cache ?? this.config.cacheEnabled)) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        return {
          data: cached,
          status: 200,
          headers: new Headers(),
          cached: true,
          duration: performance.now() - startTime,
        }
      }
    }

    // Obtenir ou créer le circuit breaker pour ce service
    const serviceKey = this.getServiceKey(req.path)
    const circuitBreaker = this.getCircuitBreaker(serviceKey)

    // Construire la requête
    const url = this.buildUrl(req.path, req.params)
    const fetchOptions = this.buildFetchOptions(req)

    // Exécuter via circuit breaker
    const executeRequest = async (): Promise<Response> => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), req.timeout ?? this.config.timeout)

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: req.signal ?? controller.signal,
        })

        if (!response.ok) {
          throw new GatewayError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            'HTTP_ERROR'
          )
        }

        return response
      } finally {
        clearTimeout(timeout)
      }
    }

    // Avec retry si demandé
    let response: Response
    if (req.retry ?? true) {
      const retryResult = await circuitBreaker.execute(() =>
        withRetry(executeRequest, RETRY_CONFIGS.api)
      )
      if (!retryResult.success || !retryResult.data) {
        throw retryResult.error || new Error('Request failed')
      }
      response = retryResult.data
    } else {
      response = await circuitBreaker.execute(executeRequest)
    }

    // Parser la réponse
    const data = await this.parseResponse<T>(response)

    // Mettre en cache si GET
    if (req.method === 'GET' && (req.cache ?? this.config.cacheEnabled)) {
      const ttl = typeof req.cache === 'number' ? req.cache : this.config.cacheTtl
      this.setCache(cacheKey, data, ttl)
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
      cached: false,
      duration: performance.now() - startTime,
    }
  }

  // Méthodes raccourcies
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.request<T>({
      method: 'GET',
      path,
      params: params as Record<string, string | number | boolean | undefined>,
    })
    return response.data
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>({ method: 'POST', path, body })
    return response.data
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>({ method: 'PUT', path, body })
    return response.data
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>({ method: 'PATCH', path, body })
    return response.data
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.request<T>({ method: 'DELETE', path })
    return response.data
  }

  // Helpers privés

  private checkRateLimit(): boolean {
    const now = Date.now()
    const elapsed = (now - rateLimitState.lastRefill) / 1000

    // Refill tokens
    rateLimitState.tokens = Math.min(
      RATE_LIMIT_MAX_TOKENS,
      rateLimitState.tokens + elapsed * RATE_LIMIT_REFILL_RATE
    )
    rateLimitState.lastRefill = now

    // Check if we have tokens
    if (rateLimitState.tokens < 1) {
      return false
    }

    rateLimitState.tokens -= 1
    return true
  }

  private getCacheKey(req: GatewayRequest): string {
    const params = req.params ? JSON.stringify(req.params) : ''
    return `${req.method}:${req.path}:${params}`
  }

  private getFromCache<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  private getServiceKey(path: string): string {
    // Extraire le service du path (ex: /api/products -> products)
    const parts = path.split('/').filter(Boolean)
    return parts[1] || 'default'
  }

  private getCircuitBreaker(serviceKey: string): CircuitBreaker {
    if (!circuitBreakers.has(serviceKey)) {
      circuitBreakers.set(serviceKey, new CircuitBreaker())
    }
    return circuitBreakers.get(serviceKey)!
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    // En mode dev avec baseUrl vide, utiliser l'origine courante (pour proxy Vite)
    const base = this.config.baseUrl || window.location.origin
    const url = new URL(path, base)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  private buildFetchOptions(req: GatewayRequest): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
      ...req.headers,
    }

    // Ajouter le JWT Bearer token si disponible
    const accessToken = tokenService.getAccessToken()
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const options: RequestInit = {
      method: req.method,
      headers,
      credentials: 'include', // Inclure les cookies HttpOnly comme fallback
    }

    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = JSON.stringify(req.body)
    }

    return options
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return response.json()
    }

    if (contentType?.includes('text/')) {
      return (await response.text()) as unknown as T
    }

    return (await response.blob()) as unknown as T
  }

  /**
   * Invalide le cache pour un pattern
   */
  invalidateCache(pattern?: string | RegExp): void {
    if (!pattern) {
      cache.clear()
      return
    }

    for (const key of cache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        cache.delete(key)
      }
    }
  }

  /**
   * Retourne l'état des circuit breakers
   */
  getCircuitBreakerStates(): Record<string, string> {
    const states: Record<string, string> = {}
    for (const [key, cb] of circuitBreakers) {
      states[key] = cb.getState()
    }
    return states
  }
}

// Erreur personnalisée
export class GatewayError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'GatewayError'
    this.status = status
    this.code = code
  }
}

// Instance singleton
export const gateway = new APIGateway()
export const api = gateway

// Export par défaut
export default gateway
