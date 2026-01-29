import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useMenuState } from './useMenuState'

describe('useMenuState', () => {
  describe('Initialization', () => {
    it('devrait initialiser avec un Set vide par défaut', () => {
      const { result } = renderHook(() => useMenuState())
      expect(result.current.openMenus).toBeInstanceOf(Set)
      expect(result.current.openMenus.size).toBe(0)
    })

    it('devrait initialiser avec les menus fournis', () => {
      const initialMenus = ['menu1', 'menu2']
      const { result } = renderHook(() => useMenuState(initialMenus))
      expect(result.current.openMenus.size).toBe(2)
      expect(result.current.openMenus.has('menu1')).toBe(true)
      expect(result.current.openMenus.has('menu2')).toBe(true)
    })
  })

  describe('toggleMenu', () => {
    it('devrait ouvrir un menu fermé', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleMenu('menu1')
      })

      expect(result.current.openMenus.has('menu1')).toBe(true)
    })

    it('devrait fermer un menu ouvert', () => {
      const { result } = renderHook(() => useMenuState(['menu1']))

      expect(result.current.openMenus.has('menu1')).toBe(true)

      act(() => {
        result.current.toggleMenu('menu1')
      })

      expect(result.current.openMenus.has('menu1')).toBe(false)
    })

    it('devrait pouvoir toggle plusieurs fois', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.toggleMenu('menu1')
      })
      expect(result.current.openMenus.has('menu1')).toBe(true)

      act(() => {
        result.current.toggleMenu('menu1')
      })
      expect(result.current.openMenus.has('menu1')).toBe(false)

      act(() => {
        result.current.toggleMenu('menu1')
      })
      expect(result.current.openMenus.has('menu1')).toBe(true)
    })

    it('ne devrait pas affecter les autres menus lors du toggle', () => {
      const { result } = renderHook(() => useMenuState(['menu1', 'menu2']))

      act(() => {
        result.current.toggleMenu('menu1')
      })

      expect(result.current.openMenus.has('menu1')).toBe(false)
      expect(result.current.openMenus.has('menu2')).toBe(true)
    })
  })

  describe('openMenu', () => {
    it('devrait ouvrir un menu fermé', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.openMenu('menu1')
      })

      expect(result.current.openMenus.has('menu1')).toBe(true)
    })

    it('ne devrait rien faire si le menu est déjà ouvert', () => {
      const { result } = renderHook(() => useMenuState(['menu1']))

      expect(result.current.openMenus.has('menu1')).toBe(true)

      act(() => {
        result.current.openMenu('menu1')
      })

      expect(result.current.openMenus.has('menu1')).toBe(true)
    })

    it('devrait pouvoir ouvrir plusieurs menus', () => {
      const { result } = renderHook(() => useMenuState())

      act(() => {
        result.current.openMenu('menu1')
        result.current.openMenu('menu2')
        result.current.openMenu('menu3')
      })

      expect(result.current.openMenus.size).toBe(3)
      expect(result.current.openMenus.has('menu1')).toBe(true)
      expect(result.current.openMenus.has('menu2')).toBe(true)
      expect(result.current.openMenus.has('menu3')).toBe(true)
    })
  })

  describe('closeMenu', () => {
    it('devrait fermer un menu ouvert', () => {
      const { result } = renderHook(() => useMenuState(['menu1']))

      act(() => {
        result.current.closeMenu('menu1')
      })

      expect(result.current.openMenus.has('menu1')).toBe(false)
    })

    it('ne devrait rien faire si le menu est déjà fermé', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.openMenus.has('menu1')).toBe(false)

      act(() => {
        result.current.closeMenu('menu1')
      })

      expect(result.current.openMenus.has('menu1')).toBe(false)
    })

    it('ne devrait pas affecter les autres menus', () => {
      const { result } = renderHook(() => useMenuState(['menu1', 'menu2', 'menu3']))

      act(() => {
        result.current.closeMenu('menu2')
      })

      expect(result.current.openMenus.has('menu1')).toBe(true)
      expect(result.current.openMenus.has('menu2')).toBe(false)
      expect(result.current.openMenus.has('menu3')).toBe(true)
    })
  })

  describe('closeAllMenus', () => {
    it('devrait fermer tous les menus ouverts', () => {
      const { result } = renderHook(() => useMenuState(['menu1', 'menu2', 'menu3']))

      expect(result.current.openMenus.size).toBe(3)

      act(() => {
        result.current.closeAllMenus()
      })

      expect(result.current.openMenus.size).toBe(0)
    })

    it('ne devrait rien faire si aucun menu n\'est ouvert', () => {
      const { result } = renderHook(() => useMenuState())

      expect(result.current.openMenus.size).toBe(0)

      act(() => {
        result.current.closeAllMenus()
      })

      expect(result.current.openMenus.size).toBe(0)
    })
  })

  describe('Integration scenarios', () => {
    it('devrait gérer un flux utilisateur complet', () => {
      const { result } = renderHook(() => useMenuState())

      // Ouvrir plusieurs menus
      act(() => {
        result.current.openMenu('Comptes')
        result.current.openMenu('Transactions')
        result.current.openMenu('Rapports')
      })
      expect(result.current.openMenus.size).toBe(3)

      // Toggle un menu
      act(() => {
        result.current.toggleMenu('Transactions')
      })
      expect(result.current.openMenus.has('Transactions')).toBe(false)
      expect(result.current.openMenus.size).toBe(2)

      // Fermer un menu spécifique
      act(() => {
        result.current.closeMenu('Comptes')
      })
      expect(result.current.openMenus.size).toBe(1)
      expect(result.current.openMenus.has('Rapports')).toBe(true)

      // Tout fermer
      act(() => {
        result.current.closeAllMenus()
      })
      expect(result.current.openMenus.size).toBe(0)
    })

    it('devrait maintenir la stabilité des références de fonctions', () => {
      const { result, rerender } = renderHook(() => useMenuState())

      const initialToggleMenu = result.current.toggleMenu
      const initialOpenMenu = result.current.openMenu
      const initialCloseMenu = result.current.closeMenu
      const initialCloseAllMenus = result.current.closeAllMenus

      // Provoquer un re-render
      act(() => {
        result.current.openMenu('menu1')
      })
      rerender()

      // Les références doivent rester les mêmes (useCallback)
      expect(result.current.toggleMenu).toBe(initialToggleMenu)
      expect(result.current.openMenu).toBe(initialOpenMenu)
      expect(result.current.closeMenu).toBe(initialCloseMenu)
      expect(result.current.closeAllMenus).toBe(initialCloseAllMenus)
    })
  })
})
