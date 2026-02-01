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
      {/* Overlay avec backdrop blur */}
      <div
        className="fixed inset-0 z-[60] bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal avec animation */}
      <div className="fixed top-16 left-4 z-[70] w-96 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Barre de recherche premium */}
        <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/50">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Rechercher une application..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Grille modules avec animations */}
        <div className="p-4 grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {modules.map((module, index) => {
            const ModuleIcon = module.icon
            const isActive = module.id === currentModule.id
            return (
              <button
                key={module.id}
                onClick={() => {
                  onSelect(module.id)
                  onClose()
                }}
                style={{ animationDelay: `${index * 30}ms` }}
                className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-200 animate-in fade-in zoom-in-95 ${
                  isActive
                    ? `${module.bgColor} ring-2 ring-offset-2 dark:ring-offset-gray-900 shadow-lg scale-105 ${module.color.replace('text-', 'ring-')}`
                    : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:shadow-md hover:scale-105 hover:-translate-y-0.5'
                }`}
              >
                {/* Icône avec effet premium */}
                <div className={`relative p-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 shadow-lg'
                    : `${module.bgColor} group-hover:shadow-lg group-hover:scale-110`
                }`}>
                  <ModuleIcon className={`h-7 w-7 ${module.color} transition-transform duration-200`} />
                  {/* Glow effect pour le module actif */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-xl ${module.bgColor} opacity-30 blur-xl`} />
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-semibold text-center transition-colors ${
                  isActive
                    ? module.color
                    : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                }`}>
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
