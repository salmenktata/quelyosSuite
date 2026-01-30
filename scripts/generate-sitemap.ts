#!/usr/bin/env tsx

/**
 * Script génération automatique Sitemap V2 (Fixed)
 *
 * Scanne les 4 applications et génère super-admin-client/src/config/sitemap.ts
 * Utilise fs natif (pas de globby pour éviter problèmes dépendances)
 *
 * Usage:
 *   pnpm generate-sitemap
 *   pnpm generate-sitemap --dry-run  # Preview sans écrire
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT_DIR = join(__dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')
const JSON_ONLY = process.argv.includes('--json')

interface RouteInfo {
  path: string
  name: string
  description?: string
  module?: string
  type?: 'static' | 'dynamic'
}

interface AppConfig {
  id: string
  name: string
  baseUrl: string
  port: number
  icon: string
  color: string
  bgColor: string
  darkBgColor: string
}

// ============================================================================
// Configuration Apps
// ============================================================================

const APPS_CONFIG: AppConfig[] = [
  {
    id: 'vitrine-quelyos',
    name: 'Vitrine Quelyos',
    baseUrl: 'http://localhost:3000',
    port: 3000,
    icon: 'Globe',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-900/20',
  },
  {
    id: 'dashboard-client',
    name: 'Dashboard Client',
    baseUrl: 'http://localhost:5175',
    port: 5175,
    icon: 'LayoutDashboard',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-900/20',
  },
  {
    id: 'super-admin-client',
    name: 'Super Admin Client',
    baseUrl: 'http://localhost:9000',
    port: 9000,
    icon: 'ShieldCheck',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50',
    darkBgColor: 'dark:bg-teal-900/20',
  },
  {
    id: 'vitrine-client',
    name: 'Boutique E-commerce',
    baseUrl: 'http://localhost:3001',
    port: 3001,
    icon: 'ShoppingBag',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-900/20',
  },
]

// ============================================================================
// Utilitaires
// ============================================================================

function walkDir(dir: string, filter: (file: string) => boolean): string[] {
  if (!existsSync(dir)) return []

  const results: string[] = []

  function walk(currentDir: string) {
    try {
      const files = readdirSync(currentDir)

      for (const file of files) {
        const filePath = join(currentDir, file)
        const stat = statSync(filePath)

        if (stat.isDirectory()) {
          // Skip node_modules, .next, dist
          if (!['node_modules', '.next', 'dist', '.turbo'].includes(file)) {
            walk(filePath)
          }
        } else if (filter(filePath)) {
          results.push(filePath)
        }
      }
    } catch (_err) {
      // Ignore permission errors
    }
  }

  walk(dir)
  return results
}

function pathToRoute(filePath: string, baseDir: string): string {
  let route = filePath
    .replace(baseDir, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\\page\.tsx$/, '')
    .replace(/^\(.*?\)\//, '') // Remove route groups (shop)

  if (!route || route === '/') {
    return '/'
  }

  // Normalize slashes
  route = route.replace(/\\/g, '/')

  // Remove trailing slash
  return route.replace(/\/$/, '')
}

function routeToName(route: string): string {
  if (route === '/') return 'Accueil'

  const segments = route.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  return lastSegment
    .replace(/\[.*?\]/g, '') // Remove [slug]
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function isDynamic(path: string): boolean {
  return /\[|:/.test(path)
}

// ============================================================================
// Scanner Vitrine Quelyos (Next.js 14)
// ============================================================================

function scanVitrineQuelyos(): RouteInfo[] {
  console.log('📡 Scanning Vitrine Quelyos...')
  const appDir = join(ROOT_DIR, 'vitrine-quelyos', 'app')

  if (!existsSync(appDir)) {
    console.warn('⚠️  vitrine-quelyos/app not found, skipping')
    return []
  }

  const pages = walkDir(appDir, file => file.endsWith('page.tsx'))

  const routes = pages.map(page => {
    const route = pathToRoute(page, appDir)
    const name = routeToName(route)

    return {
      path: route,
      name,
      type: isDynamic(route) ? 'dynamic' as const : 'static' as const,
    }
  })

  console.log(`  ✅ Found ${routes.length} routes`)
  return routes.sort((a, b) => a.path.localeCompare(b.path))
}

// ============================================================================
// Scanner Dashboard Client (React Router + modules.ts)
// ============================================================================

function scanDashboardClient(): RouteInfo[] {
  console.log('📡 Scanning Dashboard Client...')
  const modulesPath = join(ROOT_DIR, 'dashboard-client', 'src', 'config', 'modules.ts')

  if (!existsSync(modulesPath)) {
    console.warn('⚠️  dashboard-client/src/config/modules.ts not found, skipping')
    return []
  }

  const routes: RouteInfo[] = []
  const content = readFileSync(modulesPath, 'utf-8')

  // Extract module names
  const moduleMatches = content.matchAll(/id:\s*'(\w+)',\s*name:\s*'([^']+)'/g)
  const modules = Array.from(moduleMatches).map(m => ({ id: m[1], name: m[2] }))

  // Extract paths from items
  const pathMatches = content.matchAll(/{\s*name:\s*'([^']+)',\s*path:\s*'([^']+)'/g)

  for (const match of pathMatches) {
    const [, name, path] = match

    // Infer module from path
    const moduleId = path.split('/')[1]
    const module = modules.find(m => m.id === moduleId)

    routes.push({
      path,
      name,
      module: module?.name,
      type: isDynamic(path) ? 'dynamic' : 'static',
    })
  }

  console.log(`  ✅ Found ${routes.length} routes`)
  return routes.sort((a, b) => a.path.localeCompare(b.path))
}

// ============================================================================
// Scanner Super Admin Client (Layout navigation)
// ============================================================================

function scanSuperAdminClient(): RouteInfo[] {
  console.log('📡 Scanning Super Admin Client...')
  const layoutPath = join(ROOT_DIR, 'super-admin-client', 'src', 'components', 'Layout.tsx')

  if (!existsSync(layoutPath)) {
    console.warn('⚠️  super-admin-client Layout.tsx not found, skipping')
    return []
  }

  const content = readFileSync(layoutPath, 'utf-8')

  // Extract navigation array
  const navMatch = content.match(/const navigation = \[([\s\S]*?)\]/m)
  if (!navMatch) {
    console.warn('⚠️  Could not parse navigation array')
    return []
  }

  const routes: RouteInfo[] = []
  const itemMatches = navMatch[1].matchAll(/{\s*name:\s*'([^']+)',\s*path:\s*'([^']+)'/g)

  for (const match of itemMatches) {
    const [, name, path] = match
    routes.push({
      path,
      name,
      type: isDynamic(path) ? 'dynamic' : 'static',
    })
  }

  console.log(`  ✅ Found ${routes.length} routes`)
  return routes.sort((a, b) => a.path.localeCompare(b.path))
}

// ============================================================================
// Scanner Vitrine Client (Next.js 16 - E-commerce)
// ============================================================================

function scanVitrineClient(): RouteInfo[] {
  console.log('📡 Scanning Vitrine Client (E-commerce)...')
  const appDir = join(ROOT_DIR, 'vitrine-client', 'src', 'app')

  if (!existsSync(appDir)) {
    console.warn('⚠️  vitrine-client/src/app not found, skipping')
    return []
  }

  const pages = walkDir(appDir, file => file.endsWith('page.tsx'))

  const routes = pages.map(page => {
    const route = pathToRoute(page, appDir)
    const name = routeToName(route)

    return {
      path: route,
      name,
      type: isDynamic(route) ? 'dynamic' as const : 'static' as const,
    }
  })

  console.log(`  ✅ Found ${routes.length} routes`)
  return routes.sort((a, b) => a.path.localeCompare(b.path))
}

// ============================================================================
// Génération fichier sitemap.ts
// ============================================================================

function generateSitemapFile(appsData: Record<string, RouteInfo[]>) {
  console.log('\n📝 Generating sitemap.ts...')

  const totalRoutes = Object.values(appsData).reduce((acc, routes) => acc + routes.length, 0)

  const content = `import { Globe, LayoutDashboard, ShieldCheck, ShoppingBag, type LucideIcon } from 'lucide-react'

/**
 * Configuration Sitemap Multi-Apps
 *
 * ⚠️  FICHIER GÉNÉRÉ AUTOMATIQUEMENT
 * Ne pas modifier manuellement - Utiliser \`pnpm generate-sitemap\`
 *
 * Total routes: ${totalRoutes}
 * Généré le: ${new Date().toISOString()}
 */

