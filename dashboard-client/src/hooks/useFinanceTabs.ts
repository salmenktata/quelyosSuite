import { useState, useEffect } from 'react'
import type { MenuSection } from '@/config/modules'

export function useFinanceTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('finance_active_tab') || 'gestion'
    }
    return 'gestion'
  })

  // Auto-détection tab selon URL
  useEffect(() => {
    if (pathname.includes('/reporting') || pathname.includes('/budgets') || pathname.includes('/cashflow') || pathname.includes('/scenarios')) {
      setActiveTab('analyse')
    } else if (pathname.includes('/categories') || pathname.includes('/settings') || pathname.includes('/suppliers') || pathname.includes('/chart-of-accounts') || pathname.includes('/alerts') || pathname.includes('/import') || pathname.includes('/archives')) {
      setActiveTab('parametres')
    } else if (pathname === '/finance' || pathname.includes('/accounts') || pathname.includes('/transactions') || pathname.includes('/expenses') || pathname.includes('/revenues')) {
      setActiveTab('gestion')
    }
  }, [pathname])

  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance_active_tab', activeTab)
    }
  }, [activeTab])

  // Filtrer sections visibles selon tab active
  const visibleSections = sections.filter(section =>
    section.tabGroup === activeTab
  )

  return {
    activeTab,
    setActiveTab,
    visibleSections
  }
}
