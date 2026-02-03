/**
 * Utilitaires backend centralisés pour Vitrine Client (E-commerce)
 *
 * Utilise @quelyos/config pour éliminer les URLs hardcodées
 */

import { getBackendUrl, getProxiedImageUrl as configGetProxiedImageUrl } from '@quelyos/config';

/**
 * Récupère l'URL backend selon l'environnement
 *
 * - Server-side : URL env ou URL centralisée depuis @quelyos/config
 * - Client-side : Utilise NEXT_PUBLIC_BACKEND_URL pour CORS
 */
export function getBackendApiUrl(): string {
  // Server-side : utiliser URL complète
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl(process.env.NODE_ENV as any);
  }

  // Client-side : utiliser NEXT_PUBLIC_BACKEND_URL (CORS configuré dans le backend)
  return process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl('development');
}

/**
 * Construit une URL complète vers le backend
 *
 * @param path - Chemin API (ex: '/api/ecommerce/products')
 * @returns URL complète backend
 */
export function buildBackendUrl(path: string): string {
  const baseUrl = getBackendApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Si baseUrl est vide (client-side), retourner le path seul (proxy Next.js)
  if (!baseUrl) return cleanPath;

  return `${baseUrl}${cleanPath}`;
}

/**
 * Vérifie si une URL pointe vers le backend
 *
 * @param url - URL à vérifier
 * @returns true si l'URL est une URL backend
 */
export function isBackendUrl(url: string): boolean {
  return (
    url.includes('/web/image') ||
    url.includes('/web/content') ||
    url.includes('/api/ecommerce') ||
    url.includes('localhost:8069') ||
    url.includes('api.quelyos.com')
  );
}

/**
 * Proxifie une URL d'image backend
 *
 * Utilise getProxiedImageUrl de @quelyos/config pour l'anonymisation
 *
 * @param url - URL image backend
 * @returns URL proxifiée
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';

  // Si déjà une URL complète non-backend, retourner telle quelle
  if (url.startsWith('http') && !isBackendUrl(url)) {
    return url;
  }

  // Utiliser la fonction centralisée de @quelyos/config
  return configGetProxiedImageUrl(url);
}

/**
 * Récupère l'URL backend complète pour SSR
 * (pour preconnect, dns-prefetch, etc.)
 */
export function getBackendUrlForPreload(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl(process.env.NODE_ENV as any);
}