export interface AppRoute {
  path: string
  name: string
  description?: string
  module?: string
  type?: 'static' | 'dynamic'
}

export interface AppSection {
  id: string
  name: string
  baseUrl: string
  port: number
  icon: LucideIcon
  color: string
  bgColor: string
  darkBgColor: string
  routes: AppRoute[]
}

export const sitemapData: AppSection[] = [
${APPS_CONFIG.map(app => `  {
    id: '${app.id}',
    name: '${app.name}',
    baseUrl: '${app.baseUrl}',
    port: ${app.port},
    icon: ${app.icon},
    color: '${app.color}',
    bgColor: '${app.bgColor}',
    darkBgColor: '${app.darkBgColor}',
    routes: [
${appsData[app.id]?.map(route =>
  `      { path: '${route.path}', name: '${route.name}'${route.module ? `, module: '${route.module}'` : ''}${route.type ? `, type: '${route.type}'` : ''} },`
).join('\n') || ''}
    ],
  }`).join(',\n')}
]

// Statistiques globales
export const getSitemapStats = () => {
  const totalRoutes = sitemapData.reduce((acc, app) => acc + app.routes.length, 0)
  const appStats = sitemapData.map(app => ({
    id: app.id,
    name: app.name,
    count: app.routes.length,
  }))

  return {
    totalRoutes,
    totalApps: sitemapData.length,
    appStats,
  }
}

