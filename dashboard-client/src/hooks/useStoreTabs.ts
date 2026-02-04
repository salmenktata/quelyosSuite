import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuSection } from '@/config/modules'

// Fonction utilitaire pour détecter le tab depuis un path
export function detectStoreTab(pathname: string): string {
  // Afficher tout le menu par défaut
  if (pathname === '/store') {
    return '__ALL__'
  }

  // Vue d'ensemble
  if (pathname.includes('/orders')) {
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

  return '__ALL__' // Default : afficher toutes les sections
}

export function useStoreTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState<string>(() => detectStoreTab(pathname))

  // Auto-détection tab selon URL (sans localStorage)
  useEffect(() => {
    setActiveTab(detectStoreTab(pathname))
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
