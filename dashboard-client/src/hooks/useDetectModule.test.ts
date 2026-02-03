import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useDetectModule } from './useDetectModule'
import { MODULES, type Module } from '@/config/modules'

describe('useDetectModule', () => {
  const allModules = MODULES
  const home = allModules.find(m => m.id === 'home')!
  const finance = allModules.find(m => m.id === 'finance')!
  const _stock = allModules.find(m => m.id === 'stock')!
  const store = allModules.find(m => m.id === 'store')!
  const _crm = allModules.find(m => m.id === 'crm')!
  const _marketing = allModules.find(m => m.id === 'marketing')!
  const _hr = allModules.find(m => m.id === 'hr')!

  describe('Module detection from pathname', () => {
    it('devrait détecter le module home depuis /dashboard', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/dashboard'))
      expect(result.current.id).toBe('home')
    })

    it('devrait détecter le module finance depuis /finance', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/finance'))
      expect(result.current.id).toBe('finance')
    })

    it('devrait détecter le module finance depuis /finance/transactions', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/finance/transactions'))
      expect(result.current.id).toBe('finance')
    })

    it('devrait détecter le module store depuis /store', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/store'))
      expect(result.current.id).toBe('store')
    })

    it('devrait détecter le module crm depuis /crm', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/crm'))
      expect(result.current.id).toBe('crm')
    })

    it('devrait détecter le module marketing depuis /marketing', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/marketing'))
      expect(result.current.id).toBe('marketing')
    })

    it('devrait détecter le module hr depuis /hr', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/hr'))
      expect(result.current.id).toBe('hr')
    })
  })

  describe('CRITIQUE: Ordre prioritaire /finance/stock', () => {
    it('devrait détecter STOCK (et NON finance) depuis /finance/stock', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/finance/stock'))
      expect(result.current.id).toBe('stock')
      expect(result.current.id).not.toBe('finance')
    })

    it('devrait détecter STOCK depuis /finance/stock/moves', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/finance/stock/moves'))
      expect(result.current.id).toBe('stock')
    })

    it('devrait détecter stock depuis /stock', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/stock'))
      expect(result.current.id).toBe('stock')
    })

    it('devrait détecter stock depuis /warehouses', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/warehouses'))
      expect(result.current.id).toBe('stock')
    })

    it('devrait détecter stock depuis /inventory', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/inventory'))
      expect(result.current.id).toBe('stock')
    })
  })

  describe('CRM routes alternatives', () => {
    it('devrait détecter crm depuis /invoices', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/invoices'))
      expect(result.current.id).toBe('crm')
    })

    it('devrait détecter crm depuis /payments', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/payments'))
      expect(result.current.id).toBe('crm')
    })

    it('devrait détecter crm depuis /pricelists', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/pricelists'))
      expect(result.current.id).toBe('crm')
    })
  })

  describe('Fallback behavior', () => {
    it('devrait fallback vers home si route inconnue', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/unknown-route'))
      expect(result.current.id).toBe('home')
    })

    it('devrait fallback vers home si pathname vide', () => {
      const { result } = renderHook(() => useDetectModule(allModules, ''))
      expect(result.current.id).toBe('home')
    })

    it('devrait fallback vers home si pathname racine', () => {
      const { result } = renderHook(() => useDetectModule(allModules, '/'))
      expect(result.current.id).toBe('home')
    })
  })

  describe('Permissions filtering', () => {
    it('devrait respecter la liste des modules accessibles', () => {
      // Utilisateur n'a accès qu'à home et finance
      const accessibleModules = [home, finance]
      const { result } = renderHook(() => useDetectModule(accessibleModules, '/finance'))
      expect(result.current.id).toBe('finance')
    })

    it('devrait fallback vers premier module accessible si route interdite', () => {
      // Utilisateur n'a accès qu'à home et finance, mais va sur /store
      const accessibleModules = [home, finance]
      const { result } = renderHook(() => useDetectModule(accessibleModules, '/store'))
      expect(result.current.id).toBe('home') // fallback vers home car store non accessible
    })

    it('devrait fallback vers premier module si module détecté non accessible', () => {
      // Utilisateur n'a accès qu'à store, mais va sur /finance
      const accessibleModules = [store]
      const { result } = renderHook(() => useDetectModule(accessibleModules, '/finance'))
      expect(result.current.id).toBe('store')
    })

    it('devrait utiliser MODULES[0] si accessibleModules est vide', () => {
      const { result } = renderHook(() => useDetectModule([], '/finance'))
      expect(result.current.id).toBe(MODULES[0]!.id)  // Safe: MODULES est une constante non-vide
    })
  })

  describe('Reactivity', () => {
    it('devrait recalculer le module si pathname change', () => {
      const { result, rerender } = renderHook(
        ({ pathname }) => useDetectModule(allModules, pathname),
        { initialProps: { pathname: '/finance' } }
      )

      expect(result.current.id).toBe('finance')

      rerender({ pathname: '/store' })
      expect(result.current.id).toBe('store')
    })

    it('devrait recalculer le module si accessibleModules change', () => {
      const { result, rerender } = renderHook(
        ({ modules }) => useDetectModule(modules, '/store'),
        { initialProps: { modules: allModules } }
      )

      expect(result.current.id).toBe('store')

      // Restriction des permissions
      rerender({ modules: [home, finance] })
      expect(result.current.id).toBe('home') // fallback car store non accessible
    })
  })
})
