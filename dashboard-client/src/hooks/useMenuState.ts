import { useState, useCallback } from 'react'

/**
 * Hook de gestion de l'état des menus dépliables
 *
 * Gère un Set de noms de menus ouverts avec des fonctions utilitaires
 * pour toggle, ouvrir, fermer individuellement ou tous fermer.
 */

interface UseMenuStateReturn {
  openMenus: Set<string>
  toggleMenu: (name: string) => void
  openMenu: (name: string) => void
  closeMenu: (name: string) => void
  closeAllMenus: () => void
}

export function useMenuState(initialMenus: string[] = []): UseMenuStateReturn {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set(initialMenus))

  const toggleMenu = useCallback((name: string) => {
    setOpenMenus(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }, [])

  const openMenu = useCallback((name: string) => {
    setOpenMenus(prev => new Set(prev).add(name))
  }, [])

  const closeMenu = useCallback((name: string) => {
    setOpenMenus(prev => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }, [])

  const closeAllMenus = useCallback(() => {
    setOpenMenus(new Set())
  }, [])

  return { openMenus, toggleMenu, openMenu, closeMenu, closeAllMenus }
}