// Détecter type route (static vs dynamic)
export function getRouteType(path: string): 'static' | 'dynamic' {
  return /\\[|:/.test(path) ? 'dynamic' : 'static'
}

// Extraire modules uniques (Dashboard Client)
export function getDashboardModules(): string[] {
  const dashboardApp = sitemapData.find(app => app.id === 'dashboard-client')
  if (!dashboardApp) return []

  const modules = new Set<string>()
  dashboardApp.routes.forEach(route => {
    if (route.module) {
      modules.add(route.module)
    }
  })

  return Array.from(modules).sort()
}

// Enrichir routes avec type auto-détecté
export const enrichedSitemapData = sitemapData.map(app => ({
  ...app,
  routes: app.routes.map(route => ({
    ...route,
    type: route.type || getRouteType(route.path),
  })),
}))
`

  return content
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  // Mode JSON only: retourner JSON sur stdout et exit
  if (JSON_ONLY) {
    const appsData: Record<string, RouteInfo[]> = {
      'vitrine-quelyos': scanVitrineQuelyos(),
      'dashboard-client': scanDashboardClient(),
      'super-admin-client': scanSuperAdminClient(),
      'vitrine-client': scanVitrineClient(),
    }

    const totalRoutes = Object.values(appsData).reduce((acc, routes) => acc + routes.length, 0)

    const jsonData = {
      apps: APPS_CONFIG.map(appConfig => ({
        id: appConfig.id,
        name: appConfig.name,
        baseUrl: appConfig.baseUrl,
        port: appConfig.port,
        routes: appsData[appConfig.id] || []
      })),
      totalRoutes,
      lastGenerated: new Date().toISOString(),
      version: '3.0.0'
    }

    console.log(JSON.stringify(jsonData))
    return
  }

  console.log('🚀 Sitemap Generator V2 (Fixed)\n')

  // Scanner toutes les apps
  const appsData: Record<string, RouteInfo[]> = {
    'vitrine-quelyos': scanVitrineQuelyos(),
    'dashboard-client': scanDashboardClient(),
    'super-admin-client': scanSuperAdminClient(),
    'vitrine-client': scanVitrineClient(),
  }

  // Statistiques
  const totalRoutes = Object.values(appsData).reduce((acc, routes) => acc + routes.length, 0)
  console.log(`\n📊 Total: ${totalRoutes} routes`)
  Object.entries(appsData).forEach(([app, routes]) => {
    console.log(`   - ${app}: ${routes.length} routes`)
  })

  // Générer fichier TypeScript
  const content = generateSitemapFile(appsData)
  const outputPath = join(ROOT_DIR, 'super-admin-client', 'src', 'config', 'sitemap.ts')

  // Générer fichier JSON pour backend
  const jsonData = {
    apps: APPS_CONFIG.map(appConfig => ({
      id: appConfig.id,
      name: appConfig.name,
      baseUrl: appConfig.baseUrl,
      port: appConfig.port,
      routes: appsData[appConfig.id] || []
    })),
    totalRoutes,
    lastGenerated: new Date().toISOString(),
    version: '3.0.0'
  }
  const jsonOutputPath = join(ROOT_DIR, 'odoo-backend', 'addons', 'quelyos_api', 'data', 'sitemap.json')

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN - Preview (first 1000 chars):\n')
    console.log(content.slice(0, 1000) + '...\n')
    console.log(`Would write to: ${outputPath}`)
    console.log(`Would write JSON to: ${jsonOutputPath}`)
  } else {
    writeFileSync(outputPath, content, 'utf-8')
    console.log(`\n✅ Generated: ${outputPath}`)

    writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2), 'utf-8')
    console.log(`✅ Generated JSON: ${jsonOutputPath}`)
  }

  console.log('\n✨ Done!')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
