import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/common/Button'
import type { Module, ModuleId } from '@/config/modules'
import {
  Grid3X3,
  Sun,
  Moon,
  Menu,
  ExternalLink,
  Settings,
  Home,
  ChevronUp,
} from 'lucide-react'

interface TopNavbarProps {
  currentModule: Module
  modules: Module[]
  isModuleChanging: boolean
  isAppLauncherOpen: boolean
  isVisible?: boolean
  onModuleChange: (id: ModuleId) => void
  onMenuClick: () => void
  onAppLauncherClick: () => void
  onToggleNavbar?: () => void
}

/**
 * TopNavbar - Barre de navigation supérieure
 *
 * Affiche :
 * - Bouton App Launcher
 * - Logo Quelyos
 * - Quick access pour 5 modules (home, finance, store, crm, stock)
 * - Lien vers site vitrine
 * - Lien "Voir mon site" vers e-commerce
 * - Toggle dark/light mode
 * - Bouton menu mobile
 */
export const TopNavbar = memo(function TopNavbar({
  currentModule,
  onModuleChange,
  onMenuClick,
  onAppLauncherClick,
  isAppLauncherOpen,
  isModuleChanging,
  modules,
  isVisible = true,
  onToggleNavbar
}: TopNavbarProps) {
  const { theme, toggleTheme } = useTheme()
  const Icon = currentModule.icon

  // Afficher tous les modules accessibles (limité à 10 pour inclure POS et GMAO)
  // Les modules sont déjà filtrés par permissions dans ModularLayout
  const quickModules = modules.slice(0, 10)

  return (
    <header className={`h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 fixed top-0 left-0 right-0 z-50 transition-transform duration-100 ease-out ${isVisible ? 'translate-y-0 pointer-events-auto' : '-translate-y-full pointer-events-none'}`}>
      {/* App launcher button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAppLauncherClick}
        className={`mr-3 ${
          isAppLauncherOpen
            ? 'bg-gray-700 text-white'
            : 'text-gray-100 hover:bg-gray-800 hover:text-white'
        }`}
        icon={<Grid3X3 className="h-5 w-5" />}
      >
        <span className="sr-only">Lanceur d'applications</span>
      </Button>

      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 mr-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">Q</span>
        </div>
        <span className="text-white font-semibold hidden sm:block">Quelyos</span>
      </Link>

      {/* Quick module access */}
      <nav className="hidden md:flex items-center gap-1">
        {quickModules.map((module) => {
          const ModuleIcon = module.icon
          const isActive = module.id === currentModule.id
          return (
            <Button
              key={module.id}
              variant="ghost"
              size="sm"
              onClick={() => onModuleChange(module.id)}
              loading={isModuleChanging && isActive}
              className={`${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-100 hover:bg-gray-800 hover:text-white'
              }`}
              icon={<ModuleIcon className="h-4 w-4" />}
            >
              {module.shortName}
            </Button>
          )
        })}
      </nav>

      {/* Current module indicator (mobile) */}
      <div className="md:hidden flex items-center gap-2 ml-auto mr-2">
        <div className={`p-1.5 rounded-lg ${currentModule.bgColor}`}>
          <Icon className={`h-4 w-4 ${currentModule.color}`} />
        </div>
        <span className="text-white text-sm font-medium">{currentModule.name}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Global Settings */}
        <Link
          to="/settings"
          className="p-2 rounded-lg text-gray-100 hover:bg-gray-800 hover:text-white transition-all"
          title="Paramètres Généraux"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-gray-100 hover:bg-gray-800 hover:text-white"
          title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          icon={theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        >
          <span className="sr-only">{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
        </Button>

        {/* Hide navbar button */}
        {onToggleNavbar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleNavbar}
            className="text-gray-100 hover:bg-gray-800 hover:text-white"
            title="Masquer la barre de navigation (disponible dans le menu latéral)"
            icon={<ChevronUp className="h-5 w-5" />}
          >
            <span className="sr-only">Masquer la navbar</span>
          </Button>
        )}

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden text-gray-100 hover:bg-gray-800 hover:text-white"
          icon={<Menu className="h-5 w-5" />}
        >
          <span className="sr-only">Menu</span>
        </Button>
      </div>
    </header>
  )
})
