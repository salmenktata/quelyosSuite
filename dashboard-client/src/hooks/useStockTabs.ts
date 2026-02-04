import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectStockTab(pathname: string): string {
  // Tableau de bord
  if (pathname === '/stock') {
    return '__ALL__'
  }

  // Stock
  if (
    pathname.includes('/stock/inventory') ||
    pathname.includes('/inventory') ||
    pathname.includes('/stock/reordering-rules') ||
    pathname.includes('/stock/inventory-groups')
  ) {
    return 'Stock'
  }

  // Logistique
  if (
    pathname.includes('/stock/moves') ||
    pathname.includes('/stock/transfers') ||
    pathname.includes('/warehouses') ||
    pathname.includes('/stock/locations')
  ) {
    return 'Logistique'
  }

  // Analyse
  if (
    pathname.includes('/stock/valuation') ||
    pathname.includes('/stock/turnover')
  ) {
    return 'Analyse'
  }

  // Configuration
  if (
    pathname.includes('/stock/warehouse-calendars') ||
    pathname.includes('/stock/settings')
  ) {
    return 'Configuration'
  }

  return '__ALL__' // Default
}

export function useStockTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => detectStockTab(pathname))

  // Auto-détection tab selon URL (sans localStorage)
  useEffect(() => {
    setActiveTab(detectStockTab(pathname))
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
