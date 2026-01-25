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
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
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
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200 w-full group"
      aria-label={`Passer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
      title={compact ? (theme === 'light' ? 'Mode sombre' : 'Mode clair') : undefined}
    >
      {theme === 'light' ? (
        <MoonIcon className="w-[18px] h-[18px] flex-shrink-0" />
      ) : (
        <SunIcon className="w-[18px] h-[18px] flex-shrink-0" />
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
  isOpen,
  onToggle,
}: {
  group: NavGroup
  isActive: (path: string) => boolean
  compact: boolean
  onItemClick?: () => void
  isOpen: boolean
  onToggle: () => void
}) {
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
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <span>{group.name}</span>
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </button>
      <div
        className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[1000px] opacity-100 mb-3 mt-1' : 'max-h-0 opacity-0'
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
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200 group relative text-sm ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      title={compact ? item.name : undefined}
    >
      {/* Indicateur actif à gauche */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
      )}

      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${compact ? 'mx-auto' : ''}`} />
      {!compact && (
        <span className="flex-1 truncate">{item.name}</span>
      )}
      {!compact && item.badge && (
        <span className="flex items-center justify-center min-w-[20px] h-[18px] px-1.5 text-[11px] font-semibold text-white bg-red-500 rounded-full">
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
  const [openGroupName, setOpenGroupName] = useState<string | null>(null)
  const { data: analyticsData } = useAnalyticsStats()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Calculer les badges de notifications
  const stockAlerts = (analyticsData?.data?.totals?.out_of_stock_products || 0) +
                      (analyticsData?.data?.totals?.low_stock_products || 0)

  const navGroups: NavGroup[] = [
    {
      name: 'Tableau de bord',
      defaultOpen: true,
      items: [
        {
          name: 'Vue d\'ensemble',
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
      name: 'Boutique',
      defaultOpen: true,
      items: [
        {
          name: 'Ma Boutique',
          path: '/my-shop',
          icon: BuildingStorefrontIcon,
        },
        {
          name: 'Configuration Site',
          path: '/site-config',
          icon: Cog6ToothIcon,
        },
        {
          name: 'Produits Vedette',
          path: '/featured',
          icon: SparklesIcon,
        },
        {
          name: 'Paniers Abandonnés',
          path: '/abandoned-carts',
          icon: ShoppingCartIcon,
        },
        {
          name: 'Livraison',
          path: '/delivery',
          icon: TruckIcon,
        },
        {
          name: 'Codes Promo',
          path: '/coupons',
          icon: TicketIcon,
        },
      ],
    },
    {
      name: 'Ventes & CRM',
      defaultOpen: false,
      items: [
        {
          name: 'Commandes',
          path: '/orders',
          icon: ShoppingCartIcon,
        },
        {
          name: 'Clients',
          path: '/customers',
          icon: UserGroupIcon,
        },
        {
          name: 'Catégories Clients',
          path: '/customer-categories',
          icon: TagIcon,
        },
        {
          name: 'Listes de Prix',
          path: '/pricelists',
          icon: ClipboardDocumentListIcon,
        },
      ],
    },
    {
      name: 'Catalogue',
      defaultOpen: false,
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
      ],
    },
    {
      name: 'Stock',
      defaultOpen: false,
      items: [
        {
          name: 'Inventaire',
          path: '/stock',
          icon: CubeTransparentIcon,
          badge: stockAlerts > 0 ? stockAlerts : undefined,
        },
        {
          name: 'Mouvements',
          path: '/stock/moves',
          icon: ArrowsRightLeftIcon,
        },
        {
          name: 'Entrepôts',
          path: '/warehouses',
          icon: BuildingOffice2Icon,
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
      ],
    },
  ]

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Ouvrir automatiquement le groupe contenant la page active
  useEffect(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some((item) => isActive(item.path))
    )
    if (activeGroup) {
      setOpenGroupName(activeGroup.name)
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGroupToggle = (groupName: string) => {
    // Si on clique sur le groupe déjà ouvert, on le ferme
    // Sinon on ouvre le nouveau groupe (et ferme l'ancien)
    setOpenGroupName((prev) => (prev === groupName ? null : groupName))
  }

  const sidebarWidth = isCompact ? 'w-16' : 'w-56'

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
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!isCompact && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight">
                  Quelyos
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 -mt-0.5 font-medium">Backoffice</p>
              </div>
            </div>
          )}
          {isCompact && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Fermer le menu"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation avec scroll */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {navGroups.map((group) => (
            <NavGroupComponent
              key={group.name}
              group={group}
              isActive={isActive}
              compact={isCompact}
              onItemClick={() => setIsMobileMenuOpen(false)}
              isOpen={openGroupName === group.name}
              onToggle={() => handleGroupToggle(group.name)}
            />
          ))}
        </nav>

        {/* Footer avec actions */}
        <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
          {/* Toggle compact mode (desktop uniquement) */}
          {!isCompact && (
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="hidden lg:flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200 w-full group"
              aria-label="Mode compact"
            >
              <Bars3Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="font-medium">Réduire</span>
            </button>
          )}
          {isCompact && (
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="hidden lg:flex items-center justify-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200 w-full"
              aria-label="Mode étendu"
              title="Agrandir"
            >
              <Bars3Icon className="w-[18px] h-[18px]" />
            </button>
          )}

          <ThemeToggle compact={isCompact} />

          <Link
            to="/login"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
            title={isCompact ? 'Déconnexion' : undefined}
          >
            <ArrowLeftOnRectangleIcon className="w-[18px] h-[18px] flex-shrink-0" />
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
        <main className={`flex-1 ${!isCompact ? 'lg:ml-56' : 'lg:ml-16'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
