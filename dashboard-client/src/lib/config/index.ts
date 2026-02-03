/**
 * Configuration centralisée pour Quelyos Dashboard
 *
 * Toutes les variables d'environnement et configurations sont validées et typées.
 */

import { z } from 'zod'
import { logger } from '@quelyos/logger'
import { getBackendUrl, TIMEOUTS, STORAGE_KEYS } from '@quelyos/config'

// =============================================================================
// SCHÉMA DE CONFIGURATION
// =============================================================================

const configSchema = z.object({
  // Application
  appName: z.string().default('Quelyos Dashboard'),
  appVersion: z.string().default('1.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  debug: z.boolean().default(false),

  // API
  apiUrl: z.string().url(),
  apiTimeout: z.number().min(1000).max(60000).default(30000),
  apiRetryAttempts: z.number().min(0).max(5).default(3),

  // WebSocket
  wsUrl: z.string().optional(),
  wsReconnectDelay: z.number().min(1000).default(3000),

  // Auth
  authTokenKey: z.string().default('quelyos_token'),
  authRefreshInterval: z.number().min(60000).default(300000), // 5 minutes
  sessionTimeout: z.number().min(60000).default(1800000), // 30 minutes

  // Feature Flags
  features: z
    .object({
      darkMode: z.boolean().default(true),
      multiLanguage: z.boolean().default(false),
      analytics: z.boolean().default(true),
      notifications: z.boolean().default(true),
      experimentalFeatures: z.boolean().default(false),
    })
    .default({
      darkMode: true,
      multiLanguage: false,
      analytics: true,
      notifications: true,
      experimentalFeatures: false,
    }),

  // Pagination
  defaultPageSize: z.number().min(10).max(100).default(20),
  maxPageSize: z.number().min(50).max(500).default(100),

  // Upload
  maxFileSize: z.number().min(1024).default(10 * 1024 * 1024), // 10MB
  allowedFileTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),

  // Cache
  cacheTtl: z.number().min(0).default(300000), // 5 minutes
  cacheEnabled: z.boolean().default(true),

  // Monitoring
  sentryDsn: z.string().optional(),
  analyticsId: z.string().optional(),

  // UI
  toastDuration: z.number().min(1000).max(10000).default(4000),
  animationsEnabled: z.boolean().default(true),
})

export type AppConfig = z.infer<typeof configSchema>

// =============================================================================
// CHARGEMENT DE LA CONFIGURATION
// =============================================================================

function loadConfig(): AppConfig {
  const rawConfig = {
    // Application
    appName: import.meta.env.VITE_APP_NAME,
    appVersion: import.meta.env.VITE_APP_VERSION,
    environment: import.meta.env.VITE_ENV || import.meta.env.MODE,
    debug: import.meta.env.VITE_DEBUG === 'true',

    // API
    apiUrl: import.meta.env.VITE_BACKEND_URL || getBackendUrl(import.meta.env.MODE as any),
    apiTimeout: TIMEOUTS.API_REQUEST,
    apiRetryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),

    // WebSocket
    wsUrl: import.meta.env.VITE_WS_URL,
    wsReconnectDelay: parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY || '3000'),

    // Auth
    authTokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || STORAGE_KEYS.AUTH_TOKEN,
    authRefreshInterval: parseInt(import.meta.env.VITE_AUTH_REFRESH_INTERVAL || String(TIMEOUTS.TOKEN_REFRESH)),
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000'),

    // Features
    features: {
      darkMode: import.meta.env.VITE_FEATURE_DARK_MODE !== 'false',
      multiLanguage: import.meta.env.VITE_FEATURE_MULTI_LANGUAGE === 'true',
      analytics: import.meta.env.VITE_FEATURE_ANALYTICS !== 'false',
      notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS !== 'false',
      experimentalFeatures: import.meta.env.VITE_FEATURE_EXPERIMENTAL === 'true',
    },

    // Pagination
    defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '20'),
    maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '100'),

    // Upload
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || String(10 * 1024 * 1024)),
    allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(','),

    // Cache
    cacheTtl: parseInt(import.meta.env.VITE_CACHE_TTL || '300000'),
    cacheEnabled: import.meta.env.VITE_CACHE_ENABLED !== 'false',

    // Monitoring
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    analyticsId: import.meta.env.VITE_ANALYTICS_ID,

    // UI
    toastDuration: parseInt(import.meta.env.VITE_TOAST_DURATION || '4000'),
    animationsEnabled: import.meta.env.VITE_ANIMATIONS_ENABLED !== 'false',
  }

  // Valider et parser
  const result = configSchema.safeParse(rawConfig)

  if (!result.success) {
    logger.error('Configuration validation failed:', result.error.flatten())

    // En dev, afficher les erreurs mais continuer
    if (import.meta.env.DEV) {
      logger.warn('Using default values for invalid config fields')
      return configSchema.parse({
        ...rawConfig,
        apiUrl: rawConfig.apiUrl || getBackendUrl('development'),
      })
    }

    throw new Error('Invalid configuration')
  }

  return result.data
}

// =============================================================================
// INSTANCE DE CONFIGURATION
// =============================================================================

export const config = loadConfig()

// Freeze pour éviter les modifications accidentelles
Object.freeze(config)
Object.freeze(config.features)

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Vérifie si on est en production
 */
export function isProduction(): boolean {
  return config.environment === 'production'
}

/**
 * Vérifie si on est en développement
 */
export function isDevelopment(): boolean {
  return config.environment === 'development'
}

/**
 * Vérifie si une feature est activée
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return config.features[feature]
}

/**
 * Retourne l'URL de l'API avec un path
 */
export function apiUrl(path: string): string {
  const base = config.apiUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

/**
 * Retourne l'URL WebSocket
 */
export function wsUrl(): string | undefined {
  if (config.wsUrl) {
    return config.wsUrl
  }

  // Dériver du API URL
  try {
    const url = new URL(config.apiUrl)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/websocket'
    return url.toString()
  } catch {
    return undefined
  }
}

// =============================================================================
// EXPORT PAR DÉFAUT
// =============================================================================

export default config
