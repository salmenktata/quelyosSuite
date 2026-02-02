import { Outlet, Link, useLocation } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Users, Package, CreditCard, DollarSign, Activity, Database, Settings, Moon, Sun, LogOut, Shield, ShieldCheck, FileText, MessageSquare, FilePlus, Sparkles, Map, Mail, Scale } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', path: '/tenants', icon: Users },
  { name: 'Plans', path: '/plans', icon: Package },
  { name: 'Abonnements', path: '/subscriptions', icon: CreditCard },
  { name: 'Facturation', path: '/billing', icon: DollarSign },
  { name: 'Monitoring', path: '/monitoring', icon: Activity },
  { name: 'Sécurité', path: '/security', icon: Shield },
  { name: '2FA / TOTP', path: '/security/2fa', icon: ShieldCheck },
  { name: 'Configuration IA', path: '/ai-config', icon: Sparkles },
  { name: 'Support', path: '/support-tickets', icon: MessageSquare },
  { name: 'Templates', path: '/support-templates', icon: FilePlus },
  { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
  { name: 'Backups', path: '/backups', icon: Database },
  { name: 'Données Seed', path: '/seed-data', icon: Database },
  { name: 'Sitemap', path: '/sitemap', icon: Map },
  { name: 'Paramètres', path: '/settings', icon: Settings },
  { name: 'Email (SMTP)', path: '/email-settings', icon: Mail },
  { name: 'Mentions légales', path: '/legal-settings', icon: Scale },
]

export function Layout() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Quelyos</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
