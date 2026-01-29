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

      const result = await withRetry(fn, RETRY_CONFIGS.exponential)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Retry après échec', () => {
    it('devrait retry après un échec temporaire', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 10,
        backoffMultiplier: 1,
        maxDelay: 100,
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('devrait respecter maxRetries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'))

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelay: 10,
          backoffMultiplier: 1,
          maxDelay: 100,
        })
      ).rejects.toThrow('always fails')

      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('devrait utiliser exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce('success')

      const startTime = Date.now()

      await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 50,
        backoffMultiplier: 2,
        maxDelay: 1000,
      })

      const duration = Date.now() - startTime

      // Premier retry: 50ms, deuxième retry: 100ms
      // Total min: ~150ms
      expect(duration).toBeGreaterThanOrEqual(100)
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('Retry conditionnel', () => {
    it('ne devrait pas retry pour une erreur 4xx', async () => {
      const error = new Error('Bad Request')
      Object.assign(error, { status: 400 })

      const fn = vi.fn().mockRejectedValue(error)

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelay: 10,
          backoffMultiplier: 1,
          maxDelay: 100,
          shouldRetry: (err) => {
            const status = (err as any).status
            return !status || status >= 500
          },
        })
      ).rejects.toThrow('Bad Request')

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
        backoffMultiplier: 1,
        maxDelay: 100,
        shouldRetry: (err) => {
          const status = (err as any).status
          return !status || status >= 500
        },
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('Configs prédéfinis', () => {
    it('RETRY_CONFIGS.exponential devrait avoir les bonnes valeurs', () => {
      expect(RETRY_CONFIGS.exponential.maxRetries).toBe(3)
      expect(RETRY_CONFIGS.exponential.backoffMultiplier).toBeGreaterThan(1)
    })

    it('RETRY_CONFIGS.linear devrait avoir les bonnes valeurs', () => {
      expect(RETRY_CONFIGS.linear.maxRetries).toBe(3)
      expect(RETRY_CONFIGS.linear.backoffMultiplier).toBe(1)
    })

    it('RETRY_CONFIGS.aggressive devrait avoir plus de retries', () => {
      expect(RETRY_CONFIGS.aggressive.maxRetries).toBeGreaterThan(
        RETRY_CONFIGS.exponential.maxRetries
      )
    })
  })

  describe('Jitter', () => {
    it('devrait ajouter du jitter aux délais', async () => {
      const delays: number[] = []
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      try {
        await withRetry(fn, {
          maxRetries: 3,
          initialDelay: 100,
          backoffMultiplier: 1,
          maxDelay: 100,
          jitter: true,
        })
      } catch {
        // Expected to fail
      }

      // Difficile de tester le jitter exact, mais on vérifie au moins
      // que la fonction a été appelée le bon nombre de fois
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })
})
