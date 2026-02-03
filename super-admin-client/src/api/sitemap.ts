/**
 * API Sitemap Dynamique V3
 *
 * Charge les routes en runtime depuis un endpoint API
 * - Healthcheck routes (détecte 404)
 * - Cache intelligent
 * - Rafraîchissement périodique
 */

export interface RouteHealth {
  path: string
  status: 'ok' | 'error' | 'unknown'
  statusCode?: number
  responseTime?: number
  lastChecked?: string
}

export interface AppRouteDynamic {
  path: string
  name: string
  description?: string
  module?: string
  type?: 'static' | 'dynamic'
  health?: RouteHealth
}

export interface AppSectionDynamic {
  id: string
  name: string
  baseUrl: string
  port: number
  routes: AppRouteDynamic[]
  health?: {
    total: number
    ok: number
    errors: number
    lastChecked: string
  }
}

export interface SitemapAPIResponse {
  success: boolean
  data: {
    apps: AppSectionDynamic[]
    totalRoutes: number
    lastGenerated: string
    version: string
  }
  error?: string
}

/**
 * Fetch sitemap depuis API
 * Mock pour V3 - À implémenter avec vrai endpoint
 */
export async function fetchSitemapDynamic(): Promise<SitemapAPIResponse> {
  // TODO: Implémenter vrai endpoint backend
  // GET /api/v1/sitemap
  //
  // Pour l'instant, retourne mock data
  // Simule un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500))

  return {
    success: true,
    data: {
      apps: [],
      totalRoutes: 0,
      lastGenerated: new Date().toISOString(),
      version: '3.0.0-mock',
    },
  }
}

/**
 * Healthcheck une route
 * Ping l'URL pour vérifier qu'elle répond
 */
export async function healthcheckRoute(
  baseUrl: string,
  path: string
): Promise<RouteHealth> {
  const url = `${baseUrl}${path}`

  try {
    const startTime = performance.now()
    const response = await fetch(url, {
      method: 'HEAD', // HEAD plus rapide que GET
      mode: 'no-cors', // Évite CORS errors
    })
    const endTime = performance.now()

    return {
      path,
      status: response.ok ? 'ok' : 'error',
      statusCode: response.status,
      responseTime: Math.round(endTime - startTime),
      lastChecked: new Date().toISOString(),
    }
  } catch {
    return {
      path,
      status: 'error',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Healthcheck toutes les routes d'une app
 * Limite parallélisme pour éviter rate limiting
 */
export async function healthcheckApp(
  app: AppSectionDynamic,
  maxConcurrent = 5
): Promise<AppSectionDynamic> {
  // SÉCURITÉ : Log healthcheck uniquement en dev
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- Debug logging for healthcheck progress
    console.log(`🏥 Healthchecking ${app.name}...`)
  }

  const chunks: AppRouteDynamic[][] = []
  for (let i = 0; i < app.routes.length; i += maxConcurrent) {
    chunks.push(app.routes.slice(i, i + maxConcurrent))
  }

  const routesWithHealth: AppRouteDynamic[] = []

  for (const chunk of chunks) {
    const healthChecks = await Promise.all(
      chunk.map(route => healthcheckRoute(app.baseUrl, route.path))
    )

    chunk.forEach((route, idx) => {
      routesWithHealth.push({
        ...route,
        health: healthChecks[idx],
      })
    })

    // Petit délai entre chunks pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const healthStats = {
    total: routesWithHealth.length,
    ok: routesWithHealth.filter(r => r.health?.status === 'ok').length,
    errors: routesWithHealth.filter(r => r.health?.status === 'error').length,
    lastChecked: new Date().toISOString(),
  }

  // SÉCURITÉ : Log résultats uniquement en dev
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- Debug logging for healthcheck results
    console.log(`  ✅ ${healthStats.ok}/${healthStats.total} routes OK`)
  }

  return {
    ...app,
    routes: routesWithHealth,
    health: healthStats,
  }
}
