/**
 * @quelyos/config - Configuration centralisée Quelyos Suite
 *
 * Package central pour toutes les URLs, ports et configurations.
 * Source de vérité unique pour éviter les hardcoded URLs.
 *
 * Usage :
 * ```typescript
 * import { PORTS, APPS, API, getViteProxyConfig } from '@quelyos/config';
 *
 * // Utiliser les ports
 * server: { port: PORTS.dashboard }
 *
 * // Utiliser les URLs
 * const backendUrl = API.backend.dev;
 *
 * // Configurer proxy Vite
 * proxy: getViteProxyConfig()
 * ```
 */

// Ports fixes
export { PORTS, isQuelyosPort, getServiceByPort } from './ports';
export type { ServiceName, PortNumber } from './ports';

// Environnement
export {
  detectPlatform,
  detectEnvironment,
  isDevelopment,
  isStaging,
  isProduction,
  isTest,
  isServer,
  isClient,
  getEnvVar,
  getPublicEnvVar,
} from './env';
export type { RuntimeEnvironment, RuntimePlatform } from './env';

// Applications frontend
export {
  APPS,
  getAppUrl,
  getCurrentAppUrl,
  isCurrentApp,
  buildCrossAppUrl,
} from './apps';
export type { AppName, AppConfig } from './apps';

// Backend API
export {
  API,
  getBackendUrl,
  getViteProxyConfig,
  getNextRewriteConfig,
  getProxiedImageUrl,
  buildApiUrl,
} from './api';
export type { BackendApiConfig } from './api';

// Services externes
export {
  STRIPE,
  IMAGES,
  GOOGLE,
  CDN,
  COMMUNICATION,
  SOCIAL,
  isExternalService,
  getExternalServiceName,
} from './external';

// Validation Zod
export {
  urlSchema,
  httpUrlSchema,
  portSchema,
  nodeEnvSchema,
  viteBackendConfigSchema,
  nextBackendConfigSchema,
  stripeConfigSchema,
  googleConfigSchema,
  validateViteEnv,
  validateNextEnv,
  safeValidateEnv,
  formatZodError,
} from './validation';
export type {
  ViteBackendConfig,
  NextBackendConfig,
  StripeConfig,
  GoogleConfig,
} from './validation';

// Constantes
export {
  TIMEOUTS,
  STORAGE_KEYS,
  SESSION_KEYS,
  LIMITS,
  DATE_FORMATS,
  ERROR_CODES,
  ERROR_MESSAGES,
  PATTERNS,
  DEFAULTS,
  DESIGN_TOKENS,
} from './constants';

// Routes (existantes)
export { ROUTES, validateRouteParam, buildAccountRoute, buildBudgetRoute } from './routes';
export type { RoutePath } from './routes';
