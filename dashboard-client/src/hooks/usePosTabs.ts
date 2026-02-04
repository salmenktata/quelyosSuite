import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

export function detectPosTab(pathname: string): string {
  if (pathname === '/pos') return '__ALL__'
  if (pathname.includes('/pos/terminal') || pathname.includes('/pos/rush') || pathname.includes('/pos/kiosk') || pathname.includes('/pos/mobile') || pathname.includes('/pos/kds') || pathname.includes('/pos/customer-display') || pathname.includes('/pos/session')) return 'Caisse'
  if (pathname.includes('/pos/orders') || pathname.includes('/pos/sessions') || pathname.includes('/pos/click-collect')) return 'Gestion'
  if (pathname.includes('/pos/reports') || pathname.includes('/pos/analytics')) return 'Rapports'
  if (pathname.includes('/pos/settings')) return 'Configuration'
  return '__ALL__'
}

export function usePosTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_active_tab') || '__ALL__'
    }
    return '__ALL__'
  })

  useEffect(() => {
    if (pathname === '/pos') {
      setActiveTab('__ALL__')
    } else {
      setActiveTab(detectPosTab(pathname))
    }
  }, [pathname])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_active_tab', activeTab)
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
