/**
 * Configuration centralisée pour le système d'authentification
 * Toutes les apps peuvent importer et utiliser cette configuration
 */

export const authConfig = {
  // Durées de vie des tokens
  tokens: {
    accessTokenDuration: 15 * 60 * 1000, // 15 minutes
    refreshTokenDuration: 7 * 24 * 60 * 60 * 1000, // 7 jours
    refreshInterval: 10 * 60 * 1000, // Refresh tous les 10 minutes
  },

  // Session
  session: {
    timeout: 24 * 60 * 60 * 1000, // 24 heures
    warningBeforeExpiry: 5 * 60 * 1000, // Avertir 5 min avant expiration
  },

  // Sécurité
  security: {
    maxLoginAttempts: 5,
    loginAttemptWindow: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8,
    requireStrongPassword: true,
  },

  // Comportement UI
  ui: {
    redirectAfterLogin: "/dashboard",
    redirectAfterLogout: "/login",
    showSessionWarning: true,
  },

  // API endpoints (relatifs)
  endpoints: {
    login: "/auth/login",
    logout: "/auth/logout",
    validate: "/auth/validate",
    refresh: "/auth/refresh",
    register: "/auth/register",
  },

  // Feature flags
  features: {
    rememberMe: true,
    twoFactorAuth: false,
    oauth: true,
    sessionRecovery: true,
  },
} as const;

export type AuthConfig = typeof authConfig;
