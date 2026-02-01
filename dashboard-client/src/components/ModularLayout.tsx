/**
 * ModularLayout - Layout principal du Dashboard avec navigation modulaire
 *
 * Fonctionnalités :
 * - Navigation modulaire par 7 modules (Home, Finance, Boutique, Stock, CRM, Marketing, RH)
 * - Menu latéral adaptatif avec sous-menus toujours dépliés
 * - Détection automatique du module actif selon l'URL
 * - App Launcher pour accès rapide aux applications
 * - Quick access navbar pour 5 modules principaux
 * - Gestion des permissions utilisateur (filtrage modules)
 * - Support dark/light mode complet
 * - Responsive mobile avec sidebar escamotable
 * - Tous les menus et sections toujours visibles (mode déplié permanent)
 * - Bouton "Voir mon site" vers e-commerce
 * - Gestion des badges et séparateurs dans les sous-menus
 * - Persistance du module actif lors de la navigation
 */
// React & Router
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react'

// Hooks
import { usePermissions } from '../hooks/usePermissions'
import { useActiveRoute } from '../hooks/useActiveRoute'
import { useDetectModule } from '../hooks/useDetectModule'
import { useMenuState } from '../hooks/useMenuState'
import { useAutoOpenMenus } from '../hooks/useAutoOpenMenus'
import { useSectionState } from '../hooks/useSectionState'
import { useNavigationHistory } from '../hooks/useNavigationHistory'
import { useFinanceTabs, detectFinanceTab } from '../hooks/useFinanceTabs'
import { useHomeTabs, detectHomeTab } from '../hooks/useHomeTabs'
import { useStoreTabs, detectStoreTab } from '../hooks/useStoreTabs'
import { useStockTabs, detectStockTab } from '../hooks/useStockTabs'
import { useCrmTabs, detectCrmTab } from '../hooks/useCrmTabs'
import { useMarketingTabs, detectMarketingTab } from '../hooks/useMarketingTabs'
import { useHrTabs, detectHrTab } from '../hooks/useHrTabs'
import { useSupportTabs, detectSupportTab } from '../hooks/useSupportTabs'
import { usePosTabs, detectPosTab } from '../hooks/usePosTabs'
import { useMaintenanceTabs, detectMaintenanceTab } from '../hooks/useMaintenanceTabs'

// Components
import { Button } from './common/Button'
import { SidebarMenuItem } from './navigation/SidebarMenuItem'
import { AppLauncher } from './navigation/AppLauncher'
import { TopNavbar } from './navigation/TopNavbar'
import { QuickAccess } from './navigation/QuickAccess'
import { CommandPalette } from './navigation/CommandPalette'
import { SectionTabs } from './navigation/SectionTabs'

// Config & Types
import { MODULES, type Module, type ModuleId } from '@/config/modules'
import { MODULE_HEADER_CLASSES } from '@/config/layout'

// Icons
import { X, LogOut, ChevronsLeft, ChevronsRight, Minimize2, Maximize2, PanelTop, PanelTopClose, ChevronDown } from 'lucide-react'

