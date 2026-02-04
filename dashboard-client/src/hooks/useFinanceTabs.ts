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
  // État spécial "__ALL__" pour afficher toutes les sections (par défaut)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('finance_active_tab')
      if (stored) return stored
    }
    return detectFinanceTab(pathname)
  })


  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance_active_tab', activeTab)
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
