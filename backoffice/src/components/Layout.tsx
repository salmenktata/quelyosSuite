import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import {
  HomeIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  CubeIcon,
  TagIcon,
  TicketIcon,
  CubeTransparentIcon,
  ArrowsRightLeftIcon,
  TruckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  SparklesIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useAnalyticsStats } from '../hooks/useAnalytics'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
}

interface NavGroup {
  name: string
  items: NavItem[]
  defaultOpen?: boolean
}

function ThemeToggle({ compact }: { compact: boolean }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 w-full group"
      aria-label={`Passer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
      title={compact ? (theme === 'light' ? 'Mode sombre' : 'Mode clair') : undefined}
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5 flex-shrink-0" />
      ) : (
        <SunIcon className="w-5 h-5 flex-shrink-0" />
      )}
      {!compact && (
        <span className="font-medium">{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
      )}
    </button>
  )
}

function NavGroupComponent({
  group,
  isActive,
  compact,
  onItemClick,
}: {
  group: NavGroup
  isActive: (path: string) => boolean
  compact: boolean
  onItemClick?: () => void
}) {
  const [isOpen, setIsOpen] = useState(group.defaultOpen ?? true)
  const location = useLocation()

  // Auto-ouvrir le groupe si un item est actif
  useEffect(() => {
    const hasActiveItem = group.items.some((item) => isActive(item.path))
    if (hasActiveItem && !isOpen) {
      setIsOpen(true)
    }
  }, [location.pathname, group.items, isActive, isOpen])

  if (compact) {
    // Mode compact : afficher directement les items sans groupe
    return (
      <>
        {group.items.map((item) => (
          <NavItemComponent
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            compact={compact}
            onClick={onItemClick}
          />
        ))}
      </>
    )
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <span>{group.name}</span>
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </button>
      <div
        className={`space-y-1 overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'
        }`}
      >
        {group.items.map((item) => (
          <NavItemComponent
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            compact={compact}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  )
}

function NavItemComponent({
  item,
  isActive,
  compact,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  compact: boolean
  onClick?: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      title={compact ? item.name : undefined}
    >
      {/* Indicateur actif à gauche */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
      )}

      <Icon className={`w-5 h-5 flex-shrink-0 ${compact ? 'mx-auto' : ''}`} />
      {!compact && (
        <span className="flex-1 truncate">{item.name}</span>
      )}
      {!compact && item.badge && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-semibold text-white bg-red-500 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const { data: analyticsData } = useAnalyticsStats()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Calculer les badges de notifications
  const stockAlerts = (analyticsData?.data?.totals?.out_of_stock_products || 0) +
                      (analyticsData?.data?.totals?.low_stock_products || 0)

  const navGroups: NavGroup[] = [
    {
      name: 'Vue d\'ensemble',
      defaultOpen: true,
      items: [
        {
          name: 'Tableau de bord',
          path: '/dashboard',
          icon: HomeIcon,
        },
        {
          name: 'Analytics',
          path: '/analytics',
          icon: ChartBarIcon,
        },
      ],
    },
    {
      name: 'Ventes',
      defaultOpen: true,
      items: [
        {
          name: 'Commandes',
          path: '/orders',
          icon: ShoppingCartIcon,
        },
        {
          name: 'Paniers abandonnés',
          path: '/abandoned-carts',
          icon: BuildingStorefrontIcon,
        },
        {
          name: 'Clients',
          path: '/customers',
          icon: UserGroupIcon,
        },
      ],
    },
    {
      name: 'Catalogue',
      defaultOpen: true,
      items: [
        {
          name: 'Produits',
          path: '/products',
          icon: CubeIcon,
        },
        {
          name: 'Catégories',
          path: '/categories',
          icon: TagIcon,
        },
        {
          name: 'Produits Vedette',
          path: '/featured',
          icon: SparklesIcon,
        },
      ],
    },
    {
      name: 'Stock',
      defaultOpen: false,
      items: [
        {
          name: 'Stock',
          path: '/stock',
          icon: CubeTransparentIcon,
          badge: stockAlerts > 0 ? stockAlerts : undefined,
        },
        {
          name: 'Mouvements',
          path: '/stock/moves',
          icon: ArrowsRightLeftIcon,
        },
      ],
    },
    {
      name: 'Finance',
      defaultOpen: false,
      items: [
        {
          name: 'Factures',
          path: '/invoices',
          icon: DocumentTextIcon,
        },
        {
          name: 'Paiements',
          path: '/payments',
          icon: CreditCardIcon,
        },
        {
          name: 'Codes Promo',
          path: '/coupons',
          icon: TicketIcon,
        },
      ],
    },
    {
      name: 'Configuration',
      defaultOpen: false,
      items: [
        {
          name: 'Livraison',
          path: '/delivery',
          icon: TruckIcon,
        },
        {
          name: 'Abonnements',
          path: '/subscriptions',
          icon: DocumentTextIcon,
        },
      ],
    },
  ]

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const sidebarWidth = isCompact ? 'w-20' : 'w-64'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop + Mobile */}
      <aside
        className={`${sidebarWidth} bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 fixed h-full z-50 transition-all duration-300 flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!isCompact && (
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Quelyos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Backoffice</p>
            </div>
          )}
          {isCompact && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Fermer le menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation avec scroll */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {navGroups.map((group) => (
            <NavGroupComponent
              key={group.name}
              group={group}
              isActive={isActive}
              compact={isCompact}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
        </nav>

        {/* Footer avec actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Toggle compact mode (desktop uniquement) */}
          {!isCompact && (
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="hidden lg:flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 w-full group"
              aria-label="Mode compact"
            >
              <Bars3Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Mode compact</span>
            </button>
          )}
          {isCompact && (
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="hidden lg:flex items-center justify-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 w-full"
              aria-label="Mode étendu"
              title="Mode étendu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          <ThemeToggle compact={isCompact} />

          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            title={isCompact ? 'Déconnexion' : undefined}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {!isCompact && <span className="font-medium">Déconnexion</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarWidth} lg:ml-0`}>
        {/* Header mobile */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-700 dark:text-gray-300"
            aria-label="Ouvrir le menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Quelyos
          </h1>
          <div className="w-6" /> {/* Spacer pour centrer le titre */}
        </header>

        {/* Contenu principal */}
        <main className={`flex-1 ${!isCompact ? 'lg:ml-64' : 'lg:ml-20'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
