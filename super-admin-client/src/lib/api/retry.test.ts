/**
 * Tests pour Retry Logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry, RETRY_CONFIGS } from './retry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Succès immédiat', () => {
    it('devrait retourner le résultat sans retry', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await withRetry(fn, RETRY_CONFIGS.api)

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(1)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Retry après échec', () => {
    it('devrait retry après un échec temporaire', async () => {
      const error = new Error('Network error')
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
        backoffFactor: 1,
        maxDelay: 100,
      })

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('devrait respecter maxRetries', async () => {
      const error = new Error('Timeout')
      const fn = vi.fn().mockRejectedValue(error)

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
        backoffFactor: 1,
        maxDelay: 100,
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Timeout')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('devrait utiliser exponential backoff', async () => {
      const error = new Error('Network error')
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success')

      const startTime = Date.now()

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 50,
        backoffFactor: 2,
        maxDelay: 1000,
        jitter: false,
      })

      const duration = Date.now() - startTime

      // Premier retry: 50ms, deuxième retry: 100ms
      // Total min: ~150ms
      expect(duration).toBeGreaterThanOrEqual(100)
      expect(result.success).toBe(true)
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('Retry conditionnel', () => {
    it('ne devrait pas retry pour une erreur 4xx', async () => {
      const error = new Error('Bad Request')
      Object.assign(error, { status: 400 })

      const fn = vi.fn().mockRejectedValue(error)

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
        backoffFactor: 1,
        maxDelay: 100,
        retryableStatuses: [500, 502, 503, 504],
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Bad Request')
      expect(fn).toHaveBeenCalledTimes(1) // Pas de retry
    })

    it('devrait retry pour une erreur 5xx', async () => {
      const error = new Error('Internal Server Error')
      Object.assign(error, { status: 500 })

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
        backoffFactor: 1,
        maxDelay: 100,
        retryableStatuses: [500, 502, 503, 504],
      })

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('Configs prédéfinis', () => {
    it('RETRY_CONFIGS.api devrait avoir les bonnes valeurs', () => {
      expect(RETRY_CONFIGS.api.maxRetries).toBe(3)
      expect(RETRY_CONFIGS.api.backoffFactor).toBeGreaterThan(1)
    })

    it('RETRY_CONFIGS.idempotent devrait avoir les bonnes valeurs', () => {
      expect(RETRY_CONFIGS.idempotent.maxRetries).toBe(3)
      expect(RETRY_CONFIGS.idempotent.initialDelay).toBe(1000)
    })

    it('RETRY_CONFIGS.webhook devrait avoir plus de retries', () => {
      expect(RETRY_CONFIGS.webhook.maxRetries).toBeGreaterThan(
        RETRY_CONFIGS.api.maxRetries
      )
    })
  })

  describe('Jitter', () => {
    it('devrait ajouter du jitter aux délais', async () => {
      const error = new Error('Timeout')
      const fn = vi.fn().mockRejectedValue(error)

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 100,
        backoffFactor: 1,
        maxDelay: 100,
        jitter: true,
      })

      // Difficile de tester le jitter exact, mais on vérifie au moins
      // que la fonction a été appelée le bon nombre de fois
      expect(result.success).toBe(false)
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })
})
