/**
 * URLs des 4 applications frontend Quelyos Suite
 *
 * Fournit les URLs complètes pour chaque environnement (dev, staging, prod)
 */

import { PORTS } from './ports';
import { type RuntimeEnvironment } from './env';

/**
 * Configuration URL pour une application
 */
export interface AppConfig {
  /** URL développement local */
  dev: string;
  /** URL staging (pré-production) */
  staging?: string;
  /** URL production */
  prod: string;
}

/**
 * URLs de toutes les applications frontend
 */
export const APPS = {
  /** Site vitrine marketing */
  vitrine: {
    dev: `http://localhost:${PORTS.vitrine}`,
    prod: 'https://quelyos.com',
  },

  /** E-commerce client */
  ecommerce: {
    dev: `http://localhost:${PORTS.ecommerce}`,
    prod: 'https://shop.quelyos.com',
  },

  /** Dashboard ERP complet / Full Suite */
  dashboard: {
    dev: `http://localhost:${PORTS.dashboard}`,
    prod: 'https://backoffice.quelyos.com',
  },

  /** Panel super admin SaaS */
  superadmin: {
    dev: `http://localhost:${PORTS.superadmin}`,
    prod: 'https://admin.quelyos.com',
  },
} as const;

/**
 * Type pour les noms d'applications
 */
export type AppName = keyof typeof APPS;

/**
 * Récupère l'URL d'une application selon l'environnement
 *
 * @param app - Nom de l'application
 * @param env - Environnement ('development' | 'staging' | 'production')
 * @returns URL complète de l'application
 */
export function getAppUrl(app: AppName, env: RuntimeEnvironment = 'development'): string {
  const config = APPS[app];

  if (env === 'production') {
    return config.prod;
  }

  // Staging utilise la même URL que dev pour l'instant
  return config.dev;
}

/**
 * Récupère l'URL de l'application actuelle
 *
 * Détecte automatiquement l'application depuis `window.location` (côté client uniquement)
 *
 * @returns URL de l'application actuelle ou null si non détectée
 */
export function getCurrentAppUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const { hostname, port } = window.location;
  const currentPort = port ? parseInt(port, 10) : 80;

  // Match par port en dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (currentPort === PORTS.vitrine) return APPS.vitrine.dev;
    if (currentPort === PORTS.ecommerce) return APPS.ecommerce.dev;
    if (currentPort === PORTS.dashboard) return APPS.dashboard.dev;
    if (currentPort === PORTS.superadmin) return APPS.superadmin.dev;
  }

  // Match par domaine en prod
  const fullHostname = window.location.hostname;
  if (fullHostname === 'quelyos.com') return APPS.vitrine.prod;
  if (fullHostname === 'shop.quelyos.com') return APPS.ecommerce.prod;
  if (fullHostname === 'backoffice.quelyos.com') return APPS.dashboard.prod;
  if (fullHostname === 'admin.quelyos.com') return APPS.superadmin.prod;

  return null;
}

/**
 * Vérifie si l'URL actuelle correspond à une application
 *
 * @param app - Nom de l'application à vérifier
 * @returns true si on est sur cette application
 */
export function isCurrentApp(app: AppName): boolean {
  const currentUrl = getCurrentAppUrl();
  if (!currentUrl) return false;

  const config = APPS[app];
  return currentUrl === config.dev || currentUrl === config.prod;
}

/**
 * Construit une URL absolue vers une autre application
 *
 * Utile pour la navigation cross-app (ex: vitrine → dashboard)
 *
 * @param app - Nom de l'application cible
 * @param path - Chemin relatif (ex: '/login')
 * @param env - Environnement (auto-détecté si non fourni)
 * @returns URL absolue complète
 */
export function buildCrossAppUrl(
  app: AppName,
  path: string = '/',
  env?: RuntimeEnvironment
): string {
  const baseUrl = getAppUrl(app, env);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
