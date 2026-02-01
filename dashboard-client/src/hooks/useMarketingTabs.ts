import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectMarketingTab(pathname: string): string {
  // Tableau de bord
  if (pathname === '/marketing') {
    return 'Tableau de bord'
  }

  // Emails
  if (pathname.includes('/marketing/email')) {
    return 'Emails'
  }

  // SMS
  if (pathname.includes('/marketing/sms')) {
    return 'SMS'
  }

  // Audiences
  if (pathname.includes('/marketing/lists')) {
    return 'Audiences'
  }

  // Configuration
  if (pathname.includes('/marketing/settings')) {
    return 'Configuration'
  }

  return 'Tableau de bord' // Default
}

export function useMarketingTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('marketing_active_tab') || 'Tableau de bord'
    }
    return 'Tableau de bord'
  })

  // Auto-détection tab selon URL (synchrone, sans debounce)
  useEffect(() => {
    setActiveTab(detectMarketingTab(pathname))
  }, [pathname])

  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketing_active_tab', activeTab)
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
