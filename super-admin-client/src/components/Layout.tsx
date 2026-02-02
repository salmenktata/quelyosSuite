import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { Moon, Sun, LogOut, PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react'
import { SidebarNav, STORAGE_KEY_COLLAPSED, getInitialCollapsed } from '@/components/sidebar/SidebarNav'
import { CommandPalette } from '@/components/CommandPalette'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { getBreadcrumbs } from '@/lib/breadcrumbs'

export function Layout() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const { logout } = useAuth()
  const { isOpen: cmdOpen, open: openCmd, close: closeCmd } = useCommandPalette()

  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Persister sidebar collapsed
  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(next))
      return next
    })
  }, [])

  // Fermer menu mobile au changement de route
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
  }

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'
  const mainMargin = collapsed ? 'lg:ml-16' : 'lg:ml-64'

  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo + collapse toggle */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">Quelyos</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
                  </div>
                </div>
                <button
                  onClick={toggleCollapsed}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:flex"
                  title="Réduire la sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Mobile close */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center w-full gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <button
                  onClick={toggleCollapsed}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Étendre la sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <SidebarNav
            collapsed={collapsed}
            onOpenCommandPalette={openCmd}
          />

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <NotificationCenter collapsed={collapsed} />
            <button
              onClick={toggleTheme}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
              title={theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {!collapsed && <span className="font-medium text-sm">{theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="font-medium text-sm">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${mainMargin} transition-all duration-200`}>
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center h-14 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-500 rounded flex items-center justify-center">
              <span className="text-sm">✨</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Quelyos Admin</span>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {/* Breadcrumbs automatiques */}
          {breadcrumbs && breadcrumbs.length > 1 && (
            <Breadcrumbs items={breadcrumbs} />
          )}
          <Outlet />
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={closeCmd} />
    </div>
  )
}
