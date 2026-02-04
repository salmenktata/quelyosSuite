import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectMarketingTab(pathname: string): string {
  // Tableau de bord
  if (pathname === '/marketing') {
    return '__ALL__'
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

  return '__ALL__' // Default
}

export function useMarketingTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => detectMarketingTab(pathname))

  // Auto-détection tab selon URL (sans localStorage)
  useEffect(() => {
    setActiveTab(detectMarketingTab(pathname))
  }, [pathname])

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
