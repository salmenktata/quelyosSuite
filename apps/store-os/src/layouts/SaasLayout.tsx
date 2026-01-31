import { useState, useCallback } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon, LogOut, ChevronDown, ChevronRight } from 'lucide-react'
import { branding } from '../config/branding'
import { MODULES, type Module } from '../config/modules'
import { useAuth } from '../lib/store/compat/auth'

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }, [])

  return { dark, toggle }
}

export function SaasLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [activeModule, setActiveModule] = useState<Module>(MODULES[0])
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const { user, logout } = useAuth()

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const isActive = (path: string) => {
    if (path === '/store') return location.pathname === '/store' || location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Auto-detect active module from URL
  const currentModule = location.pathname.startsWith('/marketing') ? MODULES[1] || activeModule : MODULES[0]
  if (currentModule !== activeModule) setActiveModule(currentModule)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform lg:translate-x-0 lg:static lg:z-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: branding.color }}>
            {branding.shortName.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900 dark:text-white truncate">{branding.name}</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-500 dark:text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Module switcher */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
          {MODULES.map((mod) => {
            const Icon = mod.icon
            const isModActive = activeModule.id === mod.id
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                  isModActive
                    ? 'text-violet-700 dark:text-violet-400 border-b-2 border-violet-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {mod.shortName}
              </button>
            )
          })}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeModule.sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = item.path ? isActive(item.path) : false
                  const hasSubItems = item.subItems && item.subItems.length > 0
                  const itemKey = item.path || item.name
                  const expanded = expandedItems.has(itemKey)

                  return (
                    <div key={itemKey}>
                      <div className="flex items-center">
                        <NavLink
                          to={item.path || '#'}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            active ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          style={active ? { backgroundColor: branding.color } : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </NavLink>
                        {hasSubItems && (
                          <button onClick={() => toggleExpand(itemKey)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                      {hasSubItems && expanded && (
                        <div className="ml-6 mt-0.5 space-y-0.5">
                          {item.subItems!.filter(s => !s.separator).map((sub) => {
                            const SubIcon = sub.icon
                            const subActive = sub.path ? isActive(sub.path) : false
                            return (
                              <NavLink
                                key={sub.path || sub.name}
                                to={sub.path || '#'}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  subActive
                                    ? 'text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                                <span className="truncate">{sub.name}</span>
                              </NavLink>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {user && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-400 text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Déconnexion">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 dark:text-gray-400">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <button onClick={toggle} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={dark ? 'Mode clair' : 'Mode sombre'}>
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
