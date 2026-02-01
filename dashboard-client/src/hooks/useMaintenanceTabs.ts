import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { MenuSection } from '@/config/modules'

export interface Tab {
  id: string
  label: string
  path: string
}

/**
 * Détecte le tab actif selon le path
 */
export function detectMaintenanceTab(path: string): string {
  if (path === '/maintenance') return 'Tableau de bord'
  if (path.startsWith('/maintenance/equipment')) return 'Équipements'
  if (path.startsWith('/maintenance/requests') || path.startsWith('/maintenance/calendar')) return 'Interventions'
  if (path.startsWith('/maintenance/reports') || path.startsWith('/maintenance/costs')) return 'Analyse'
  if (path.startsWith('/maintenance/categories') || path.startsWith('/maintenance/settings')) return 'Configuration'
  return 'Tableau de bord'
}

/**
 * Hook pour gérer les tabs du module Maintenance
 */
export function useMaintenanceTabs(sections: MenuSection[], currentPath: string) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => detectMaintenanceTab(currentPath))

  // Mettre à jour activeTab quand le path change
  useEffect(() => {
    const newTab = detectMaintenanceTab(location.pathname)
    setActiveTab(newTab)
  }, [location.pathname])

  // Générer les tabs depuis les sections (groupes tabGroup)
  const tabs = useMemo(() => {
    const uniqueTabs = new Set<string>()
    sections.forEach(section => {
      if (section.tabGroup) {
        uniqueTabs.add(section.tabGroup)
      }
    })
    return Array.from(uniqueTabs).map(tabGroup => ({
      id: tabGroup,
      label: tabGroup,
    }))
  }, [sections])

  // Filtrer sections visibles selon tab actif
  const visibleSections = useMemo(() => {
    return sections.filter(section => {
      if (!section.tabGroup) return true
      return section.tabGroup === activeTab
    })
  }, [sections, activeTab])

  return { activeTab, setActiveTab, tabs, visibleSections }
}

/**
 * Hook legacy pour compatibilité
 */
export function useMaintenanceTabsLegacy() {
  const location = useLocation()

  const tabs = useMemo<Tab[]>(() => {
    const path = location.pathname

    // Dashboard
    if (path === '/maintenance') {
      return [
        { id: 'dashboard', label: 'Tableau de bord', path: '/maintenance' },
      ]
    }

    // Équipements
    if (path.startsWith('/maintenance/equipment')) {
      return [
        { id: 'equipment', label: 'Liste Équipements', path: '/maintenance/equipment' },
        { id: 'critical', label: 'Équipements Critiques', path: '/maintenance/equipment/critical' },
      ]
    }

    // Interventions
    if (path.startsWith('/maintenance/requests') || path.startsWith('/maintenance/calendar')) {
      return [
        { id: 'requests', label: 'Demandes', path: '/maintenance/requests' },
        { id: 'emergency', label: 'Urgences', path: '/maintenance/requests/emergency' },
        { id: 'calendar', label: 'Planning', path: '/maintenance/calendar' },
      ]
    }

    // Analyse
    if (path.startsWith('/maintenance/reports') || path.startsWith('/maintenance/costs')) {
      return [
        { id: 'reports', label: 'KPI & Rapports', path: '/maintenance/reports' },
        { id: 'costs', label: 'Coûts Maintenance', path: '/maintenance/costs' },
      ]
    }

    // Configuration
    if (path.startsWith('/maintenance/categories') || path.startsWith('/maintenance/settings')) {
      return [
        { id: 'categories', label: 'Catégories', path: '/maintenance/categories' },
        { id: 'settings', label: 'Paramètres', path: '/maintenance/settings' },
      ]
    }

    return []
  }, [location.pathname])

  const activeTabLegacy = useMemo(() => {
    return tabs.find((tab) => location.pathname === tab.path)?.id || tabs[0]?.id
  }, [tabs, location.pathname])

  return { tabs, activeTab: activeTabLegacy }
}
