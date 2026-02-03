/**
 * Page Sitemap Dynamique V3
 *
 * Charge routes depuis API en runtime
 * - Healthcheck routes automatique
 * - Rafraîchissement périodique
 * - Cache intelligent
 * - Détection routes cassées (404)
 *
 * Pour activer : Remplacer <Sitemap /> par <SitemapDynamic /> dans AuthenticatedApp.tsx
 */

import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import {
  fetchSitemapDynamic,
  healthcheckApp,
  type AppSectionDynamic,
  type SitemapAPIResponse,
} from '@/api/sitemap'

export function SitemapDynamic() {
  const [data, setData] = useState<SitemapAPIResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [healthchecking, setHealthchecking] = useState(false)
  const [selectedApp, _setSelectedApp] = useState<string | null>(null)

  // Charger sitemap au mount
  useEffect(() => {
    loadSitemap()
  }, [])

  const loadSitemap = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchSitemapDynamic()

      if (response.success) {
        setData(response)
      } else {
        setError(response.error || 'Failed to load sitemap')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const runHealthcheck = async (appId?: string) => {
    if (!data) return

    setHealthchecking(true)

    try {
      const appsToCheck = appId
        ? data.data.apps.filter(app => app.id === appId)
        : data.data.apps

      const checkedApps = await Promise.all(
        appsToCheck.map(app => healthcheckApp(app))
      )

      // Merge with existing apps
      const updatedApps = data.data.apps.map(app => {
        const checked = checkedApps.find(c => c.id === app.id)
        return checked || app
      })

      setData({
        ...data,
        data: {
          ...data.data,
          apps: updatedApps,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Healthcheck failed')
    } finally {
      setHealthchecking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gray-400 dark:text-gray-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du sitemap...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Erreur chargement sitemap
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={loadSitemap}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sitemap Dynamique V3
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Routes chargées en runtime avec healthcheck
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Dernière génération: {new Date(data.data.lastGenerated).toLocaleString('fr-FR')}
            </span>
            <span>Version: {data.data.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runHealthcheck()}
            disabled={healthchecking}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${healthchecking ? 'animate-spin' : ''}`} />
            {healthchecking ? 'Healthcheck...' : 'Healthcheck All'}
          </button>

          <button
            onClick={loadSitemap}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.data.totalRoutes}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Routes totales</div>
        </div>

        {data.data.apps.map(app => {
          if (!app.health) return null

          return (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {app.health.ok}/{app.health.total}
                </div>
                {app.health.ok === app.health.total ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{app.name}</div>
              {app.health.errors > 0 && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {app.health.errors} erreurs
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Apps avec healthcheck */}
      <div className="space-y-6">
        {data.data.apps.map(app => (
          <AppCard
            key={app.id}
            app={app}
            onHealthcheck={() => runHealthcheck(app.id)}
            healthchecking={healthchecking && selectedApp === app.id}
          />
        ))}
      </div>

      {/* Info V3 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🚀 Sitemap Dynamique V3 (Prototype)
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          Cette version charge les routes en runtime depuis une API et permet de détecter les routes cassées.
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          <strong>TODO</strong> : Implémenter endpoint backend <code>/api/v1/sitemap</code> avec scan automatique des 4 apps
        </p>
      </div>
    </div>
  )
}

interface AppCardProps {
  app: AppSectionDynamic
  onHealthcheck: () => void
  healthchecking: boolean
}

function AppCard({ app, onHealthcheck, healthchecking }: AppCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{app.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>Port {app.port}</span>
              <span>•</span>
              <a
                href={app.baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
              >
                {app.baseUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <button
            onClick={onHealthcheck}
            disabled={healthchecking}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${healthchecking ? 'animate-spin' : ''}`} />
            Check
          </button>
        </div>
      </div>

      {/* Routes avec health status */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {app.routes.map((route, idx) => (
            <a
              key={idx}
              href={`${app.baseUrl}${route.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {route.name}
                  </div>
                  {route.health && (
                    <div className="flex-shrink-0">
                      {route.health.status === 'ok' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : route.health.status === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                  {route.path}
                </div>
                {route.health?.responseTime && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {route.health.responseTime}ms
                  </div>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 flex-shrink-0 ml-2" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
