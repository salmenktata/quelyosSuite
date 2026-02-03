/**
 * Circuit Breaker pour API Quelyos
 *
 * Protège contre les pannes en cascade quand le backend est indisponible.
 * Implémente le pattern Circuit Breaker avec 3 états:
 * - CLOSED: Normal, toutes les requêtes passent
 * - OPEN: Backend down, rejette immédiatement les requêtes
 * - HALF_OPEN: Test de récupération, laisse passer quelques requêtes
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
  /** Nombre d'échecs avant ouverture du circuit */
  failureThreshold: number
  /** Temps avant de tester la récupération (ms) */
  resetTimeout: number
  /** Nombre de succès requis pour fermer le circuit */
  successThreshold: number
  /** Timeout pour considérer une requête comme échec (ms) */
  requestTimeout: number
  /** Callback appelé quand l'état change */
  onStateChange?: (state: CircuitState, previousState: CircuitState) => void
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 secondes
  successThreshold: 2,
  requestTimeout: 10000, // 10 secondes
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime?: number
  private config: CircuitBreakerConfig

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Exécute une fonction avec protection circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Vérifier si le circuit est ouvert
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN')
      } else {
        throw new CircuitBreakerError(
          'Service unavailable - circuit breaker is OPEN',
          this.getTimeUntilRetry()
        )
      }
    }

    try {
      // Exécuter avec timeout
      const result = await this.executeWithTimeout(fn)
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Exécute avec timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${this.config.requestTimeout}ms`))
      }, this.config.requestTimeout)

      fn()
        .then((result) => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * Appelé après un succès
   */
  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('CLOSED')
      }
    }
  }

  /**
   * Appelé après un échec
   */
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    this.successCount = 0

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN')
    } else if (
      this.state === 'CLOSED' &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.transitionTo('OPEN')
    }
  }

  /**
   * Vérifie si on doit tenter une récupération
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout
  }

  /**
   * Temps restant avant retry possible
   */
  private getTimeUntilRetry(): number {
    if (!this.lastFailureTime) return 0
    const elapsed = Date.now() - this.lastFailureTime
    return Math.max(0, this.config.resetTimeout - elapsed)
  }

  /**
   * Transition d'état
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state
    this.state = newState

    if (newState === 'CLOSED') {
      this.failureCount = 0
      this.successCount = 0
    }

    if (newState === 'HALF_OPEN') {
      this.successCount = 0
    }

    this.config.onStateChange?.(newState, previousState)

    // SÉCURITÉ : Log debugging uniquement en dev
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- Debug logging circuit breaker state transitions
      console.log(
        `[CircuitBreaker] ${previousState} -> ${newState}`,
        `(failures: ${this.failureCount}, successes: ${this.successCount})`
      )
    }
  }

  /**
   * Retourne l'état actuel
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Retourne les stats
   */
  getStats(): {
    state: CircuitState
    failureCount: number
    successCount: number
    lastFailure?: Date
    retryIn?: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : undefined,
      retryIn: this.state === 'OPEN' ? this.getTimeUntilRetry() : undefined,
    }
  }

  /**
   * Force la fermeture du circuit (pour tests/admin)
   */
  reset(): void {
    this.transitionTo('CLOSED')
  }

  /**
   * Force l'ouverture du circuit (pour maintenance)
   */
  trip(): void {
    this.transitionTo('OPEN')
    this.lastFailureTime = Date.now()
  }
}

/**
 * Erreur spécifique au circuit breaker
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message)
    this.name = 'CircuitBreakerError'
  }
}

// =============================================================================
// INSTANCES GLOBALES PAR SERVICE
// =============================================================================

const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * Récupère ou crée un circuit breaker pour un service
 */
export function getCircuitBreaker(
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(
      serviceName,
      new CircuitBreaker({
        ...config,
        onStateChange: (state, prev) => {
          // SÉCURITÉ : Log uniquement en dev (éviter exposition nom services)
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console -- Warning circuit breaker state change
            console.warn(
              `[${serviceName}] Circuit breaker: ${prev} -> ${state}`
            )
          }
          // Notification utilisateur si ouvert
          if (state === 'OPEN') {
            window.dispatchEvent(
              new CustomEvent('circuit-breaker-open', {
                detail: { service: serviceName },
              })
            )
          }
        },
      })
    )
  }
  return circuitBreakers.get(serviceName)!
}

/**
 * Circuit breaker pour l'API backend principale
 */
export const backendCircuitBreaker = getCircuitBreaker('backend', {
  failureThreshold: 5,
  resetTimeout: 30000,
  successThreshold: 2,
  requestTimeout: 15000,
})

/**
 * Helper pour wrapper une fonction fetch avec circuit breaker
 */
export async function fetchWithCircuitBreaker<T>(
  serviceName: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName)
  return breaker.execute(fetchFn)
}
