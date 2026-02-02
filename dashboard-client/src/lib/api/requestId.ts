/**
 * Request ID / Correlation ID pour traçabilité
 *
 * Génère et propage des IDs uniques pour:
 * - Corrélation des logs frontend/backend
 * - Debug des requêtes
 * - Analyse de performance
 */

import { logger } from '@quelyos/logger'

// Use native crypto.randomUUID() instead of uuid package
const uuidv4 = () => crypto.randomUUID()

// Headers
export const REQUEST_ID_HEADER = 'X-Request-ID'
export const CORRELATION_ID_HEADER = 'X-Correlation-ID'

// Stockage du correlation ID pour la session
let sessionCorrelationId: string | null = null

/**
 * Génère un nouvel ID de requête
 */
export function generateRequestId(): string {
  return uuidv4()
}

/**
 * Récupère ou génère le correlation ID de session
 */
export function getSessionCorrelationId(): string {
  if (!sessionCorrelationId) {
    // Essayer de récupérer depuis sessionStorage
    sessionCorrelationId = sessionStorage.getItem('correlation_id')

    if (!sessionCorrelationId) {
      sessionCorrelationId = generateRequestId()
      sessionStorage.setItem('correlation_id', sessionCorrelationId)
    }
  }
  return sessionCorrelationId
}

/**
 * Génère les headers de request ID pour une requête
 */
export function getRequestIdHeaders(): Record<string, string> {
  return {
    [REQUEST_ID_HEADER]: generateRequestId(),
    [CORRELATION_ID_HEADER]: getSessionCorrelationId(),
  }
}

/**
 * Extrait le request ID de la réponse
 */
export function getRequestIdFromResponse(response: Response): string | null {
  return response.headers.get(REQUEST_ID_HEADER)
}

/**
 * Wrapper fetch avec request ID automatique
 */
export async function fetchWithRequestId(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const requestId = generateRequestId()

  const headers = new Headers(init?.headers)
  headers.set(REQUEST_ID_HEADER, requestId)
  headers.set(CORRELATION_ID_HEADER, getSessionCorrelationId())

  const startTime = performance.now()

  try {
    const response = await fetch(input, { ...init, headers })

    const duration = performance.now() - startTime
    const _responseRequestId = getRequestIdFromResponse(response)

    // Log en dev
    if (import.meta.env.DEV) {
      logger.debug(
        `[${requestId.slice(0, 8)}] ${init?.method || 'GET'} ${input} - ${response.status} (${duration.toFixed(0)}ms)`
      )
    }

    return response
  } catch (error) {
    const duration = performance.now() - startTime

    // Log l'erreur avec le request ID
    logger.error(
      `[${requestId.slice(0, 8)}] ${init?.method || 'GET'} ${input} - FAILED (${duration.toFixed(0)}ms)`,
      error
    )

    throw error
  }
}

/**
 * Crée un contexte de requête pour les logs
 */
export function createRequestContext(): {
  requestId: string
  correlationId: string
  startTime: number
  log: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
  end: () => { duration: number }
} {
  const requestId = generateRequestId()
  const correlationId = getSessionCorrelationId()
  const startTime = performance.now()

  const prefix = `[${requestId.slice(0, 8)}]`

  return {
    requestId,
    correlationId,
    startTime,
    log: (message: string, ...args: unknown[]) => {
      logger.debug(`${prefix} ${message}`, ...args)
    },
    error: (message: string, ...args: unknown[]) => {
      logger.error(`${prefix} ${message}`, ...args)
    },
    end: () => {
      const duration = performance.now() - startTime
      logger.debug(`${prefix} Completed in ${duration.toFixed(0)}ms`)
      return { duration }
    },
  }
}

/**
 * Hook React pour utiliser le request ID
 */
export function useRequestId(): string {
  // Génère un ID stable pour le composant
  const [requestId] = React.useState(() => generateRequestId())
  return requestId
}

// Nécessite React (import conditionnel pour éviter les erreurs SSR)
let React: typeof import('react')
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  React = require('react')
} catch {
  // React non disponible
}
