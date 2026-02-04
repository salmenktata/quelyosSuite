import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

export function detectHrTab(pathname: string): string {
  if (pathname === '/hr') return '__ALL__'
  if (pathname.includes('/hr/employees') || pathname.includes('/hr/departments') || pathname.includes('/hr/jobs') || pathname.includes('/hr/contracts')) return 'Personnel'
  if (pathname.includes('/hr/attendance') || pathname.includes('/hr/leaves')) return 'Temps & Congés'
  if (pathname.includes('/hr/appraisals') || pathname.includes('/hr/skills')) return 'Évaluations'
  if (pathname.includes('/hr/settings')) return 'Configuration'
  return '__ALL__'
}

export function useHrTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hr_active_tab')
      if (stored) return stored
    }
    return pathname === '/hr' ? '__ALL__' : detectHrTab(pathname)
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr_active_tab', activeTab)
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
