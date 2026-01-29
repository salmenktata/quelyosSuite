import { useEffect } from 'react'
import type { Module } from '@/config/modules'

/**
 * Hook d'auto-ouverture des menus contenant un item actif
 *
 * Parcourt tous les menus du module actif et ouvre automatiquement
 * ceux qui contiennent un sous-item correspondant à la route active.
 *
 * @param module - Module actuellement actif
 * @param pathname - Chemin URL actuel
 * @param isActive - Fonction pour vérifier si une route est active
 * @param openMenu - Fonction pour ouvrir un menu
 */
export function useAutoOpenMenus(
  module: Module,
  pathname: string,
  isActive: (path: string) => boolean,
  openMenu: (name: string) => void
): void {
  useEffect(() => {
    module.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems?.some(sub => sub.path && isActive(sub.path))) {
          openMenu(item.name)
        }
      })
    })
  }, [pathname, module, isActive, openMenu])
}
