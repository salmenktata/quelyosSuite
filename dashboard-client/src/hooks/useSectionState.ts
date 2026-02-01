import { useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

interface UseSectionStateReturn {
  openSections: Set<string>
  toggleSection: (sectionTitle: string) => void
  isOpenSection: (sectionTitle: string) => boolean
}

/**
 * Hook pour gérer l'état des sections du sidebar
 * TOUTES les sections sont toujours ouvertes (mode déplié permanent)
 * @param _moduleId - ID du module actuel (non utilisé)
 * @param sections - Sections du module depuis la config
 * @returns État des sections (toutes ouvertes) et fonctions de gestion (no-op)
 */
export function useSectionState(
  _moduleId: string,
  sections: MenuSection[]
): UseSectionStateReturn {
  // Toutes les sections sont toujours ouvertes
  const openSections = new Set(sections.map(s => s.title))

  // No-op: les sections sont toujours ouvertes
  const toggleSection = useCallback(
    (_title: string) => {
      // Ne rien faire - sections toujours ouvertes
    },
    []
  )

  const isOpenSection = useCallback(
    (_title: string) => {
      return true // Toujours ouvert
    },
    []
  )

  return { openSections, toggleSection, isOpenSection }
}
