import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

export function detectSupportTab(pathname: string): string {
  if (pathname === '/support') return '__ALL__'
  if (pathname.includes('/support/tickets') || pathname.includes('/support/faq')) return 'Assistance'
  return '__ALL__'
}

export function useSupportTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('support_active_tab')
      if (stored) return stored
    }
    return pathname === '/support' ? '__ALL__' : detectSupportTab(pathname)
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('support_active_tab', activeTab)
    }
  }, [activeTab])

  const visibleSections = useMemo(() => {
    if (activeTab === '__ALL__') {
      return sections
    }
    return sections.filter(section => section.title === activeTab)
  }, [sections, activeTab])

  const handleSetActiveTab = useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    visibleSections
  }
}
