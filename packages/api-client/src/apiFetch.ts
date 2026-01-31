/**
 * Helper pour migration fetch() → ApiClient
 *
 * Wrapper simple qui garantit headers X-Tenant-Domain + authentification
 * pour tous les fetch() vers APIs internes.
 *
 * Usage:
 *   // Avant:
 *   const res = await fetch('/api/admin/products', { method: 'POST', ... })
 *
 *   // Après:
 *   const res = await apiFetch('/api/admin/products', { method: 'POST', ... })
 */

import { tokenService } from '@quelyos/auth';

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipTenantHeader?: boolean;
}

/**
 * Wrapper fetch() avec headers automatiques (X-Tenant-Domain, Authorization)
 *
 * @param url - URL de l'API (relative ou absolue)
 * @param options - Options fetch + skipAuth/skipTenantHeader
 * @returns Promise<Response>
 */
export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuth = false, skipTenantHeader = false, ...fetchOptions } = options;

  // Construire headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // CRITIQUE SÉCURITÉ : Injecter X-Tenant-Domain pour isolation multi-tenant
  if (!skipTenantHeader) {
    const tenantDomain = window.location.hostname;
    if (tenantDomain) {
      (headers as Record<string, string>)['X-Tenant-Domain'] = tenantDomain;
    }
  }

  // Ajouter token JWT Bearer si disponible
  if (!skipAuth) {
    const accessToken = tokenService.getAccessToken();
    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Fallback session_id
      const sessionId = localStorage.getItem('session_id');
      if (sessionId && sessionId !== 'null') {
        (headers as Record<string, string>)['X-Session-Id'] = sessionId;
      }
    }
  }

  // Exécuter fetch avec headers
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Pour cookies HttpOnly
  });

  // Gestion erreur 401 (session expirée)
  if (response.status === 401 && typeof window !== "undefined") {
    tokenService.clear();
    window.location.href = '/login';
    throw new Error('Session expirée');
  }

  return response;
}

/**
 * Helper pour fetch() + parsing JSON automatique
 */
export async function apiFetchJson<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Raccourcis méthodes HTTP
 */
export const apiGet = <T = unknown>(url: string, options?: ApiFetchOptions) =>
  apiFetchJson<T>(url, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(url: string, body?: unknown, options?: ApiFetchOptions) =>
  apiFetchJson<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) });

export const apiPut = <T = unknown>(url: string, body?: unknown, options?: ApiFetchOptions) =>
  apiFetchJson<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) });

export const apiDelete = <T = unknown>(url: string, options?: ApiFetchOptions) =>
  apiFetchJson<T>(url, { ...options, method: 'DELETE' });
