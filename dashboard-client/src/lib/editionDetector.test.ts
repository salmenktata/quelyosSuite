import { describe, it, expect, beforeEach, vi } from 'vitest'
import { detectEdition, getCurrentEdition, isFullEdition, isSaasEdition } from './editionDetector'

// Helper pour contourner les restrictions TypeScript sur les env vars en tests
const stubEdition = (value: string | undefined) => {
  vi.stubEnv('VITE_EDITION', value as any)
}

describe('editionDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset env vars
    stubEdition(undefined)
  })

  describe('detectEdition', () => {
    it('devrait détecter édition via env var (build-time)', () => {
      stubEdition('finance')
      expect(detectEdition()).toBe('finance')
    })

    it('devrait détecter édition via subdomain (runtime)', () => {
      stubEdition(undefined)

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'finance.quelyos.com',
          port: '',
        },
        writable: true,
      })

      expect(detectEdition()).toBe('finance')
    })

    it('devrait détecter édition via port dev (localhost)', () => {
      stubEdition(undefined)

      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          port: '3011',
        },
        writable: true,
      })

      expect(detectEdition()).toBe('store')
    })

    it('devrait fallback sur "full" par défaut', () => {
      stubEdition(undefined)

      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'app.quelyos.com',
          port: '80',
        },
        writable: true,
      })

      expect(detectEdition()).toBe('full')
    })

    it('devrait prioriser env var sur subdomain', () => {
      stubEdition('finance')

      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'store.quelyos.com', // Subdomain dit "store"
          port: '',
        },
        writable: true,
      })

      // Env var prioritaire
      expect(detectEdition()).toBe('finance')
    })

    it('devrait détecter toutes éditions via ports', () => {
      stubEdition(undefined)

      const portMap = [
        { port: '3010', edition: 'finance' },
        { port: '3011', edition: 'store' },
        { port: '3012', edition: 'copilote' },
        { port: '3013', edition: 'sales' },
        { port: '3014', edition: 'retail' },
        { port: '3015', edition: 'team' },
        { port: '3016', edition: 'support' },
        { port: '5175', edition: 'full' },
      ]

      portMap.forEach(({ port, edition }) => {
        Object.defineProperty(window, 'location', {
          value: { hostname: 'localhost', port },
          writable: true,
        })
        expect(detectEdition()).toBe(edition)
      })
    })
  })

  describe('getCurrentEdition', () => {
    it('devrait retourner la configuration complète de l\'édition', () => {
      stubEdition('finance')

      const edition = getCurrentEdition()

      expect(edition.id).toBe('finance')
      expect(edition.name).toBe('Quelyos Finance')
      expect(edition.color).toBe('#059669')
      expect(edition.modules).toEqual(['finance'])
      expect(edition.port).toBe(3010)
    })
  })

  describe('isFullEdition', () => {
    it('devrait retourner true si édition full', () => {
      stubEdition('full')
      expect(isFullEdition()).toBe(true)
    })

    it('devrait retourner false si édition SaaS', () => {
      stubEdition('finance')
      expect(isFullEdition()).toBe(false)
    })
  })

  describe('isSaasEdition', () => {
    it('devrait retourner true si édition SaaS', () => {
      stubEdition('store')
      expect(isSaasEdition()).toBe(true)
    })

    it('devrait retourner false si édition full', () => {
      stubEdition('full')
      expect(isSaasEdition()).toBe(false)
    })
  })
})
