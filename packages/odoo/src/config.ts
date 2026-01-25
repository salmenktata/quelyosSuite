/**
 * Configuration environnement intelligent
 * Détecte automatiquement SSR (Next.js server), Client (browser), ou Vite
 */

export type Environment = 'server' | 'client' | 'vite';

/**
 * Détecte l'environnement d'exécution actuel
 */
export function detectEnvironment(): Environment {
  // SSR Next.js (typeof window === 'undefined')
  if (typeof window === 'undefined') {
    return 'server';
  }

  // Vite (import.meta.env existe)
  if (typeof (import.meta as any).env !== 'undefined') {
    return 'vite';
  }

  // Client Next.js (browser)
  return 'client';
}

/**
 * Configuration Odoo selon environnement
 */
export interface OdooConfig {
  baseURL: string;
  database: string;
  timeout: number;
  useProxy: boolean;
}

/**
 * Retourne la configuration Odoo appropriée selon l'environnement
 */
export function getOdooConfig(): OdooConfig {
  const env = detectEnvironment();

  switch (env) {
    case 'server':
      // Next.js SSR - Utiliser l'URL complète du site
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3006';
      return {
        baseURL: `${siteUrl}/api/odoo`,
        database: process.env.ODOO_DATABASE || 'quelyos',
        timeout: 30000,
        useProxy: true, // Utilise proxy Next.js /api/odoo
      };

    case 'vite':
      // Vite (backoffice) - Proxy Vite ou URL directe
      const viteApiUrl = (import.meta as any).env?.VITE_API_URL || '';
      return {
        baseURL: viteApiUrl, // '' = proxy Vite, ou URL complète
        database: (import.meta as any).env?.VITE_ODOO_DATABASE || 'quelyos',
        timeout: 30000,
        useProxy: false, // Appels JSON-RPC directs
      };

    case 'client':
    default:
      // Client Next.js - Utiliser le proxy relatif
      return {
        baseURL: '/api/odoo',
        database: 'quelyos',
        timeout: 30000,
        useProxy: true,
      };
  }
}

/**
 * Récupère le session_id depuis localStorage (si disponible)
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;

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
  if (typeof window === 'undefined') return;

  if (sessionId) {
    localStorage.setItem('session_id', sessionId);
  } else {
    localStorage.removeItem('session_id');
  }
}

/**
 * Nettoie la session (logout)
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('session_id');
  localStorage.removeItem('user');
}
