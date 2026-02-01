import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from './usePermissions'
import * as auth from '@/lib/finance/compat/auth'
import * as editionDetector from '@/lib/editionDetector'

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Filtrage par édition', () => {
    it('Finance : devrait filtrer modules non-édition (store, pos)', () => {
      // Mock user avec permissions Finance + Store
      vi.spyOn(auth, 'useAuth').mockReturnValue({
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@quelyos.com',
          login: 'test',
          groups: ['Quelyos Finance User', 'Quelyos Store User'],
        },
        isAuthenticated: true,
      } as any)

      // Mock édition Finance (seul module finance whitelisté)
      vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
        id: 'finance',
        name: 'Quelyos Finance',
        modules: ['finance'],
      } as any)

      const { result } = renderHook(() => usePermissions())

      // User a permission Store, mais édition finance l'exclut
      expect(result.current.canAccessModule('finance')).toBe(true)
      expect(result.current.canAccessModule('store')).toBe(false)
      expect(result.current.canAccessModule('pos')).toBe(false)
    })

    it('Store : devrait permettre accès store + marketing uniquement', () => {
      vi.spyOn(auth, 'useAuth').mockReturnValue({
        user: {
          id: 1,
          name: 'Store Manager',
          email: 'store@quelyos.com',
          login: 'store',
          groups: ['Quelyos Store Manager', 'Quelyos Marketing User'],
        },
        isAuthenticated: true,
      })

      vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
        id: 'store',
        name: 'Quelyos Store',
        modules: ['store', 'marketing'],
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAccessModule('store')).toBe(true)
      expect(result.current.canAccessModule('marketing')).toBe(true)
      expect(result.current.canAccessModule('finance')).toBe(false)
      expect(result.current.canAccessModule('pos')).toBe(false)
    })

    it('Retail : devrait permettre pos + store + stock', () => {
      vi.spyOn(auth, 'useAuth').mockReturnValue({
        user: {
          id: 1,
          name: 'Retail User',
          email: 'retail@quelyos.com',
          login: 'retail',
          groups: ['Quelyos POS User', 'Quelyos Store User', 'Quelyos Stock User'],
        },
        isAuthenticated: true,
      })

      vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
        id: 'retail',
        name: 'Quelyos Retail',
        modules: ['pos', 'store', 'stock'],
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAccessModule('pos')).toBe(true)
      expect(result.current.canAccessModule('store')).toBe(true)
      expect(result.current.canAccessModule('stock')).toBe(true)
      expect(result.current.canAccessModule('finance')).toBe(false)
      expect(result.current.canAccessModule('hr')).toBe(false)
    })
  })

  describe('Super-admin', () => {
    it('Super-admin dans édition finance : accès uniquement finance (malgré super-admin)', () => {
      vi.spyOn(auth, 'useAuth').mockReturnValue({
        user: {
          id: 1,
          name: 'Super Admin',
          email: 'admin@quelyos.com',
          login: 'admin',
          groups: ['Access Rights'], // Super-admin
        },
        isAuthenticated: true,
      })

      vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
        id: 'finance',
        name: 'Quelyos Finance',
        modules: ['finance'],
      } as any)

      const { result } = renderHook(() => usePermissions())

      // Super-admin limité aux modules de l'édition
      expect(result.current.canAccessModule('finance')).toBe(true)
      expect(result.current.canAccessModule('store')).toBe(false)
      expect(result.current.canAccessModule('pos')).toBe(false)
      expect(result.current.isSuperAdmin()).toBe(true)
    })

    it('Super-admin dans édition full : accès à tous modules', () => {
      vi.spyOn(auth, 'useAuth').mockReturnValue({
        user: {
          id: 1,
          name: 'Super Admin',
          email: 'admin@quelyos.com',
          login: 'admin',
          groups: ['Access Rights'],
        },
        isAuthenticated: true,
      })

      vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
        id: 'full',
        name: 'Quelyos Suite',
        modules: ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'pos', 'support'],
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAccessModule('finance')).toBe(true)
      expect(result.current.canAccessModule('store')).toBe(true)
      expect(result.current.canAccessModule('pos')).toBe(true)
      expect(result.current.canAccessModule('hr')).toBe(true)
      expect(result.current.canAccessModule('support')).toBe(true)
    })
  })

  describe('getAccessibleModules', () => {
    it('devrait retourner uniquement modules accessibles (édition + permissions)', () => {
      vi.spyOn(auth, 'useAuth').mockReturnValue({
        user: {
          id: 1,
          name: 'Sales User',
          email: 'sales@quelyos.com',
          login: 'sales',
          groups: ['Quelyos CRM User'], // Permission CRM uniquement
        },
        isAuthenticated: true,
      })

      vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
        id: 'sales',
        name: 'Quelyos Sales',
        modules: ['crm', 'marketing'], // Édition whiteliste crm + marketing
      })

      const { result } = renderHook(() => usePermissions())

      const accessible = result.current.getAccessibleModules()

      // User a permission CRM (OK) mais pas Marketing (KO)
      expect(accessible).toContain('crm')
      expect(accessible).not.toContain('marketing')
      expect(accessible).not.toContain('finance')
    })
  })

  describe('Permissions sans authentification', () => {
    it('devrait refuser tous accès si user null', () => {
      vi.spyOn(auth, 'useAuth').mockReturnValue({
        user: null,
        isAuthenticated: false,
      })

      vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
        id: 'finance',
        modules: ['finance'],
      })

      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAccessModule('finance')).toBe(false)
      expect(result.current.isSuperAdmin()).toBe(false)
      expect(result.current.getAccessibleModules()).toEqual([])
    })
  })
})
