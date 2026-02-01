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
                ? (currentModule.id === 'finance' ? 'top-[7rem] h-[calc(100vh-7rem)]' : 'top-14 h-[calc(100vh-3.5rem)]')
                : (currentModule.id === 'finance' ? 'top-16 h-[calc(100vh-4rem)]' : 'top-0 h-screen')
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

              {(currentModule.id === 'finance' ? visibleSections : currentModule.sections).map((section, index) => (
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
                        onNavigate={currentModule.id === 'finance' ? handleFinanceSidebarNavigate : undefined}
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
                    tabs={[
                      { id: 'Tableau de bord', label: 'Tableau de bord', count: 1 },
                      { id: 'Comptes', label: 'Comptes', count: 2 },
                      { id: 'Transactions', label: 'Transactions', count: 2 },
                      { id: 'Planification', label: 'Planification', count: 4 },
                      { id: 'Rapports', label: 'Rapports', count: 5 },
                      { id: 'Configuration', label: 'Configuration', count: 9 }
                    ]}
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

            <div className={`transition-opacity duration-150 ${currentModule.id === 'finance' ? 'pt-16' : ''}`}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ModuleContext.Provider>
  )
}
