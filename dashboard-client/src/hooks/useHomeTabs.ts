import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectHomeTab(pathname: string): string {
  if (pathname === '/dashboard' || pathname === '/analytics') {
    return 'Tableau de bord'
  } else if (pathname === '/settings') {
    return 'Paramètres'
  }
  return 'Tableau de bord' // Default
}

export function useHomeTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('home_active_tab') || 'Tableau de bord'
    }
    return 'Tableau de bord'
  })

  // Auto-détection tab selon URL (synchrone, sans debounce)
  useEffect(() => {
    setActiveTab(detectHomeTab(pathname))
  }, [pathname])

  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('home_active_tab', activeTab)
    }
  }, [activeTab])

  // Filtrer sections visibles avec useMemo pour éviter re-calcul
  const visibleSections = useMemo(() =>
    sections.filter(section => section.title === activeTab),
    [sections, activeTab]
  )

  // Optimiser setActiveTab avec useCallback
  const handleSetActiveTab = useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    visibleSections
  }
}
