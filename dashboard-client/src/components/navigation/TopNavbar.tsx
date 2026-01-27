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
} from 'lucide-react'

interface TopNavbarProps {
  currentModule: Module
  modules: Module[]
  isModuleChanging: boolean
  isAppLauncherOpen: boolean
  onModuleChange: (id: ModuleId) => void
  onMenuClick: () => void
  onAppLauncherClick: () => void
}

/**
 * TopNavbar - Barre de navigation supérieure
 *
 * Affiche :
 * - Bouton App Launcher
 * - Logo Quelyos
 * - Quick access pour 5 modules (home, finance, store, crm, stock)
 * - Lien "Voir mon site" vers e-commerce
 * - Toggle dark/light mode
 * - Bouton menu mobile
 */
export function TopNavbar({
  currentModule,
  onModuleChange,
  onMenuClick,
  onAppLauncherClick,
  isAppLauncherOpen,
  isModuleChanging,
  modules
}: TopNavbarProps) {
  const { theme, toggleTheme } = useTheme()
  const Icon = currentModule.icon

  // Show only 5 most used modules in quick access (filtered by permissions)
  const quickModules = modules.filter(m => ['home', 'finance', 'store', 'crm', 'stock'].includes(m.id))

  return (
    <header className="h-14 bg-gray-900 dark:bg-gray-950 border-b border-gray-800 flex items-center px-4 sticky top-0 z-30">
      {/* App launcher button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAppLauncherClick}
        className={`mr-3 ${
          isAppLauncherOpen
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
        {/* View site button */}
        <a
          href={import.meta.env.VITE_SHOP_URL || 'http://localhost:3001'}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          title="Voir mon site e-commerce"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden md:inline">Voir mon site</span>
        </a>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-gray-400 hover:bg-gray-800 hover:text-white"
          title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          icon={theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        >
          <span className="sr-only">{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
        </Button>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:bg-gray-800 hover:text-white"
          icon={<Menu className="h-5 w-5" />}
        >
          <span className="sr-only">Menu</span>
        </Button>
      </div>
    </header>
  )
}
