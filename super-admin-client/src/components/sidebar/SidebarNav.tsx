import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router'
import {
  LayoutDashboard, Users, Package, CreditCard, DollarSign,
  Activity, Database, Settings, Shield, ShieldCheck, ShieldAlert,
  FileText, MessageSquare, FilePlus, Sparkles, Map, Mail, Scale,
  ChevronDown, ChevronRight, Search, Calendar,
} from 'lucide-react'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  id: string
  label: string
  icon: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: '📊',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: '💼',
    items: [
      { name: 'Tenants', path: '/tenants', icon: Users },
      { name: 'Plans', path: '/plans', icon: Package },
      { name: 'Abonnements', path: '/subscriptions', icon: CreditCard },
      { name: 'Facturation', path: '/billing', icon: DollarSign },
    ],
  },
  {
    id: 'operations',
    label: 'Opérations',
    icon: '🔧',
    items: [
      { name: 'Monitoring', path: '/monitoring', icon: Activity },
      { name: 'Backups', path: '/backups', icon: Database },
      { name: 'Planifications', path: '/backup-schedules', icon: Calendar },
      { name: 'Données Seed', path: '/seed-data', icon: Database },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: '💬',
    items: [
      { name: 'Tickets', path: '/support-tickets', icon: MessageSquare },
      { name: 'Templates', path: '/support-templates', icon: FilePlus },
    ],
  },
  {
    id: 'security',
    label: 'Sécurité',
    icon: '🔒',
    items: [
      { name: 'Vue Générale', path: '/security', icon: Shield },
      { name: '2FA / TOTP', path: '/security/2fa', icon: ShieldCheck },
      { name: 'Groupes', path: '/security/groups', icon: ShieldAlert },
      { name: 'Alertes', path: '/security/alerts', icon: ShieldAlert },
      { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
    ],
  },
  {
    id: 'config',
    label: 'Configuration',
    icon: '⚙️',
    items: [
      { name: 'Paramètres', path: '/settings', icon: Settings },
      { name: 'Email (SMTP)', path: '/email-settings', icon: Mail },
      { name: 'Configuration IA', path: '/ai-config', icon: Sparkles },
      { name: 'Mentions légales', path: '/legal-settings', icon: Scale },
      { name: 'Sitemap', path: '/sitemap', icon: Map },
    ],
  },
]

const STORAGE_KEY_SECTIONS = 'quelyos-sidebar-sections'
const STORAGE_KEY_COLLAPSED = 'quelyos-sidebar-collapsed'

function getInitialSections(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SECTIONS)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return {}
}

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_COLLAPSED) === 'true'
  } catch { return false }
}

interface SidebarNavProps {
  collapsed: boolean
  onOpenCommandPalette: () => void
  ticketCount?: number
}

export function SidebarNav({ collapsed, onOpenCommandPalette, ticketCount }: SidebarNavProps) {
  const location = useLocation()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(getInitialSections)

  // Auto-ouvrir la section de la route active
  useEffect(() => {
    const activeSection = SECTIONS.find(s =>
      s.items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
    )
    if (activeSection && !openSections[activeSection.id]) {
      setOpenSections(prev => {
        const next = { ...prev, [activeSection.id]: true }
        localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(next))
        return next
      })
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(next))
      return next
    })
  }, [])

  const isActive = useCallback((path: string) => {
    return location.pathname === path
  }, [location.pathname])

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
      {/* Search hint */}
      {!collapsed && (
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 w-full px-3 py-2 mb-3 rounded-lg text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Rechercher...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-600 rounded">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}
      {collapsed && (
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center justify-center w-full p-2 mb-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Rechercher (⌘K)"
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {SECTIONS.map((section) => {
        const isOpen = openSections[section.id] !== false // ouvert par défaut
        const hasActive = section.items.some(item => isActive(item.path))
        const showBadge = section.id === 'support' && ticketCount && ticketCount > 0

        return (
          <div key={section.id} className="mb-1">
            {/* Section header */}
            {!collapsed ? (
              <button
                onClick={() => toggleSection(section.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  hasActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span>{section.icon}</span>
                <span className="flex-1 text-left">{section.label}</span>
                {showBadge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                    {ticketCount > 99 ? '99+' : ticketCount}
                  </span>
                )}
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="flex justify-center py-1">
                <span className="text-sm" title={section.label}>{section.icon}</span>
              </div>
            )}

            {/* Section items */}
            {(collapsed || isOpen) && (
              <div className={collapsed ? 'space-y-1' : 'ml-2 space-y-0.5 mt-0.5'}>
                {section.items.map((item) => {
                  const active = isActive(item.path)
                  const Icon = item.icon

                  if (collapsed) {
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={item.name}
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                          active
                            ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </Link>
                    )
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export { SECTIONS, STORAGE_KEY_COLLAPSED, getInitialCollapsed }
export type { NavItem, NavSection }
