import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PieChart,
  BarChart3,
  Settings
} from 'lucide-react'

interface Tab {
  id: string
  label: string
  count: number
}

interface SectionTabsProps {
  moduleId: string
  moduleName?: string
  moduleDescription?: string
  moduleColor?: string
  moduleBgColor?: string
  moduleIcon?: React.ComponentType<{ className?: string }>
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  onModuleClick?: () => void
}

// Map des icônes par section
const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Tableau de bord': LayoutDashboard,
  'Comptes': Wallet,
  'Transactions': ArrowRightLeft,
  'Planification': PieChart,
  'Rapports': BarChart3,
  'Configuration': Settings,
}

interface SectionTabsPropsExtended extends SectionTabsProps {
  isSidebarCollapsed?: boolean
}

export function SectionTabs({ tabs, activeTab, onTabChange, moduleName, moduleDescription, moduleColor, moduleBgColor, moduleIcon: ModuleIcon, isSidebarCollapsed = false, onModuleClick }: SectionTabsPropsExtended) {
  return (
    <div className="relative flex items-stretch w-full bg-white dark:bg-gray-900">
      {/* Module indicator - même style que sidebar */}
      {moduleName && ModuleIcon && (
        <button
          onClick={onModuleClick}
          className={`hidden lg:flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSidebarCollapsed ? 'w-16 justify-center' : 'w-60'} ${onModuleClick ? 'cursor-pointer' : ''}`}
          title="Changer de module"
          disabled={!onModuleClick}
        >
          <div className={`p-2 rounded-lg ${moduleBgColor || 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
            <ModuleIcon className={`w-5 h-5 ${moduleColor || 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <h2 className={`font-semibold ${moduleColor || 'text-emerald-600'} truncate text-sm`}>
                {moduleName}
              </h2>
              {moduleDescription && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {moduleDescription}
                </p>
              )}
            </div>
          )}
        </button>
      )}

      {/* Scrollable container pour tabs */}
      <div className="flex-1 overflow-x-auto scrollbar-hide px-4 py-2 bg-white dark:bg-gray-900">
        <nav className="flex gap-1 min-w-max" aria-label="Sections Finance">
          {tabs.map(tab => {
            const Icon = SECTION_ICONS[tab.id]
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex items-center gap-2 px-4 py-2 rounded-lg
                  text-sm font-medium whitespace-nowrap
                  transition-all duration-150 ease-in-out
                  ${isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icône */}
                {Icon && (
                  <Icon className={`
                    w-4 h-4 transition-transform duration-200
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                  `} />
                )}

                {/* Label */}
                <span>{tab.label}</span>

                {/* Count badge (discret) */}
                <span className={`
                  hidden sm:inline-flex items-center justify-center
                  min-w-[1.25rem] h-5 px-1.5 rounded-full
                  text-xs font-medium transition-colors
                  ${isActive
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                  }
                `}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
