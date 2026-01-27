import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Users,
  Settings,
  Bell,
  FolderOpen,
  Upload,
  Archive,
  FileText,
  CreditCard,
  Calendar,
  Layers,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  PlayCircle,
} from 'lucide-react'

interface FinanceLayoutProps {
  children: React.ReactNode
}

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

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
    </button>
  )
}

function MenuItemComponent({
  item,
  isActive,
  isOpen,
  onToggle,
}: {
  item: MenuItem
  isActive: (path: string) => boolean
  isOpen: boolean
  onToggle: () => void
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
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Icon className={`h-5 w-5 ${isCurrentlyActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
          <span className="flex-1 text-left">{item.name}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 border-l-2 border-indigo-200 dark:border-indigo-500/30 pl-3">
            <div className="space-y-0.5">
              {item.subItems?.map((subItem, idx) => {
                if (subItem.separator) {
                  return (
                    <div
                      key={`separator-${idx}`}
                      className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 border-b border-gray-200 dark:border-gray-700 mt-2"
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
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{subItem.name}</span>
                    {subItem.badge && (
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        {subItem.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
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
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon className={`h-5 w-5 ${isCurrentlyActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
      <span className="flex-1">{item.name}</span>
    </Link>
  )
}

export function FinanceLayout({ children }: FinanceLayoutProps) {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Set<string>>(() => new Set(['Prévisions']))

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
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
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Auto-ouvrir les menus contenant la page active
  useEffect(() => {
    mainMenuItems.forEach(item => {
      if (item.subItems?.some(sub => sub.path && isActive(sub.path))) {
        setOpenMenus(prev => new Set(prev).add(item.name))
      }
    })
  }, [location.pathname])

  const mainMenuItems: MenuItem[] = [
    {
      name: 'Tableau de bord',
      path: '/finance',
      icon: LayoutDashboard,
    },
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
    {
      name: 'Budgets',
      path: '/finance/budgets',
      icon: PieChart,
    },
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
  ]

  const configMenuItems: MenuItem[] = [
    {
      name: 'Catégories',
      path: '/finance/categories',
      icon: FolderOpen,
    },
    {
      name: 'Fournisseurs',
      path: '/finance/suppliers',
      icon: Users,
    },
    {
      name: 'Alertes',
      path: '/finance/alerts',
      icon: Bell,
    },
    {
      name: 'Planification',
      path: '/finance/payment-planning',
      icon: Calendar,
    },
    {
      name: 'Import',
      path: '/finance/import',
      icon: Upload,
    },
    {
      name: 'Archives',
      path: '/finance/archives',
      icon: Archive,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 fixed h-full z-50 transition-transform duration-300 flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight">
                Quelyos
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 -mt-0.5 font-medium">Finance</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Section Principal */}
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
            Principal
          </p>

          {mainMenuItems.map((item) => (
            <MenuItemComponent
              key={item.name}
              item={item}
              isActive={isActive}
              isOpen={openMenus.has(item.name)}
              onToggle={() => toggleMenu(item.name)}
            />
          ))}

          {/* Section Configuration */}
          <p className="mb-2 mt-6 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
            Configuration
          </p>

          {configMenuItems.map((item) => (
            <MenuItemComponent
              key={item.name}
              item={item}
              isActive={isActive}
              isOpen={openMenus.has(item.name)}
              onToggle={() => toggleMenu(item.name)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          >
            <Layers className="h-5 w-5" />
            <span>Backoffice</span>
          </Link>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header mobile */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-700 dark:text-gray-300"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Finance
          </h1>
          <div className="w-6" />
        </header>

        {/* Contenu principal */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
