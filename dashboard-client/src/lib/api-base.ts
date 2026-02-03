/**
 * API Base - Utilitaires pour les appels API
 */

import {
  backendCircuitBreaker,
  CircuitBreakerError,
} from './api/circuitBreaker'
import { tokenService } from './tokenService'
import { getBackendUrl } from '@quelyos/config'

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || getBackendUrl(import.meta.env.MODE as 'development' | 'production' | 'staging')

/**
 * Options pour fetchApi
 */
export interface FetchApiOptions extends RequestInit {
  /** Désactiver le circuit breaker pour cet appel */
  skipCircuitBreaker?: boolean
  /** Nombre de retries en cas d'échec */
  retries?: number
  /** Délai entre les retries (ms) */
  retryDelay?: number
}

/**
 * Fetch avec circuit breaker et retry automatique
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const {
    skipCircuitBreaker = false,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  // Utiliser JWT Bearer token du tokenService
  const token = tokenService.getAccessToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  }

  const doFetch = async (): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new ApiError(
        `API Error: ${response.status}`,
        response.status,
        errorBody
      )
    }

    return response.json()
  }

  // Avec circuit breaker
  const executeWithRetry = async (attempt: number = 0): Promise<T> => {
    try {
      if (skipCircuitBreaker) {
        return await doFetch()
      }
      return await backendCircuitBreaker.execute(doFetch)
    } catch (error) {
      // Ne pas retry sur circuit breaker open
      if (error instanceof CircuitBreakerError) {
        throw error
      }

      // Retry si configuré
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        return executeWithRetry(attempt + 1)
      }

      throw error
    }
  }

  return executeWithRetry()
}

/**
 * Erreur API avec détails
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Vérifie si le backend est disponible
 */
export function isBackendAvailable(): boolean {
  return backendCircuitBreaker.getState() !== 'OPEN'
}

/**
 * Récupère les stats du circuit breaker
 */
export function getBackendHealth() {
  return backendCircuitBreaker.getStats()
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}
