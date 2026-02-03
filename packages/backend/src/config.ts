/**
 * Configuration environnement intelligent
 * Détecte automatiquement SSR (Next.js server), Client (browser), ou Vite
 *
 * Utilise @quelyos/config pour la détection d'environnement centralisée
 */

import {
  detectPlatform,
  isServer,
  getBackendUrl,
  getAppUrl,
  TIMEOUTS,
  STORAGE_KEYS,
  type RuntimePlatform,
} from '@quelyos/config';

export type Environment = 'server' | 'client' | 'vite';

/**
 * Détecte l'environnement d'exécution actuel
 * @deprecated Utiliser detectPlatform() de @quelyos/config à la place
 */
export function detectEnvironment(): Environment {
  const platform = detectPlatform();

  if (platform === 'vite') return 'vite';
  if (isServer()) return 'server';
  return 'client';
}

/**
 * Configuration Backend selon environnement
 *
 * ANONYMISATION : Ne mentionne jamais "Odoo" dans les noms exports
 */
export interface BackendConfig {
  baseURL: string;
  database: string;
  timeout: number;
  useProxy: boolean;
}

/**
 * Retourne la configuration Backend appropriée selon l'environnement
 */
export function getBackendConfig(): BackendConfig {
  const env = detectEnvironment();

  switch (env) {
    case 'server':
      // Next.js SSR - Utiliser l'URL complète du site
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || getAppUrl('ecommerce', 'development');
      return {
        baseURL: `${siteUrl}/api/backend`,
        database: process.env.BACKEND_DATABASE || 'quelyos',
        timeout: TIMEOUTS.API_REQUEST,
        useProxy: true, // Utilise proxy Next.js /api/backend
      };

    case 'vite':
      // Vite (backoffice) - Proxy Vite ou URL directe
      const viteApiUrl = (import.meta as any).env?.VITE_API_URL || '';
      return {
        baseURL: viteApiUrl, // '' = proxy Vite, ou URL complète
        database: (import.meta as any).env?.VITE_BACKEND_DATABASE || 'quelyos',
        timeout: TIMEOUTS.API_REQUEST,
        useProxy: false, // Appels JSON-RPC directs
      };

    case 'client':
    default:
      // Client Next.js - Utiliser le proxy relatif
      return {
        baseURL: '/api/backend',
        database: 'quelyos',
        timeout: TIMEOUTS.API_REQUEST,
        useProxy: true,
      };
  }
}

/**
 * @deprecated Utiliser getBackendConfig() à la place (anonymisation)
 */
export const getOdooConfig = getBackendConfig;

/**
 * @deprecated Utiliser BackendConfig à la place (anonymisation)
 */
export type OdooConfig = BackendConfig;

/**
 * Récupère le session_id depuis localStorage (si disponible)
 */
export function getSessionId(): string | null {
  if (isServer()) return null;

  const sessionId = localStorage.getItem('session_id');
  if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
    return null;
  }

  return sessionId;
}

/**
 * Stocke le session_id dans localStorage
 */
export function setSessionId(sessionId: string | null): void {
  if (isServer()) return;

  if (sessionId) {
    localStorage.setItem('session_id', sessionId);
  } else {
    localStorage.removeItem('session_id');
  }
}

/**
 * Nettoie la session (logout)
 * Utilise STORAGE_KEYS de @quelyos/config pour cohérence
 */
export function clearSession(): void {
  if (isServer()) return;

  localStorage.removeItem('session_id');
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}
