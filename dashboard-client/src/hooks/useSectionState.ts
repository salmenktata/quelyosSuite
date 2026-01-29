import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { MenuSection } from '@/config/modules'

interface UseSectionStateReturn {
  openSections: Set<string>
  toggleSection: (sectionTitle: string) => void
  isOpenSection: (sectionTitle: string) => boolean
}

/**
 * Hook pour gérer l'état des sections collapsables du sidebar
 * @param moduleId - ID du module actuel
 * @param sections - Sections du module depuis la config
 * @returns État des sections ouvertes et fonctions de gestion
 */
export function useSectionState(
  moduleId: string,
  sections: MenuSection[]
): UseSectionStateReturn {
  const { pathname } = useLocation()

  // Init: localStorage ou première section par défaut
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(`sidebar_sections_${moduleId}`)
    if (stored) {
      try {
        return new Set(JSON.parse(stored))
      } catch {
        return new Set([sections[0]?.title])
      }
    }
    return new Set([sections[0]?.title])
  })

  // Toggle + persistance
  const toggleSection = useCallback(
    (title: string) => {
      setOpenSections((prev) => {
        const next = new Set(prev)
        if (next.has(title)) {
          next.delete(title)
        } else {
          next.add(title)
        }
        localStorage.setItem(`sidebar_sections_${moduleId}`, JSON.stringify([...next]))
        return next
      })
    },
    [moduleId]
  )

  const isOpenSection = useCallback(
    (title: string) => {
      return openSections.has(title)
    },
    [openSections]
  )

  // Auto-expand section active
  useEffect(() => {
    // Trouver la section contenant l'item actif
    const activeSection = sections.find((section) =>
      section.items.some(
        (item) =>
          (item.path && pathname.startsWith(item.path)) ||
          item.subItems?.some((sub) => sub.path && pathname.startsWith(sub.path))
      )
    )

    if (activeSection && !openSections.has(activeSection.title)) {
      toggleSection(activeSection.title)
    }
  }, [pathname, sections, openSections, toggleSection])

  return { openSections, toggleSection, isOpenSection }
}
