/**
 * Page Sitemap - Vue d'ensemble routes multi-apps
 *
 * Fonctionnalités :
 * 1. Liste routes Vitrine Quelyos (Next.js 14, port 3000)
 * 2. Liste routes Dashboard Client (React/Vite, port 5175)
 * 3. Liste routes Super Admin Client (React/Vite, port 5176)
 * 4. Liste routes Boutique E-commerce (Next.js 16, port 3001)
 * 5. Liens cliquables vers chaque route (nouvel onglet)
 * 6. Groupement visuel par application
 * 7. Compteurs routes par app + total global
 * 8. Design adaptatif dark/light mode
 */

import { useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { sitemapData, getSitemapStats, type AppSection } from '@/config/sitemap'

export function Sitemap() {
  const [searchQuery, setSearchQuery] = useState('')
  const stats = getSitemapStats()

  // Filtre routes par recherche
  const filteredData = sitemapData.map(app => ({
    ...app,
    routes: app.routes.filter(
      route =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.module?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sitemap Architecture</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Vue d&apos;ensemble des routes de l&apos;écosystème Quelyos
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRoutes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Routes totales</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApps}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une route, module ou nom..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
        />
      </div>

      {/* Apps Sections */}
      <div className="space-y-6">
        {filteredData.map(app => (
          <AppSectionCard key={app.id} app={app} />
        ))}
      </div>

      {/* Empty state si recherche sans résultat */}
      {searchQuery && filteredData.every(app => app.routes.length === 0) && (
        <div className="text-center py-12">
          <Search className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune route trouvée</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Essayez avec un autre terme de recherche
          </p>
        </div>
      )}
    </div>
  )
}

interface AppSectionCardProps {
  app: AppSection
}

function AppSectionCard({ app }: AppSectionCardProps) {
  const Icon = app.icon

  // Grouper routes par module (si module défini)
  const routesByModule = app.routes.reduce((acc, route) => {
    const module = route.module || 'Général'
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(route)
    return acc
  }, {} as Record<string, typeof app.routes>)

  const modules = Object.keys(routesByModule).sort()

  // Si aucune route après filtrage, ne pas afficher
  if (app.routes.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className={`${app.bgColor} ${app.darkBgColor} px-6 py-4 border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${app.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{app.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Port <span className="font-mono font-semibold">{app.port}</span>
                </span>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <a
                  href={app.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  {app.baseUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full ${app.bgColor} ${app.darkBgColor}`}>
            <span className={`text-sm font-semibold ${app.color}`}>
              {app.routes.length} {app.routes.length === 1 ? 'route' : 'routes'}
            </span>
          </div>
        </div>
      </div>

      {/* Routes groupées par module */}
      <div className="p-6 space-y-6">
        {modules.map(module => (
          <div key={module}>
            {modules.length > 1 && (
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                {module}
              </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {routesByModule[module].map((route, idx) => (
                <a
                  key={idx}
                  href={`${app.baseUrl}${route.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {route.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                      {route.path}
                    </div>
                    {route.description && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {route.description}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 flex-shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
