/**
 * Configuration centralisée pour Super Admin Client
 */

import { z } from 'zod'

const configSchema = z.object({
  appName: z.string().default('Quelyos Super Admin'),
  appVersion: z.string().default('1.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  debug: z.boolean().default(false),

  apiUrl: z.string().url(),
  apiTimeout: z.number().min(1000).max(60000).default(30000),
  apiRetryAttempts: z.number().min(0).max(5).default(3),

  authTokenKey: z.string().default('quelyos_token'),
  sessionTimeout: z.number().min(60000).default(1800000),

  features: z
    .object({
      darkMode: z.boolean().default(true),
      analytics: z.boolean().default(true),
      notifications: z.boolean().default(true),
    })
    .default({
      darkMode: true,
      analytics: true,
      notifications: true,
    }),

  defaultPageSize: z.number().min(10).max(100).default(50),
  maxPageSize: z.number().min(50).max(500).default(200),

  cacheTtl: z.number().min(0).default(300000),
  cacheEnabled: z.boolean().default(true),

  toastDuration: z.number().min(1000).max(10000).default(4000),
})

export type AppConfig = z.infer<typeof configSchema>

function loadConfig(): AppConfig {
  const rawConfig = {
    appName: import.meta.env.VITE_APP_NAME,
    appVersion: import.meta.env.VITE_APP_VERSION,
    environment: import.meta.env.VITE_ENV || import.meta.env.MODE,
    debug: import.meta.env.VITE_DEBUG === 'true',

    apiUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8069',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    apiRetryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),

    authTokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY,
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000'),

    features: {
      darkMode: import.meta.env.VITE_FEATURE_DARK_MODE !== 'false',
      analytics: import.meta.env.VITE_FEATURE_ANALYTICS !== 'false',
      notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS !== 'false',
    },

    defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '50'),
    maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '200'),

    cacheTtl: parseInt(import.meta.env.VITE_CACHE_TTL || '300000'),
    cacheEnabled: import.meta.env.VITE_CACHE_ENABLED !== 'false',

    toastDuration: parseInt(import.meta.env.VITE_TOAST_DURATION || '4000'),
  }

  const result = configSchema.safeParse(rawConfig)

  if (!result.success) {
    console.error('Configuration validation failed:', result.error.flatten())

    if (import.meta.env.DEV) {
      console.warn('Using default values for invalid config fields')
      return configSchema.parse({
        ...rawConfig,
        apiUrl: rawConfig.apiUrl || 'http://localhost:8069',
      })
    }

    throw new Error('Invalid configuration')
  }

  return result.data
}

export const config = loadConfig()

Object.freeze(config)
Object.freeze(config.features)

export function isProduction(): boolean {
  return config.environment === 'production'
}

export function isDevelopment(): boolean {
  return config.environment === 'development'
}

export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return config.features[feature]
}

export function apiUrl(path: string): string {
  const base = config.apiUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

export default config
