/**
 * Retry Logic avec Exponential Backoff
 *
 * Gère les retries automatiques pour les requêtes API avec:
 * - Exponential backoff (délai croissant)
 * - Jitter (variation aléatoire pour éviter thundering herd)
 * - Retry conditionnel selon le type d'erreur
 * - Timeout par tentative
 */

import { logger } from '@quelyos/logger'

// =============================================================================
// TYPES
// =============================================================================

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public response: Response
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export interface RetryConfig {
  /** Nombre maximum de tentatives (incluant la première) */
  maxRetries: number
  /** Délai initial en ms avant le premier retry */
  initialDelay: number
  /** Facteur multiplicateur pour exponential backoff */
  backoffFactor: number
  /** Délai maximum entre les retries (cap) */
  maxDelay: number
  /** Ajouter du jitter (variation aléatoire) */
  jitter: boolean
  /** Facteur de jitter (0-1) */
  jitterFactor: number
  /** Codes HTTP à retrier */
  retryableStatuses: number[]
  /** Types d'erreurs à retrier */
  retryableErrors: string[]
  /** Callback appelé avant chaque retry */
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void
  /** Timeout par tentative en ms */
  timeout?: number
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTime: number
}

// =============================================================================
// CONFIGURATION PAR DÉFAUT
// =============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30000,
  jitter: true,
  jitterFactor: 0.3,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'NetworkError'],
  timeout: 30000,
}

// Configurations prédéfinies pour différents cas d'usage
export const RETRY_CONFIGS = {
  /** Pour les requêtes critiques (checkout, paiement) */
  critical: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 10000,
  },

  /** Pour les requêtes idempotentes (GET, lecture) */
  idempotent: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: 3,
    initialDelay: 1000,
  },

  /** Pour les webhooks (retry agressif) */
  webhook: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: 10,
    initialDelay: 1000,
    backoffFactor: 1.5,
    maxDelay: 60000,
  },

  /** Pour les requêtes temps réel (retry rapide) */
  realtime: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: 2,
    initialDelay: 100,
    maxDelay: 1000,
  },

  /** Pas de retry */
  none: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: 1,
  },

  /** Pour les requêtes API standard */
  api: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
  },
} as const

// =============================================================================
// LOGIQUE DE RETRY
// =============================================================================

/**
 * Calcule le délai avant le prochain retry avec exponential backoff + jitter
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Exponential backoff: delay = initial * factor^attempt
  let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1)

  // Cap au délai maximum
  delay = Math.min(delay, config.maxDelay)

  // Ajouter du jitter
  if (config.jitter) {
    const jitterRange = delay * config.jitterFactor
    const jitter = Math.random() * jitterRange * 2 - jitterRange
    delay = Math.max(0, delay + jitter)
  }

  return Math.round(delay)
}

/**
 * Vérifie si une erreur est retriable
 */
export function isRetryable(
  error: Error | Response,
  config: RetryConfig
): boolean {
  // Erreur HTTP (Response)
  if (error instanceof Response) {
    return config.retryableStatuses.includes(error.status)
  }

  // Erreur réseau ou custom
  const errorName = error.name || ''
  const errorMessage = error.message || ''

  // Vérifier le nom d'erreur
  if (config.retryableErrors.some((e) => errorName.includes(e))) {
    return true
  }

  // Vérifier le message d'erreur
  if (config.retryableErrors.some((e) => errorMessage.includes(e))) {
    return true
  }

  // Erreurs de timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return true
  }

  // Erreurs réseau génériques
  if (errorMessage.includes('network') || errorMessage.includes('Network')) {
    return true
  }

  return false
}

/**
 * Attend un délai donné
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Exécute une fonction avec timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

// =============================================================================
// FONCTION PRINCIPALE
// =============================================================================

/**
 * Exécute une fonction avec retry automatique
 *
 * @example
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3 }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const mergedConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  const startTime = Date.now()
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      // Exécuter avec timeout si configuré
      const result = mergedConfig.timeout
        ? await withTimeout(fn, mergedConfig.timeout)
        : await fn()

      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Vérifier si on peut retrier
      const canRetry = attempt < mergedConfig.maxRetries && isRetryable(lastError, mergedConfig)

      if (!canRetry) {
        break
      }

      // Calculer le délai
      const delay = calculateDelay(attempt, mergedConfig)

      // Callback avant retry
      mergedConfig.onRetry?.(attempt, lastError, delay)

      // Log en développement
      if (import.meta.env.DEV) {
        logger.debug(
          `[Retry] Attempt ${attempt}/${mergedConfig.maxRetries} failed. ` +
            `Retrying in ${delay}ms...`,
          lastError.message
        )
      }

      // Attendre avant le prochain essai
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: mergedConfig.maxRetries,
    totalTime: Date.now() - startTime,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Wrapper pour fetch avec retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  const result = await withRetry(
    async () => {
      const response = await fetch(url, options)

      // Traiter les erreurs HTTP comme des erreurs
      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response
        )
      }

      return response
    },
    retryConfig
  )

  if (!result.success) {
    throw result.error
  }

  return result.data!
}

/**
 * Décorateur pour ajouter retry à une fonction
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config?: Partial<RetryConfig>
): T {
  return (async (...args: Parameters<T>) => {
    const result = await withRetry(() => fn(...args), config)
    if (!result.success) {
      throw result.error
    }
    return result.data
  }) as T
}

/**
 * Classe pour gérer les retries avec état
 */
export class RetryManager {
  private config: RetryConfig
  private currentAttempt = 0
  private isRunning = false

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  async execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    if (this.isRunning) {
      throw new Error('RetryManager is already running')
    }

    this.isRunning = true
    this.currentAttempt = 0

    try {
      return await withRetry(fn, {
        ...this.config,
        onRetry: (attempt, error, delay) => {
          this.currentAttempt = attempt
          this.config.onRetry?.(attempt, error, delay)
        },
      })
    } finally {
      this.isRunning = false
    }
  }

  getAttempt(): number {
    return this.currentAttempt
  }

  cancel(): void {
    this.isRunning = false
  }
}
