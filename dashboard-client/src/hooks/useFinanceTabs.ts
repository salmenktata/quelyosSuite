import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectFinanceTab(pathname: string): string {
  if (pathname === '/finance') {
    return 'Tableau de bord'
  } else if (pathname.includes('/accounts') || pathname.includes('/portfolios')) {
    return 'Comptes'
  } else if (pathname.includes('/expenses') || pathname.includes('/incomes') || pathname.includes('/import')) {
    return 'Transactions'
  } else if (pathname.includes('/budgets') || pathname.includes('/forecast') || pathname.includes('/scenarios') || pathname.includes('/payment-planning')) {
    return 'Planification'
  } else if (pathname.includes('/reporting')) {
    return 'Rapports'
  } else if (pathname.includes('/categories') || pathname.includes('/suppliers') || pathname.includes('/charts') || pathname.includes('/alerts') || pathname.includes('/archives') || pathname.includes('/settings')) {
    return 'Configuration'
  }
  return 'Tableau de bord' // Default
}

export function useFinanceTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('finance_active_tab') || 'Tableau de bord'
    }
    return 'Tableau de bord'
  })

  // Auto-détection tab selon URL (synchrone, sans debounce)
  useEffect(() => {
    setActiveTab(detectFinanceTab(pathname))
  }, [pathname])

  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance_active_tab', activeTab)
    }
  }, [activeTab])

  // Filtrer sections visibles avec useMemo pour éviter re-calcul
  const visibleSections = useMemo(() =>
    sections.filter(section => section.tabGroup === activeTab),
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
