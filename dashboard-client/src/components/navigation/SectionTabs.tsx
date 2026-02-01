import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PieChart,
  BarChart3,
  Settings,
  Package,
  Megaphone,
  FileText,
  Boxes,
  Truck,
  Kanban,
  UserCircle,
  Receipt,
  Mail,
  MessageSquare,
  Users,
  UsersRound,
  Calendar,
  Award,
  Monitor,
  ClipboardList,
  Wrench
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
  // Home
  'Tableau de bord': LayoutDashboard,
  'Paramètres': Settings,

  // Finance
  'Comptes': Wallet,
  'Transactions': ArrowRightLeft,
  'Planification': PieChart,
  'Rapports': BarChart3,
  'Configuration': Settings,

  // Store
  'Catalogue': Package,
  'Marketing': Megaphone,
  'Contenu': FileText,

  // Stock
  'Stock': Boxes,
  'Logistique': Truck,
  'Analyse': BarChart3,

  // CRM
  'Pipeline': Kanban,
  'Clients': UserCircle,
  'Facturation': Receipt,

  // Marketing
  'Emails': Mail,
  'SMS': MessageSquare,
  'Audiences': Users,

  // HR
  'Personnel': UsersRound,
  'Temps & Congés': Calendar,
  'Évaluations': Award,

  // Support
  'Assistance': MessageSquare,

  // POS
  'Caisse': Monitor,
  'Gestion': ClipboardList,

  // Maintenance
  'Équipements': Wrench,
  'Interventions': ClipboardList,
}

// Map des variantes de couleurs pour tabs actives (par module)
const TAB_COLOR_VARIANTS: Record<string, {
  text: string
  bg: string
  badgeBg: string
  badgeText: string
}> = {
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300'
  },
  indigo: {
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    badgeText: 'text-indigo-700 dark:text-indigo-300'
  },
  blue: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300'
  },
  purple: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    badgeText: 'text-purple-700 dark:text-purple-300'
  },
  pink: {
    text: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    badgeBg: 'bg-pink-100 dark:bg-pink-900/30',
    badgeText: 'text-pink-700 dark:text-pink-300'
  },
  orange: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/30',
    badgeText: 'text-orange-700 dark:text-orange-300'
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-300'
  },
  teal: {
    text: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/30',
    badgeText: 'text-teal-700 dark:text-teal-300'
  },
  gray: {
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    badgeBg: 'bg-gray-100 dark:bg-gray-900/30',
    badgeText: 'text-gray-700 dark:text-gray-300'
  }
}

interface SectionTabsPropsExtended extends SectionTabsProps {
  isSidebarCollapsed?: boolean
}

export function SectionTabs({ tabs, activeTab, onTabChange, moduleName, moduleDescription, moduleColor, moduleBgColor, moduleIcon: ModuleIcon, isSidebarCollapsed = false, onModuleClick }: SectionTabsPropsExtended) {
  // Extraire la couleur du module depuis moduleColor (ex: "text-indigo-600" -> "indigo")
  const colorMatch = moduleColor?.match(/text-(\w+)-/)
  const colorName = colorMatch?.[1] || 'emerald'
  const tabColors = TAB_COLOR_VARIANTS[colorName] || TAB_COLOR_VARIANTS.emerald

  return (
    <div className="relative flex items-stretch w-full bg-white dark:bg-gray-800">
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
      <div className="flex-1 overflow-x-auto scrollbar-hide px-4 py-2 bg-white dark:bg-gray-800">
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
                    ? `${tabColors.text} ${tabColors.bg}`
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
                    ? `${tabColors.badgeBg} ${tabColors.badgeText}`
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
