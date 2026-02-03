/**
 * Configuration API Backend (Odoo 19)
 *
 * ⚠️ ANONYMISATION ODOO : Ce fichier ne mentionne jamais "Odoo" (conformité /no-odoo)
 * Voir CLAUDE.md section "🔒 ANONYMISATION ODOO - PRIORITÉ MAXIMALE"
 */

import { PORTS } from './ports';
import { type RuntimeEnvironment } from './env';

/**
 * Configuration Backend API
 */
export interface BackendApiConfig {
  /** URL développement local */
  dev: string;
  /** URL staging (pré-production) */
  staging?: string;
  /** URL production */
  prod: string;
}

/**
 * URLs Backend API selon environnement
 */
export const API = {
  backend: {
    dev: `http://localhost:${PORTS.backend}`,
    prod: 'https://api.quelyos.com',
  },
} as const;

/**
 * Récupère l'URL Backend API selon l'environnement
 *
 * @param env - Environnement ('development' | 'staging' | 'production')
 * @returns URL complète du backend
 */
export function getBackendUrl(env: RuntimeEnvironment = 'development'): string {
  if (env === 'production') {
    return API.backend.prod;
  }

  // Staging utilise la même URL que dev pour l'instant
  return API.backend.dev;
}

/**
 * Configuration Vite Proxy pour le développement
 *
 * Masque l'URL backend réelle (anonymisation) et évite CORS.
 *
 * Utilisation dans `vite.config.ts` :
 * ```typescript
 * import { getViteProxyConfig } from '@quelyos/config';
 *
 * export default defineConfig({
 *   server: {
 *     proxy: getViteProxyConfig()
 *   }
 * });
 * ```
 *
 * @returns Configuration proxy Vite
 */
export function getViteProxyConfig(): Record<string, any> {
  return {
    '/api': {
      target: API.backend.dev,
      changeOrigin: true,
      rewrite: (path: string) => path,
      secure: false,
      ws: true,
    },
    // Proxy pour images backend (anonymisation /web/image)
    '/web/image': {
      target: API.backend.dev,
      changeOrigin: true,
      secure: false,
    },
    '/web/content': {
      target: API.backend.dev,
      changeOrigin: true,
      secure: false,
    },
  };
}

/**
 * Configuration Next.js Rewrites pour le développement
 *
 * Masque l'URL backend réelle dans Next.js (anonymisation).
 *
 * Utilisation dans `next.config.ts` :
 * ```typescript
 * import { getNextRewriteConfig } from '@quelyos/config';
 *
 * export default {
 *   async rewrites() {
 *     return getNextRewriteConfig();
 *   }
 * };
 * ```
 *
 * @returns Configuration rewrites Next.js
 */
export function getNextRewriteConfig(): Array<{
  source: string;
  destination: string;
}> {
  const backendUrl = API.backend.dev;

  return [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
    {
      source: '/web/image/:path*',
      destination: `${backendUrl}/web/image/:path*`,
    },
    {
      source: '/web/content/:path*',
      destination: `${backendUrl}/web/content/:path*`,
    },
  ];
}

/**
 * Construit une URL d'image backend (anonymisation)
 *
 * Transforme une URL backend directe en URL proxifiée (masque le backend).
 *
 * @param imageUrl - URL image backend (/web/image/... ou URL complète)
 * @param baseUrl - URL base de l'app frontend (auto-détecté si non fourni)
 * @returns URL proxifiée
 *
 * @example
 * ```typescript
 * // Backend direct (à éviter) :
 * // http://localhost:8069/web/image/product.template/123/image_1920
 *
 * // Proxifié (TOUJOURS utiliser) :
 * const url = getProxiedImageUrl('/web/image/product.template/123/image_1920');
 * // → http://localhost:3001/web/image/product.template/123/image_1920
 * ```
 */
export function getProxiedImageUrl(imageUrl: string, baseUrl?: string): string {
  if (!imageUrl) return '';

  // Si l'URL est déjà absolue avec un domaine frontend, retourner telle quelle
  if (
    imageUrl.startsWith('http://localhost:3') ||
    imageUrl.startsWith('http://localhost:5') ||
    imageUrl.startsWith('http://localhost:9') ||
    imageUrl.includes('quelyos.com')
  ) {
    return imageUrl;
  }

  // Si l'URL contient le backend, extraire le path
  if (imageUrl.includes(API.backend.dev) || imageUrl.includes(API.backend.prod)) {
    const url = new URL(imageUrl);
    imageUrl = url.pathname;
  }

  // Construire URL proxifiée
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${base}${cleanPath}`;
}

/**
 * Construit une URL API complète
 *
 * @param endpoint - Endpoint API (ex: '/products' ou 'products')
 * @param env - Environnement (auto-détecté si non fourni)
 * @returns URL API complète
 *
 * @example
 * ```typescript
 * const url = buildApiUrl('/products');
 * // Dev : http://localhost:8069/api/products
 * // Prod : https://api.quelyos.com/api/products
 * ```
 */
export function buildApiUrl(endpoint: string, env?: RuntimeEnvironment): string {
  const baseUrl = getBackendUrl(env);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Si l'endpoint commence par /api, ne pas le doubler
  if (cleanEndpoint.startsWith('/api')) {
    return `${baseUrl}${cleanEndpoint}`;
  }

  return `${baseUrl}/api${cleanEndpoint}`;
}
