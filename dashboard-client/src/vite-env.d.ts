/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_ANALYTICS_ID: string
  readonly VITE_ANIMATIONS_ENABLED: string
  readonly VITE_API_RETRY_ATTEMPTS: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_AUTH_REFRESH_INTERVAL: string
  readonly VITE_AUTH_TOKEN_KEY: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_CACHE_ENABLED: string
  readonly VITE_CACHE_TTL: string
  readonly VITE_DEBUG: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_EDITION: string
  readonly VITE_ENV: string
  readonly VITE_FEATURE_ANALYTICS: string
  readonly VITE_FEATURE_DARK_MODE: string
  readonly VITE_FEATURE_EXPERIMENTAL: string
  readonly VITE_FEATURE_MULTI_LANGUAGE: string
  readonly VITE_FEATURE_NOTIFICATIONS: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_MAX_PAGE_SIZE: string
  readonly VITE_PEXELS_API_KEY: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_TOAST_DURATION: string
  readonly VITE_UNSPLASH_ACCESS_KEY: string
  readonly VITE_VITRINE_URL: string
  readonly VITE_WS_RECONNECT_DELAY: string
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
