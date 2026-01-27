import { Search } from 'lucide-react'
import type { Module, ModuleId } from '@/config/modules'

interface AppLauncherProps {
  currentModule: Module
  onSelect: (id: ModuleId) => void
  isOpen: boolean
  onClose: () => void
  modules: Module[]
}

/**
 * AppLauncher - Modal de sélection rapide des modules
 *
 * Affiche une grille 3 colonnes de tous les modules accessibles.
 * Note: La recherche n'est pas encore fonctionnelle (Phase 3).
 */
export function AppLauncher({
  currentModule,
  onSelect,
  isOpen,
  onClose,
  modules
}: AppLauncherProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay pour fermer */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-14 left-4 z-[70] w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
        {/* Barre de recherche (non fonctionnelle) */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une application..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Grille modules */}
        <div className="p-3 grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
          {modules.map((module) => {
            const ModuleIcon = module.icon
            const isActive = module.id === currentModule.id
            return (
              <button
                key={module.id}
                onClick={() => {
                  onSelect(module.id)
                  onClose()
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  isActive
                    ? `${module.bgColor} ring-2 ring-offset-2 dark:ring-offset-gray-800 ${module.color.replace('text-', 'ring-')}`
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`p-3 rounded-xl ${isActive ? 'bg-white dark:bg-gray-800' : module.bgColor}`}>
                  <ModuleIcon className={`h-6 w-6 ${module.color}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? module.color : 'text-gray-700 dark:text-gray-300'}`}>
                  {module.shortName}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
