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
      return localStorage.getItem('home_active_tab') || '__ALL__'
    }
    return '__ALL__'
  })


  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('home_active_tab', activeTab)
    }
  }, [activeTab])

  // Filtrer sections visibles : si __ALL__, afficher toutes les sections
  const visibleSections = useMemo(() => {
    if (activeTab === '__ALL__') {
      return sections
    }
    return sections.filter(section => section.title === activeTab)
  }, [sections, activeTab])

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
