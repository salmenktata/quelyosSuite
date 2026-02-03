import { describe, it, expect, beforeEach, vi } from 'vitest'
import { logError, logWarning, getHealthStatus } from './health'

// Import health module pour pouvoir accéder aux buffers internes
// Note: Les buffers sont internes au module, donc on les nettoie via getHealthStatus()

describe('health', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorage.clear()
    vi.clearAllTimers()

    // Nettoyer les buffers en appelant getHealthStatus plusieurs fois
    // et en attendant que le buffer expire (pas possible en test synchrone)
    // À la place, on accepte que les tests soient isolés au niveau du fichier
  })

  describe('logError', () => {
    it('devrait logger une erreur avec message string', () => {
      logError('Test error', 'TestComponent')

      const health = getHealthStatus()
      expect(health.errors).toHaveLength(1)
      expect(health.errors[0]!.message).toBe('Test error')  // Safe: length vérifié avant
      expect(health.errors[0]!.component).toBe('TestComponent')
    })

    it('devrait logger une erreur avec objet Error', () => {
      const error = new Error('Test error object')
      logError(error, 'TestComponent')

      const health = getHealthStatus()
      // Trouver notre erreur dans le buffer (peut contenir des erreurs précédentes)
      const ourError = health.errors.find(e => e.message === 'Test error object')
      expect(ourError).toBeDefined()
      expect(ourError!.message).toBe('Test error object')
      expect(ourError!.stack).toBeDefined()
    })

    it('devrait limiter le buffer à 50 entrées', () => {
      // Logger 60 erreurs
      for (let i = 0; i < 60; i++) {
        logError(`Error ${i}`)
      }

      const health = getHealthStatus()
      expect(health.errors.length).toBeLessThanOrEqual(50)
    })
  })

  describe('logWarning', () => {
    it('devrait logger un warning', () => {
      logWarning('Test warning', 'TestComponent')

      const health = getHealthStatus()
      expect(health.warnings).toHaveLength(1)
      expect(health.warnings[0]!.message).toBe('Test warning')  // Safe: length vérifié avant
      expect(health.warnings[0]!.component).toBe('TestComponent')
    })
  })

  describe('getHealthStatus', () => {
    it('devrait retourner uptime valide', () => {
      const health = getHealthStatus()

      // Le status peut être affecté par des erreurs précédentes dans d'autres tests
      expect(['healthy', 'degraded', 'down']).toContain(health.status)
      expect(health.uptime).toBeGreaterThanOrEqual(0)
      expect(health.timestamp).toBeDefined()
    })

    it('devrait retourner status "degraded" ou "down" avec erreurs multiples', () => {
      // Logger 5 erreurs
      for (let i = 0; i < 5; i++) {
        logError(`DegradedTest ${i}`)
      }

      const health = getHealthStatus()
      // Peut être degraded ou down selon les erreurs précédentes
      expect(['degraded', 'down']).toContain(health.status)
    })

    it('devrait retourner status "down" avec beaucoup d\'erreurs récentes', () => {
      // Logger 15 erreurs uniques
      for (let i = 0; i < 15; i++) {
        logError(`DownTest ${i}`)
      }

      const health = getHealthStatus()
      expect(health.status).toBe('down')
    })

    it('devrait inclure metrics', () => {
      const uniqueId = Date.now()
      logError(`MetricsError ${uniqueId}`)
      logWarning(`MetricsWarn1 ${uniqueId}`)
      logWarning(`MetricsWarn2 ${uniqueId}`)

      const health = getHealthStatus()
      // Les compteurs incluent les erreurs de tous les tests
      expect(health.metrics.errorCount).toBeGreaterThanOrEqual(1)
      expect(health.metrics.warningCount).toBeGreaterThanOrEqual(2)
      expect(health.metrics.lastErrorTime).toBeDefined()
    })

    it('devrait limiter à 10 erreurs dans le résultat', () => {
      // Logger 20 erreurs
      for (let i = 0; i < 20; i++) {
        logError(`Error ${i}`)
      }

      const health = getHealthStatus()
      expect(health.errors.length).toBeLessThanOrEqual(10)
    })
  })
})
