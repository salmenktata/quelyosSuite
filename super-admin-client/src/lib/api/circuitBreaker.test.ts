/**
 * Tests pour le Circuit Breaker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CircuitBreaker } from './circuitBreaker'

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      requestTimeout: 500,
      resetTimeout: 100,
    })
  })

  describe('État CLOSED (normal)', () => {
    it('devrait commencer en état CLOSED', () => {
      expect(breaker.getState()).toBe('CLOSED')
    })

    it('devrait exécuter la fonction avec succès', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await breaker.execute(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledOnce()
      expect(breaker.getState()).toBe('CLOSED')
    })

    it('devrait compter les échecs consécutifs', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'))

      // Échec 1
      await expect(breaker.execute(fn)).rejects.toThrow('test error')
      expect(breaker.getState()).toBe('CLOSED')

      // Échec 2
      await expect(breaker.execute(fn)).rejects.toThrow('test error')
      expect(breaker.getState()).toBe('CLOSED')
    })

    it('devrait passer en OPEN après failureThreshold échecs', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'))

      // 3 échecs consécutifs
      await expect(breaker.execute(fn)).rejects.toThrow('test error')
      await expect(breaker.execute(fn)).rejects.toThrow('test error')
      await expect(breaker.execute(fn)).rejects.toThrow('test error')

      expect(breaker.getState()).toBe('OPEN')
    })

    it('devrait reset le compteur après un succès', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce('success')

      // 2 échecs
      await expect(breaker.execute(fn)).rejects.toThrow()
      await expect(breaker.execute(fn)).rejects.toThrow()

      // 1 succès → reset compteur
      await breaker.execute(fn)

      const stats = breaker.getStats()
      expect(stats.failureCount).toBe(0)
      expect(breaker.getState()).toBe('CLOSED')
    })
  })

  describe('État OPEN (circuit ouvert)', () => {
    beforeEach(async () => {
      // Forcer l'état OPEN avec 3 échecs
      const fn = vi.fn().mockRejectedValue(new Error('force open'))
      await expect(breaker.execute(fn)).rejects.toThrow()
      await expect(breaker.execute(fn)).rejects.toThrow()
      await expect(breaker.execute(fn)).rejects.toThrow()
    })

    it('devrait rejeter immédiatement sans appeler la fonction', async () => {
      const fn = vi.fn().mockResolvedValue('never called')

      await expect(breaker.execute(fn)).rejects.toThrow('Service unavailable')
      expect(fn).not.toHaveBeenCalled()
    })

    it('devrait passer en HALF_OPEN après resetTimeout', async () => {
      // Attendre le resetTimeout (100ms)
      await new Promise(resolve => setTimeout(resolve, 150))

      const fn = vi.fn().mockResolvedValue('test')
      await breaker.execute(fn)

      expect(fn).toHaveBeenCalledOnce()
      expect(breaker.getState()).toBe('HALF_OPEN')
    })
  })

  describe('État HALF_OPEN (test de récupération)', () => {
    beforeEach(async () => {
      // Forcer OPEN
      const fail = vi.fn().mockRejectedValue(new Error('fail'))
      await expect(breaker.execute(fail)).rejects.toThrow()
      await expect(breaker.execute(fail)).rejects.toThrow()
      await expect(breaker.execute(fail)).rejects.toThrow()

      // Attendre resetTimeout pour passer en HALF_OPEN
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    it('devrait passer en CLOSED après successThreshold succès', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      // 2 succès nécessaires (successThreshold=2)
      await breaker.execute(fn)
      expect(breaker.getState()).toBe('HALF_OPEN')

      await breaker.execute(fn)
      expect(breaker.getState()).toBe('CLOSED')
    })

    it('devrait repasser en OPEN si un échec survient', async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('fail'))

      // 1 succès
      await breaker.execute(fn)
      expect(breaker.getState()).toBe('HALF_OPEN')

      // 1 échec → retour en OPEN
      await expect(breaker.execute(fn)).rejects.toThrow()
      expect(breaker.getState()).toBe('OPEN')
    })
  })

  describe('Timeout', () => {
    it('devrait timeout si la fonction prend trop de temps', async () => {
      const slowFn = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('too late'), 1000))
      )

      await expect(breaker.execute(slowFn)).rejects.toThrow('Request timeout')
    })
  })

  describe('getStats', () => {
    it('devrait retourner les stats correctes', async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce('success 1')
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValueOnce('success 2')

      await breaker.execute(fn)
      await expect(breaker.execute(fn)).rejects.toThrow()
      await breaker.execute(fn)

      const stats = breaker.getStats()
      expect(stats.state).toBe('CLOSED')
      expect(stats.failureCount).toBe(0) // Reset après succès
    })
  })

  describe('reset & trip', () => {
    it('reset devrait forcer la fermeture du circuit', async () => {
      // Ouvrir le circuit
      breaker.trip()
      expect(breaker.getState()).toBe('OPEN')

      // Forcer la fermeture
      breaker.reset()
      expect(breaker.getState()).toBe('CLOSED')
    })

    it('trip devrait forcer l\'ouverture du circuit', () => {
      expect(breaker.getState()).toBe('CLOSED')

      breaker.trip()
      expect(breaker.getState()).toBe('OPEN')
    })
  })
})
