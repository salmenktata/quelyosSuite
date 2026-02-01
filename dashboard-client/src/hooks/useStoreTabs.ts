import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectStoreTab(pathname: string): string {
  // Vue d'ensemble
  if (
    pathname === '/store' ||
    pathname.includes('/orders')
  ) {
    return 'Vue d\'ensemble'
  }

  // Catalogue
  if (
    pathname.includes('/products') ||
    pathname.includes('/categories') ||
    pathname.includes('/attributes') ||
    pathname.includes('/collections') ||
    pathname.includes('/bundles') ||
    pathname.includes('/import-export')
  ) {
    return 'Catalogue'
  }

  // Marketing
  if (
    pathname.includes('/coupons') ||
    pathname.includes('/flash-sales') ||
    pathname.includes('/featured') ||
    pathname.includes('/promo-banners') ||
    pathname.includes('/hero-slides') ||
    pathname.includes('/marketing-popups') ||
    pathname.includes('/live-events') ||
    pathname.includes('/trending-products') ||
    pathname.includes('/abandoned-carts')
  ) {
    return 'Marketing'
  }

  // Contenu
  if (
    pathname.includes('/reviews') ||
    pathname.includes('/testimonials') ||
    pathname.includes('/loyalty') ||
    pathname.includes('/faq') ||
    pathname.includes('/static-pages') ||
    pathname.includes('/blog') ||
    pathname.includes('/menus') ||
    pathname.includes('/promo-messages') ||
    pathname.includes('/trust-badges')
  ) {
    return 'Contenu'
  }

  // Thèmes
  if (pathname.includes('/themes')) {
    return 'Thèmes'
  }

  // Configuration
  if (
    pathname.includes('/tickets') ||
    pathname.includes('/sales-reports') ||
    pathname.includes('/stock-alerts') ||
    pathname.includes('/settings')
  ) {
    return 'Configuration'
  }

  return 'Vue d\'ensemble' // Default
}

export function useStoreTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('store_active_tab') || 'Vue d\'ensemble'
    }
    return 'Vue d\'ensemble'
  })

  // Auto-détection tab selon URL (synchrone, sans debounce)
  useEffect(() => {
    setActiveTab(detectStoreTab(pathname))
  }, [pathname])

  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('store_active_tab', activeTab)
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
