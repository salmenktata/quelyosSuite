/**
 * ModularLayout - Layout principal du Dashboard avec navigation modulaire
 *
 * Fonctionnalités :
 * - Navigation modulaire par 7 modules (Home, Finance, Boutique, Stock, CRM, Marketing, RH)
 * - Menu latéral adaptatif avec sous-menus dépliables
 * - Détection automatique du module actif selon l'URL
 * - App Launcher pour accès rapide aux applications
 * - Quick access navbar pour 5 modules principaux
 * - Gestion des permissions utilisateur (filtrage modules)
 * - Support dark/light mode complet
 * - Responsive mobile avec sidebar escamotable
 * - Auto-ouverture des sous-menus contenant la page active
 * - Bouton "Voir mon site" vers e-commerce
 * - Gestion des badges et séparateurs dans les sous-menus
 * - Persistance du module actif lors de la navigation
 */
// React & Router
import { _Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext, useMemo } from 'react'

// Hooks
import { usePermissions } from '../hooks/usePermissions'
import { useActiveRoute } from '../hooks/useActiveRoute'
import { useDetectModule } from '../hooks/useDetectModule'
import { useMenuState } from '../hooks/useMenuState'
import { useAutoOpenMenus } from '../hooks/useAutoOpenMenus'
import { useSectionState } from '../hooks/useSectionState'
import { useNavigationHistory } from '../hooks/useNavigationHistory'

// Components
import { Button } from './common/Button'
import { SidebarMenuItem } from './navigation/SidebarMenuItem'
import { AppLauncher } from './navigation/AppLauncher'
import { TopNavbar } from './navigation/TopNavbar'
import { QuickAccess } from './navigation/QuickAccess'
import { CommandPalette } from './navigation/CommandPalette'

// Config & Types
import { MODULES, type Module, type ModuleId } from '@/config/modules'

// Icons
import { X, LogOut, ChevronsLeft, ChevronsRight, ChevronDown, ChevronRight, Minimize2, Maximize2 } from 'lucide-react'

// Constants
const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'
const SIDEBAR_COMPACT_MODE_KEY = 'sidebar_compact_mode'

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
  const [isCompactMode, setIsCompactMode] = useState(() => {
    return localStorage.getItem(SIDEBAR_COMPACT_MODE_KEY) === 'true'
  })
  const { canAccessModule } = usePermissions()

  const toggleSidebarCollapse = () => {
    const newValue = !isSidebarCollapsed
    setIsSidebarCollapsed(newValue)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
  }

  const toggleCompactMode = () => {
    const newValue = !isCompactMode
    setIsCompactMode(newValue)
    localStorage.setItem(SIDEBAR_COMPACT_MODE_KEY, String(newValue))
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

  // State for collapsable sections
  const { _openSections, toggleSection, isOpenSection } = useSectionState(
    currentModule.id,
    currentModule.sections
  )

  // Navigation history & favorites
  const { recentPages, favorites, toggleFavorite, isFavorite } = useNavigationHistory()

  useEffect(() => {
    setCurrentModule(detectedModule)
  }, [detectedModule])

  const handleModuleChange = async (moduleId: ModuleId) => {
    setIsModuleChanging(true)
    const module = MODULES.find(m => m.id === moduleId)!
    setCurrentModule(module)
    navigate(module.basePath)
    // Délai minimal pour feedback visuel
    setTimeout(() => setIsModuleChanging(false), 300)
  }

  const handleLogout = () => {
    localStorage.removeItem('session_id')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_source')
    window.location.href = '/login'
  }

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
            className={`${isSidebarCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed lg:sticky top-14 h-[calc(100vh-3.5rem)] z-50 transition-all duration-300 flex flex-col ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Module header in sidebar */}
            <div className={`border-b border-gray-200 dark:border-gray-700 flex items-center ${isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3 gap-3'}`}>
              <div className={`p-2 rounded-lg ${currentModule.bgColor}`}>
                {(() => {
                  const Icon = currentModule.icon
                  return <Icon className={`h-5 w-5 ${currentModule.color}`} />
                })()}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <h2 className={`font-semibold ${currentModule.color} truncate`}>{currentModule.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentModule.description}</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`lg:hidden text-gray-400 ${isSidebarCollapsed ? '' : 'ml-auto'}`}
                icon={<X className="w-5 h-5" />}
              >
                <span className="sr-only">Fermer le menu</span>
              </Button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto ${isCompactMode ? 'py-2 space-y-2 px-2' : 'py-4 space-y-4 px-3'}`}>
              {/* Quick Access (favoris/récents) */}
              <QuickAccess
                favorites={favorites}
                recentPages={recentPages}
                moduleColor={currentModule.color}
                isActive={isActive}
              />

              {currentModule.sections.map((section) => (
                <div key={section.title}>
                  {/* Header cliquable (masqué en mode collapsed) */}
                  {!isSidebarCollapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded group sticky top-0 z-10 bg-white dark:bg-gray-800 ${isCompactMode ? 'mb-1' : 'mb-2'}`}
                      aria-expanded={isOpenSection(section.title)}
                      aria-controls={`section-${section.title}`}
                    >
                      <span>{section.title}</span>
                      {isOpenSection(section.title) ? (
                        <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      ) : (
                        <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  )}

                  {/* Items (affichés si section ouverte OU mode collapsed) */}
                  {(isSidebarCollapsed || isOpenSection(section.title)) && (
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
                          isCompact={isCompactMode}
                          isFavorite={item.path ? isFavorite(item.path) : false}
                          onToggleFavorite={item.path ? () => toggleFavorite(item.path!) : undefined}
                        />
                      ))}
                    </div>
                  )}
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

              {/* Toggle Compact mode - visible uniquement en mode normal */}
              {!isSidebarCollapsed && (
                <button
                  onClick={toggleCompactMode}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={isCompactMode ? 'Mode normal' : 'Mode compact'}
                >
                  {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  <span>{isCompactMode ? 'Mode normal' : 'Mode compact'}</span>
                </button>
              )}

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
          <main className="flex-1 lg:ml-0">{children}</main>
        </div>
      </div>
    </ModuleContext.Provider>
  )
}