// Constants
const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Génère automatiquement les tabs à partir des sections d'un module
 * Les groupes du menu sidebar (section.title) deviennent des tabs
 * @param sections - Sections du module
 * @returns Array de tabs avec id, label et count (nombre d'items dans la section)
 */
function generateTabsFromSections(sections: Module['sections']) {
  return sections.map(section => ({
    id: section.title,
    label: section.title,
    count: section.items.length
  }))
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ModuleContextType {
  currentModule: Module
  setModule: (id: ModuleId) => void
  /** @deprecated Use document.title or Breadcrumbs instead */
  setTitle: (title: string) => void
}

const ModuleContext = createContext<ModuleContextType | null>(null)

export const useModule = () => {
  const context = useContext(ModuleContext)
  if (!context) throw new Error('useModule must be used within ModularLayout')
  return context
}

// ============================================================================
// MAIN LAYOUT
// ============================================================================

export function ModularLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false)
  const [isModuleChanging, setIsModuleChanging] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  })
  const { canAccessModule } = usePermissions()
  const [isNavbarVisible, setIsNavbarVisible] = useState(() => {
    return localStorage.getItem('navbar_visible') !== 'false'
  })

  const toggleNavbar = () => {
    const newValue = !isNavbarVisible
    setIsNavbarVisible(newValue)
    localStorage.setItem('navbar_visible', String(newValue))
  }

  const toggleSidebarCollapse = () => {
    const newValue = !isSidebarCollapsed
    setIsSidebarCollapsed(newValue)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
  }

  const { isActive } = useActiveRoute()
  const { openMenus, toggleMenu, openMenu } = useMenuState()

  // Filtrer les modules selon les permissions de l'utilisateur
  const accessibleModules = useMemo(() => {
    return MODULES.filter(module => canAccessModule(module.id))
  }, [canAccessModule])

  // Detect current module from URL using custom hook
  const detectedModule = useDetectModule(accessibleModules, location.pathname)
  const [currentModule, setCurrentModule] = useState<Module>(detectedModule)

  // State for sections (toujours ouvertes)
  const { openSections: _openSections, toggleSection: _toggleSection, isOpenSection: _isOpenSection } = useSectionState(
    currentModule.id,
    currentModule.sections
  )

  // Finance tabs logic
  const { activeTab, setActiveTab, visibleSections } = useFinanceTabs(
    currentModule.sections,
    location.pathname
  )

  // Handler pour changement de tab (filtre sidebar uniquement, sans navigation auto)
  const handleFinanceTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId)
    // Pas de navigation automatique : l'utilisateur choisit la page dans le sidebar filtré
  }, [setActiveTab])

  // Handler pour navigation sidebar Finance (change tab AVANT navigation React Router)
  const handleFinanceSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'finance') {
      // Détecte et change le tab immédiatement (synchrone)
      const targetTab = detectFinanceTab(path)
      setActiveTab(targetTab)
    }
  }, [currentModule.id, setActiveTab])

  // Home tabs logic
  const {
    activeTab: homeActiveTab,
    setActiveTab: setHomeActiveTab,
    visibleSections: homeVisibleSections
  } = useHomeTabs(currentModule.sections, location.pathname)

  // Handler pour changement de tab Home
  const handleHomeTabChange = useCallback((tabId: string) => {
    setHomeActiveTab(tabId)
  }, [setHomeActiveTab])

  // Handler pour navigation sidebar Home
  const handleHomeSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'home') {
      const targetTab = detectHomeTab(path)
      setHomeActiveTab(targetTab)
    }
  }, [currentModule.id, setHomeActiveTab])

  // Store tabs logic
  const {
    activeTab: storeActiveTab,
    setActiveTab: setStoreActiveTab,
    visibleSections: storeVisibleSections
  } = useStoreTabs(currentModule.sections, location.pathname)

  // Handler pour changement de tab Store
  const handleStoreTabChange = useCallback((tabId: string) => {
    setStoreActiveTab(tabId)
  }, [setStoreActiveTab])

  // Handler pour navigation sidebar Store
  const handleStoreSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'store') {
      const targetTab = detectStoreTab(path)
      setStoreActiveTab(targetTab)
    }
  }, [currentModule.id, setStoreActiveTab])

  // Stock tabs logic
  const {
    activeTab: stockActiveTab,
    setActiveTab: setStockActiveTab,
    visibleSections: stockVisibleSections
  } = useStockTabs(currentModule.sections, location.pathname)

  // Handler pour changement de tab Stock
  const handleStockTabChange = useCallback((tabId: string) => {
    setStockActiveTab(tabId)
  }, [setStockActiveTab])

  // Handler pour navigation sidebar Stock
  const handleStockSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'stock') {
      const targetTab = detectStockTab(path)
      setStockActiveTab(targetTab)
    }
  }, [currentModule.id, setStockActiveTab])

  // CRM tabs logic
  const {
    activeTab: crmActiveTab,
    setActiveTab: setCrmActiveTab,
    visibleSections: crmVisibleSections
  } = useCrmTabs(currentModule.sections, location.pathname)

  // Handler pour changement de tab CRM
  const handleCrmTabChange = useCallback((tabId: string) => {
    setCrmActiveTab(tabId)
  }, [setCrmActiveTab])

  // Handler pour navigation sidebar CRM
  const handleCrmSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'crm') {
      const targetTab = detectCrmTab(path)
      setCrmActiveTab(targetTab)
    }
  }, [currentModule.id, setCrmActiveTab])

  // Marketing tabs logic
  const {
    activeTab: marketingActiveTab,
    setActiveTab: setMarketingActiveTab,
    visibleSections: marketingVisibleSections
  } = useMarketingTabs(currentModule.sections, location.pathname)

  // Handler pour changement de tab Marketing
  const handleMarketingTabChange = useCallback((tabId: string) => {
    setMarketingActiveTab(tabId)
  }, [setMarketingActiveTab])

  // Handler pour navigation sidebar Marketing
  const handleMarketingSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'marketing') {
      const targetTab = detectMarketingTab(path)
      setMarketingActiveTab(targetTab)
    }
  }, [currentModule.id, setMarketingActiveTab])

  // HR tabs logic
  const {
    activeTab: hrActiveTab,
    setActiveTab: setHrActiveTab,
    visibleSections: hrVisibleSections
  } = useHrTabs(currentModule.sections, location.pathname)

  const handleHrTabChange = useCallback((tabId: string) => {
    setHrActiveTab(tabId)
  }, [setHrActiveTab])

  const handleHrSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'hr') {
      const targetTab = detectHrTab(path)
      setHrActiveTab(targetTab)
    }
  }, [currentModule.id, setHrActiveTab])

  // Support tabs logic
  const {
    activeTab: supportActiveTab,
    setActiveTab: setSupportActiveTab,
    visibleSections: supportVisibleSections
  } = useSupportTabs(currentModule.sections, location.pathname)

  const handleSupportTabChange = useCallback((tabId: string) => {
    setSupportActiveTab(tabId)
  }, [setSupportActiveTab])

  const handleSupportSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'support') {
      const targetTab = detectSupportTab(path)
      setSupportActiveTab(targetTab)
    }
  }, [currentModule.id, setSupportActiveTab])

  // POS tabs logic
  const {
    activeTab: posActiveTab,
    setActiveTab: setPosActiveTab,
    visibleSections: posVisibleSections
  } = usePosTabs(currentModule.sections, location.pathname)

  const handlePosTabChange = useCallback((tabId: string) => {
    setPosActiveTab(tabId)
  }, [setPosActiveTab])

  const handlePosSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'pos') {
      const targetTab = detectPosTab(path)
      setPosActiveTab(targetTab)
    }
  }, [currentModule.id, setPosActiveTab])

  // Maintenance tabs logic
  const {
    activeTab: maintenanceActiveTab,
    setActiveTab: setMaintenanceActiveTab,
    visibleSections: maintenanceVisibleSections
  } = useMaintenanceTabs(currentModule.sections, location.pathname)

  const handleMaintenanceTabChange = useCallback((tabId: string) => {
    setMaintenanceActiveTab(tabId)
  }, [setMaintenanceActiveTab])

  const handleMaintenanceSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'maintenance') {
      const targetTab = detectMaintenanceTab(path)
      setMaintenanceActiveTab(targetTab)
    }
  }, [currentModule.id, setMaintenanceActiveTab])

  // Mémoriser les tabs pour éviter régénération inutile
  const currentModuleTabs = useMemo(() => {
    return generateTabsFromSections(currentModule.sections)
  }, [currentModule.id, currentModule.sections])

  // Navigation history & favorites
  const { recentPages, favorites, toggleFavorite, isFavorite } = useNavigationHistory()

  useEffect(() => {
    setCurrentModule(detectedModule)
  }, [detectedModule])

  const handleModuleChange = useCallback(async (moduleId: ModuleId) => {
    setIsModuleChanging(true)
    const module = MODULES.find(m => m.id === moduleId)!
    setCurrentModule(module)
    navigate(module.basePath)
    // Délai minimal pour feedback visuel
    setTimeout(() => setIsModuleChanging(false), 300)
  }, [navigate])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('session_id')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_source')
    window.location.href = '/login'
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Auto-open menus with active items
  useAutoOpenMenus(currentModule, location.pathname, isActive, openMenu)

  return (
    <ModuleContext.Provider value={{ currentModule, setModule: handleModuleChange, setTitle: () => {} }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Command Palette (global) */}
        <CommandPalette />

        {/* Top Navbar */}
        <TopNavbar
          currentModule={currentModule}
          onModuleChange={handleModuleChange}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onAppLauncherClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
          isAppLauncherOpen={isAppLauncherOpen}
          isModuleChanging={isModuleChanging}
          modules={accessibleModules}
          isVisible={isNavbarVisible}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleNavbar={toggleNavbar}
        />

        {/* App Launcher Popup */}
        <AppLauncher
          currentModule={currentModule}
          onSelect={handleModuleChange}
          isOpen={isAppLauncherOpen}
          onClose={() => setIsAppLauncherOpen(false)}
          modules={accessibleModules}
        />

        <div className="flex-1 flex">
          {/* Overlay mobile */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          )}

          {/* Sidebar */}
          <aside
            className={`${isSidebarCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed lg:sticky ${
              isNavbarVisible
                ? (currentModule.id === 'finance' || currentModule.id === 'home' || currentModule.id === 'store' || currentModule.id === 'stock' || currentModule.id === 'crm' || currentModule.id === 'marketing' || currentModule.id === 'hr' || currentModule.id === 'support' || currentModule.id === 'pos' || currentModule.id === 'maintenance' ? 'top-[7rem] h-[calc(100vh-7rem)]' : 'top-14 h-[calc(100vh-3.5rem)]')
                : (currentModule.id === 'finance' || currentModule.id === 'home' ? 'top-16 h-[calc(100vh-4rem)]' : 'top-0 h-screen')
            } z-30 transition-all duration-200 ease-out flex flex-col ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Mobile header - Bouton pour fermer le menu */}
            <div className={`lg:hidden ${MODULE_HEADER_CLASSES} sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentModule.bgColor}`}>
                  {(() => {
                    const Icon = currentModule.icon
                    return <Icon className={`h-5 w-5 ${currentModule.color}`} />
                  })()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h2 className={`font-semibold ${currentModule.color} truncate`}>{currentModule.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentModule.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMobileMenuOpen(false)
                }}
                className="text-gray-400"
                icon={<X className="w-5 h-5" />}
              >
                <span className="sr-only">Fermer le menu</span>
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-4 px-3">
              {/* Quick Access (favoris/récents) */}
              <QuickAccess
                favorites={favorites}
                recentPages={recentPages}
                moduleColor={currentModule.color}
                isActive={isActive}
                isCollapsed={isSidebarCollapsed}
              />

              {(currentModule.id === 'finance' ? visibleSections
                : currentModule.id === 'home' ? homeVisibleSections
                : currentModule.id === 'store' ? storeVisibleSections
                : currentModule.id === 'stock' ? stockVisibleSections
                : currentModule.id === 'crm' ? crmVisibleSections
                : currentModule.id === 'marketing' ? marketingVisibleSections
                : currentModule.id === 'hr' ? hrVisibleSections
                : currentModule.id === 'support' ? supportVisibleSections
                : currentModule.id === 'pos' ? posVisibleSections
                : currentModule.id === 'maintenance' ? maintenanceVisibleSections
                : currentModule.sections
              ).map((section, index) => (
                <div
                  key={section.title}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Header (masqué en mode collapsed) */}
                  {!isSidebarCollapsed && (
                    <div
                      className="w-full flex items-center px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 sticky top-0 z-10 bg-white dark:bg-gray-800 mb-2"
                    >
                      <span>{section.title}</span>
                    </div>
                  )}

                  {/* Items (toujours affichés) */}
                  <div id={`section-${section.title}`} className="space-y-0.5">
                    {section.items.map((item) => (
                      <SidebarMenuItem
                        key={item.name}
                        item={item}
                        isActive={isActive}
                        moduleColor={currentModule.color}
                        openMenus={openMenus}
                        onToggleMenu={toggleMenu}
                        isCollapsed={isSidebarCollapsed}
                        isFavorite={item.path ? isFavorite(item.path) : false}
                        onToggleFavorite={item.path ? () => toggleFavorite(item.path!) : undefined}
                        onNavigate={
                          currentModule.id === 'finance' ? handleFinanceSidebarNavigate
                          : currentModule.id === 'home' ? handleHomeSidebarNavigate
                          : currentModule.id === 'store' ? handleStoreSidebarNavigate
                          : currentModule.id === 'stock' ? handleStockSidebarNavigate
                          : currentModule.id === 'crm' ? handleCrmSidebarNavigate
                          : currentModule.id === 'marketing' ? handleMarketingSidebarNavigate
                          : currentModule.id === 'hr' ? handleHrSidebarNavigate
                          : currentModule.id === 'support' ? handleSupportSidebarNavigate
                          : currentModule.id === 'pos' ? handlePosSidebarNavigate
                          : currentModule.id === 'maintenance' ? handleMaintenanceSidebarNavigate
                          : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className={`border-t border-gray-200 dark:border-gray-700 ${isSidebarCollapsed ? 'px-2 py-3' : 'px-3 py-3'} space-y-2`}>
              {/* Toggle collapse button - desktop only */}
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isSidebarCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
              >
                {isSidebarCollapsed ? (
                  <ChevronsRight className="h-5 w-5" />
                ) : (
                  <>
                    <ChevronsLeft className="h-5 w-5" />
                    <span>Réduire</span>
                  </>
                )}
              </button>

              {/* Logout button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={`w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-start'}`}
                icon={<LogOut className="h-5 w-5" />}
                title={isSidebarCollapsed ? 'Déconnexion' : undefined}
              >
                {!isSidebarCollapsed && 'Déconnexion'}
              </Button>
            </div>
          </aside>

          {/* Main content */}
          <main className={`flex-1 lg:ml-0 overflow-auto ${isNavbarVisible ? 'pt-14' : 'pt-0'}`}>
            {/* Home Tabs - Navigation par sections */}
            {currentModule.id === 'home' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="home"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={homeActiveTab}
                    onTabChange={handleHomeTabChange}
                  />
                </div>
                {/* Bouton pour réafficher la navbar (visible quand navbar cachée) */}
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Store Tabs - Navigation par sections */}
            {currentModule.id === 'store' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="store"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={storeActiveTab}
                    onTabChange={handleStoreTabChange}
                  />
                </div>
                {/* Bouton pour réafficher la navbar (visible quand navbar cachée) */}
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Stock Tabs - Navigation par sections */}
            {currentModule.id === 'stock' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="stock"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={stockActiveTab}
                    onTabChange={handleStockTabChange}
                  />
                </div>
                {/* Bouton pour réafficher la navbar (visible quand navbar cachée) */}
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* CRM Tabs - Navigation par sections */}
            {currentModule.id === 'crm' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="crm"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={crmActiveTab}
                    onTabChange={handleCrmTabChange}
                  />
                </div>
                {/* Bouton pour réafficher la navbar (visible quand navbar cachée) */}
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Marketing Tabs - Navigation par sections */}
            {currentModule.id === 'marketing' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="marketing"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={marketingActiveTab}
                    onTabChange={handleMarketingTabChange}
                  />
                </div>
                {/* Bouton pour réafficher la navbar (visible quand navbar cachée) */}
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* HR Tabs - Navigation par sections */}
            {currentModule.id === 'hr' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="hr"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={hrActiveTab}
                    onTabChange={handleHrTabChange}
                  />
                </div>
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Support Tabs - Navigation par sections */}
            {currentModule.id === 'support' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="support"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={supportActiveTab}
                    onTabChange={handleSupportTabChange}
                  />
                </div>
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* POS Tabs - Navigation par sections */}
            {currentModule.id === 'pos' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="pos"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={posActiveTab}
                    onTabChange={handlePosTabChange}
                  />
                </div>
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Maintenance Tabs - Navigation par sections */}
            {currentModule.id === 'maintenance' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="maintenance"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={maintenanceActiveTab}
                    onTabChange={handleMaintenanceTabChange}
                  />
                </div>
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Finance Tabs - Navigation par sections */}
            {currentModule.id === 'finance' && (
              <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
                <div className="flex-1">
                  <SectionTabs
                    moduleId="finance"
                    moduleName={currentModule.name}
                    moduleDescription={currentModule.description}
                    moduleColor={currentModule.color}
                    moduleBgColor={currentModule.bgColor}
                    moduleIcon={currentModule.icon}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
                    tabs={currentModuleTabs}
                    activeTab={activeTab}
                    onTabChange={handleFinanceTabChange}
                  />
                </div>
                {/* Bouton pour réafficher la navbar (visible quand navbar cachée) */}
                {!isNavbarVisible && (
                  <button
                    onClick={toggleNavbar}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-4"
                    title="Afficher la barre de navigation"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            <div className={`transition-opacity duration-150 ${currentModule.id === 'finance' || currentModule.id === 'home' || currentModule.id === 'store' || currentModule.id === 'stock' || currentModule.id === 'crm' || currentModule.id === 'marketing' || currentModule.id === 'hr' || currentModule.id === 'support' || currentModule.id === 'pos' || currentModule.id === 'maintenance' ? 'pt-16' : ''}`}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ModuleContext.Provider>
  )
}
