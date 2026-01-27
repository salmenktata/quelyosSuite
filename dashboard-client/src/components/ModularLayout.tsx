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
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext, useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { usePermissions } from '../hooks/usePermissions'
import { Button } from './common/Button'
import {
  // Common
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  Grid3X3,
  Search,
  // Finance
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  BarChart3,
  Users,
  Bell,
  FolderOpen,
  Upload,
  Archive,
  Calendar,
  // Boutique
  ShoppingCart,
  Package,
  Tag,
  Truck,
  Ticket,
  Store,
  Sparkles,
  Image,
  FileText,
  // Stock
  Boxes,
  ArrowRightLeft,
  Warehouse,
  ClipboardList,
  ClipboardCheck,
  MapPin,
  RefreshCw,
  // CRM
  UserCircle,
  Receipt,
  BadgePercent,
  Kanban,
  Target,
  // New
  Megaphone,
  UsersRound,
  ExternalLink,
  // Additional icons
  List,
  MessageSquare,
  Award,
  Globe,
  Zap,
  Coins,
  Layers,
  DollarSign,
  Lock,
  Plug,
  BellRing,
  Shuffle,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ModuleId = 'home' | 'finance' | 'store' | 'stock' | 'crm' | 'marketing' | 'hr'

interface SubMenuItem {
  name: string
  path?: string
  badge?: string
  separator?: boolean
}

interface MenuItem {
  name: string
  path?: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: SubMenuItem[]
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

interface Module {
  id: ModuleId
  name: string
  shortName: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  description: string
  basePath: string
  sections: MenuSection[]
}

// ============================================================================
// MODULE DEFINITIONS
// ============================================================================

const MODULES: Module[] = [
  {
    id: 'home',
    name: 'Accueil',
    shortName: 'Accueil',
    icon: Home,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    description: 'Vue d\'ensemble',
    basePath: '/dashboard',
    sections: [
      {
        title: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        ],
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    shortName: 'Finance',
    icon: Wallet,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    description: 'Trésorerie & Budgets',
    basePath: '/finance',
    sections: [
      {
        title: 'Principal',
        items: [
          { name: 'Tableau de bord', path: '/finance', icon: LayoutDashboard },
          {
            name: 'Comptes',
            icon: Wallet,
            subItems: [
              { name: 'Tous les comptes', path: '/finance/accounts' },
              { name: 'Portefeuilles', path: '/finance/portfolios' },
            ],
          },
          {
            name: 'Transactions',
            icon: ArrowLeftRight,
            subItems: [
              { name: 'Toutes', path: '/finance/transactions' },
              { name: 'Dépenses', path: '/finance/expenses' },
              { name: 'Revenus', path: '/finance/incomes' },
            ],
          },
          { name: 'Budgets', path: '/finance/budgets', icon: PieChart },
          {
            name: 'Prévisions',
            icon: TrendingUp,
            subItems: [
              { name: 'Trésorerie', path: '/finance/forecast' },
              { name: 'Scénarios', path: '/finance/scenarios', badge: 'Nouveau' },
            ],
          },
          {
            name: 'Rapports',
            icon: BarChart3,
            subItems: [
              { name: 'Tableau de bord', separator: true },
              { name: 'Hub', path: '/finance/reporting' },
              { name: 'Vue d\'ensemble', path: '/finance/reporting/overview' },
              { name: 'Trésorerie', separator: true },
              { name: 'Trésorerie', path: '/finance/reporting/cashflow' },
              { name: 'Prévisions', path: '/finance/reporting/forecast' },
              { name: 'Analyses prév.', path: '/finance/reporting/forecasts' },
              { name: 'Analyses', separator: true },
              { name: 'Par catégorie', path: '/finance/reporting/by-category' },
              { name: 'Par flux', path: '/finance/reporting/by-flow' },
              { name: 'Par compte', path: '/finance/reporting/by-account' },
              { name: 'Par portefeuille', path: '/finance/reporting/by-portfolio' },
              { name: 'Indicateurs', separator: true },
              { name: 'Rentabilité', path: '/finance/reporting/profitability' },
              { name: 'EBITDA', path: '/finance/reporting/ebitda' },
              { name: 'DSO', path: '/finance/reporting/dso' },
              { name: 'BFR', path: '/finance/reporting/bfr' },
              { name: 'Point mort', path: '/finance/reporting/breakeven' },
              { name: 'Qualité', separator: true },
              { name: 'Qualité données', path: '/finance/reporting/data-quality' },
            ],
          },
          { name: 'Plan Comptable', path: '/finance/charts', icon: Coins },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Catégories', path: '/finance/categories', icon: FolderOpen },
          { name: 'Fournisseurs', path: '/finance/suppliers', icon: Users },
          { name: 'Alertes', path: '/finance/alerts', icon: Bell },
          { name: 'Planification', path: '/finance/payment-planning', icon: Calendar },
          { name: 'Import', path: '/finance/import', icon: Upload },
          { name: 'Archives', path: '/finance/archives', icon: Archive },
          {
            name: 'Paramètres',
            icon: Settings,
            subItems: [
              { name: 'Général', path: '/finance/settings' },
              { name: 'Catégories', path: '/finance/settings/categories' },
              { name: 'Devise', path: '/finance/settings/devise' },
              { name: 'Flux', path: '/finance/settings/flux' },
              { name: 'TVA', path: '/finance/settings/tva' },
              { name: 'Facturation', path: '/finance/settings/billing' },
              { name: 'Notifications', path: '/finance/settings/notifications' },
              { name: 'Intégrations', path: '/finance/settings/integrations' },
              { name: 'Sécurité', path: '/finance/settings/security' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'store',
    name: 'Boutique',
    shortName: 'Boutique',
    icon: Store,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    description: 'E-commerce',
    basePath: '/store',
    sections: [
      {
        title: 'Gestion',
        items: [
          { name: 'Ma Boutique', path: '/store/my-shop', icon: Store },
          { name: 'Commandes', path: '/store/orders', icon: ShoppingCart },
          { name: 'Produits', path: '/store/products', icon: Package },
          { name: 'Catégories', path: '/store/categories', icon: Tag },
          { name: 'Paniers Abandonnés', path: '/store/abandoned-carts', icon: ShoppingCart },
        ],
      },
      {
        title: 'Marketing',
        items: [
          { name: 'Produits Vedette', path: '/store/featured', icon: Sparkles },
          { name: 'Codes Promo', path: '/store/coupons', icon: Ticket },
          { name: 'Bannières', path: '/store/promo-banners', icon: Image },
          { name: 'Hero Slides', path: '/store/hero-slides', icon: Image },
        ],
      },
      {
        title: 'Configuration',
        items: [
          { name: 'Livraison', path: '/store/delivery', icon: Truck },
          { name: 'Configuration Site', path: '/store/site-config', icon: Settings },
          { name: 'Pages Statiques', path: '/store/static-pages', icon: FileText },
          { name: 'Menus Navigation', path: '/store/menus', icon: List },
          { name: 'Messages Promo', path: '/store/promo-messages', icon: MessageSquare },
          { name: 'Badges Confiance', path: '/store/trust-badges', icon: Award },
          { name: 'SEO Métadonnées', path: '/store/seo-metadata', icon: Globe },
          { name: 'Popups Marketing', path: '/store/marketing-popups', icon: Zap },
        ],
      },
    ],
  },
  {
    id: 'stock',
    name: 'Stock',
    shortName: 'Stock',
    icon: Boxes,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Inventaire',
    basePath: '/stock',
    sections: [
      {
        title: 'Inventaire',
        items: [
          { name: 'Stock', path: '/stock', icon: Boxes },
          { name: 'Inventaire Physique', path: '/inventory', icon: ClipboardList },
          { name: 'Mouvements', path: '/stock/moves', icon: ArrowRightLeft },
          { name: 'Transferts', path: '/stock/transfers', icon: Truck },
          { name: 'Entrepôts', path: '/warehouses', icon: Warehouse },
          { name: 'Emplacements', path: '/stock/locations', icon: MapPin },
          { name: 'Règles Réapprovisionnement', path: '/stock/reordering-rules', icon: RefreshCw },
        ],
      },
      {
        title: 'Fonctionnalités OCA',
        items: [
          { name: 'Raisons Changement Stock', path: '/stock/change-reasons', icon: FileText },
          { name: 'Inventaires OCA', path: '/stock/inventories-oca', icon: ClipboardCheck },
          { name: 'Verrouillage Emplacements', path: '/stock/location-locks', icon: Lock },
        ],
      },
      {
        title: 'Analyse',
        items: [
          { name: 'Valorisation', path: '/stock/valuation', icon: Layers },
          { name: 'Rotation', path: '/stock/turnover', icon: Shuffle },
        ],
      },
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    shortName: 'CRM',
    icon: UserCircle,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    description: 'Clients & Ventes',
    basePath: '/crm',
    sections: [
      {
        title: 'Pipeline',
        items: [
          { name: 'Pipeline', path: '/crm/pipeline', icon: Kanban },
          { name: 'Opportunités', path: '/crm/leads', icon: Target },
        ],
      },
      {
        title: 'Clients',
        items: [
          { name: 'Clients', path: '/crm/customers', icon: UserCircle },
          { name: 'Catégories Clients', path: '/crm/customer-categories', icon: Tag },
          { name: 'Listes de Prix', path: '/pricelists', icon: ClipboardList },
        ],
      },
      {
        title: 'Facturation',
        items: [
          { name: 'Factures', path: '/invoices', icon: Receipt },
          { name: 'Paiements', path: '/payments', icon: BadgePercent },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    shortName: 'Marketing',
    icon: Megaphone,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: 'Campagnes & Analytics',
    basePath: '/marketing',
    sections: [
      {
        title: 'Campagnes',
        items: [
          { name: 'Tableau de bord', path: '/marketing', icon: LayoutDashboard },
          { name: 'Emails', path: '/marketing/emails', icon: FileText },
          { name: 'SMS', path: '/marketing/sms', icon: Megaphone },
        ],
      },
      {
        title: 'Automatisation',
        items: [
          { name: 'Workflows', path: '/marketing/workflows', icon: ArrowRightLeft },
          { name: 'Segments', path: '/marketing/segments', icon: Users },
        ],
      },
    ],
  },
  {
    id: 'hr',
    name: 'RH',
    shortName: 'RH',
    icon: UsersRound,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    description: 'Employés & Paie',
    basePath: '/hr',
    sections: [
      {
        title: 'Personnel',
        items: [
          { name: 'Employés', path: '/hr/employees', icon: UsersRound },
          { name: 'Départements', path: '/hr/departments', icon: Boxes },
          { name: 'Contrats', path: '/hr/contracts', icon: FileText },
        ],
      },
      {
        title: 'Temps & Absences',
        items: [
          { name: 'Congés', path: '/hr/leaves', icon: Calendar },
          { name: 'Présences', path: '/hr/attendance', icon: ClipboardList },
        ],
      },
    ],
  },
]

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
// COMPONENTS
// ============================================================================

// App Launcher (grid of apps)
function AppLauncher({
  currentModule,
  onSelect,
  isOpen,
  onClose,
  modules
}: {
  currentModule: Module
  onSelect: (id: ModuleId) => void
  isOpen: boolean
  onClose: () => void
  modules: Module[]
}) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className="fixed top-14 left-4 z-[70] w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
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

// Top navbar with app icons
function TopNavbar({
  currentModule,
  onModuleChange,
  onMenuClick,
  onAppLauncherClick,
  isAppLauncherOpen,
  isModuleChanging,
  modules
}: {
  currentModule: Module
  onModuleChange: (id: ModuleId) => void
  onMenuClick: () => void
  onAppLauncherClick: () => void
  isAppLauncherOpen: boolean
  isModuleChanging: boolean
  modules: Module[]
}) {
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

function MenuItemComponent({
  item,
  isActive,
  isOpen,
  onToggle,
  moduleColor,
}: {
  item: MenuItem
  isActive: (path: string) => boolean
  isOpen: boolean
  onToggle: () => void
  moduleColor: string
}) {
  const Icon = item.icon
  const hasSubItems = item.subItems && item.subItems.length > 0
  const isCurrentlyActive = item.path ? isActive(item.path) : item.subItems?.some(sub => sub.path && isActive(sub.path))

  if (hasSubItems) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            isCurrentlyActive
              ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="flex-1 text-left">{item.name}</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
            {item.subItems?.map((subItem, idx) => {
              if (subItem.separator) {
                return (
                  <div
                    key={`separator-${idx}`}
                    className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mt-2"
                  >
                    {subItem.name}
                  </div>
                )
              }
              return (
                <Link
                  key={subItem.path}
                  to={subItem.path!}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-all ${
                    isActive(subItem.path!)
                      ? `bg-gray-100 dark:bg-gray-700 ${moduleColor} font-medium`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{subItem.name}</span>
                  {subItem.badge && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      {subItem.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to={item.path || '#'}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        isCurrentlyActive
          ? `bg-gray-100 dark:bg-gray-700 ${moduleColor}`
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{item.name}</span>
    </Link>
  )
}

// ============================================================================
// MAIN LAYOUT
// ============================================================================

export function ModularLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())
  const [isModuleChanging, setIsModuleChanging] = useState(false)
  const { canAccessModule } = usePermissions()

  // Filtrer les modules selon les permissions de l'utilisateur
  const accessibleModules = useMemo(() => {
    return MODULES.filter(module => canAccessModule(module.id))
  }, [canAccessModule])

  // Detect current module from URL
  const detectModule = (): Module => {
    const path = location.pathname
    // IMPORTANT: Check /finance/stock BEFORE /finance
    if (path.startsWith('/finance/stock')) return accessibleModules.find(m => m.id === 'stock') || accessibleModules[0] || MODULES[0]
    if (path.startsWith('/finance')) return accessibleModules.find(m => m.id === 'finance') || accessibleModules[0] || MODULES[0]
    if (path.startsWith('/stock') || path.startsWith('/warehouses') || path.startsWith('/inventory')) return accessibleModules.find(m => m.id === 'stock') || accessibleModules[0] || MODULES[0]
    if (path.startsWith('/crm') || path.startsWith('/invoices') || path.startsWith('/payments') || path.startsWith('/pricelists')) return accessibleModules.find(m => m.id === 'crm') || accessibleModules[0] || MODULES[0]
    if (path.startsWith('/store')) return accessibleModules.find(m => m.id === 'store') || accessibleModules[0] || MODULES[0]
    if (path.startsWith('/marketing')) return accessibleModules.find(m => m.id === 'marketing') || accessibleModules[0] || MODULES[0]
    if (path.startsWith('/hr')) return accessibleModules.find(m => m.id === 'hr') || accessibleModules[0] || MODULES[0]
    return accessibleModules.find(m => m.id === 'home') || accessibleModules[0] || MODULES[0]
  }

  const [currentModule, setCurrentModule] = useState<Module>(detectModule)

  useEffect(() => {
    setCurrentModule(detectModule())
  }, [location.pathname])

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

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

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Auto-open menus with active items
  useEffect(() => {
    currentModule.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems?.some(sub => sub.path && isActive(sub.path))) {
          setOpenMenus(prev => new Set(prev).add(item.name))
        }
      })
    })
  }, [location.pathname, currentModule])

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
                      <MenuItemComponent
                        key={item.name}
                        item={item}
                        isActive={isActive}
                        isOpen={openMenus.has(item.name)}
                        onToggle={() => toggleMenu(item.name)}
                        moduleColor={currentModule.color}
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
