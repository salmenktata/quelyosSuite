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
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext, useMemo } from 'react'

// Hooks
import { usePermissions } from '../hooks/usePermissions'
import { useActiveRoute } from '../hooks/useActiveRoute'
import { useDetectModule } from '../hooks/useDetectModule'
import { useMenuState } from '../hooks/useMenuState'
import { useAutoOpenMenus } from '../hooks/useAutoOpenMenus'

// Components
import { Button } from './common/Button'
import { SidebarMenuItem } from './navigation/SidebarMenuItem'
import { AppLauncher } from './navigation/AppLauncher'
import { TopNavbar } from './navigation/TopNavbar'

// Config & Types
import { MODULES, type Module, type ModuleId } from '@/config/modules'

// Icons
import { X, LogOut } from 'lucide-react'

// ============================================================================
// CONTEXT
// ============================================================================

interface ModuleContextType {
  currentModule: Module
  setModule: (id: ModuleId) => void
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
  const { canAccessModule } = usePermissions()
  const { isActive } = useActiveRoute()
  const { openMenus, toggleMenu, openMenu } = useMenuState()

  // Filtrer les modules selon les permissions de l'utilisateur
  const accessibleModules = useMemo(() => {
    return MODULES.filter(module => canAccessModule(module.id))
  }, [canAccessModule])

  // Detect current module from URL using custom hook
  const detectedModule = useDetectModule(accessibleModules, location.pathname)
  const [currentModule, setCurrentModule] = useState<Module>(detectedModule)

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
    <ModuleContext.Provider value={{ currentModule, setModule: handleModuleChange }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
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
            className={`w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed lg:sticky top-14 h-[calc(100vh-3.5rem)] z-50 transition-transform duration-300 flex flex-col ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Module header in sidebar */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentModule.bgColor}`}>
                {(() => {
                  const Icon = currentModule.icon
                  return <Icon className={`h-5 w-5 ${currentModule.color}`} />
                })()}
              </div>
              <div>
                <h2 className={`font-semibold ${currentModule.color}`}>{currentModule.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentModule.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden ml-auto text-gray-400"
                icon={<X className="w-5 h-5" />}
              >
                <span className="sr-only">Fermer le menu</span>
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
              {currentModule.sections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <SidebarMenuItem
                        key={item.name}
                        item={item}
                        isActive={isActive}
                        moduleColor={currentModule.color}
                        openMenus={openMenus}
                        onToggleMenu={toggleMenu}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                icon={<LogOut className="h-5 w-5" />}
              >
                Déconnexion
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
