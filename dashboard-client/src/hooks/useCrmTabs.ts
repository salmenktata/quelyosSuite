import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectCrmTab(pathname: string): string {
  // Tableau de bord
  if (pathname === '/crm') {
    return 'Tableau de bord'
  }

  // Pipeline
  if (
    pathname.includes('/crm/pipeline') ||
    pathname.includes('/crm/leads')
  ) {
    return 'Pipeline'
  }

  // Clients
  if (
    pathname.includes('/crm/customers') ||
    pathname.includes('/crm/customer-categories') ||
    pathname.includes('/pricelists')
  ) {
    return 'Clients'
  }

  // Facturation
  if (
    pathname.includes('/invoices') ||
    pathname.includes('/payments')
  ) {
    return 'Facturation'
  }

  // Configuration
  if (pathname.includes('/crm/settings')) {
    return 'Configuration'
  }

  return 'Tableau de bord' // Default
}

export function useCrmTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_active_tab')
      if (stored) return stored
    }
    return 'Pipeline'
  })


  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_active_tab', activeTab)
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
