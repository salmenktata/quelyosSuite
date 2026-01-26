/**
 * Middleware Next.js pour la détection du tenant par domaine.
 *
 * Ce middleware intercepte toutes les requêtes et:
 * 1. Détecte le domaine de la requête
 * 2. Recherche le tenant correspondant via l'API backend
 * 3. Injecte le code du tenant dans un cookie
 *
 * Le TenantProvider côté client utilise ce cookie pour charger la config.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

// Cache en mémoire pour éviter des appels API répétés
// Note: Ce cache est par instance de serveur, pas partagé en serverless
const tenantCache = new Map<string, { code: string; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 secondes

/**
 * Recherche un tenant par son domaine via l'API backend
 */
async function lookupTenant(
  domain: string
): Promise<{ code: string } | null> {
  // Vérifier le cache
  const cached = tenantCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { code: cached.code };
  }

  try {
    const odooUrl = process.env.BACKEND_URL || 'http://localhost:8069';
    const response = await fetch(
      `${odooUrl}/api/ecommerce/tenant/by-domain?domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Cache Next.js pour ISR
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success && data.tenant?.code) {
      // Mettre en cache
      tenantCache.set(domain, {
        code: data.tenant.code,
        timestamp: Date.now(),
      });
      return { code: data.tenant.code };
    }
  } catch (error) {
    // En cas d'erreur réseau, continuer sans tenant
    logger.error('[Middleware] Tenant lookup error:', error);
  }

  return null;
}

/**
 * Extrait le domaine propre depuis le hostname
 */
function extractDomain(hostname: string): string {
  // Retirer le port si présent
  let domain = hostname.split(':')[0];

  // Retirer www. si présent
  if (domain.startsWith('www.')) {
    domain = domain.slice(4);
  }

  return domain.toLowerCase();
}

/**
 * Vérifie si le hostname est un domaine de développement
 */
function isDevDomain(hostname: string): boolean {
  const devPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '.local',
    '.test',
    '.dev',
  ];

  return devPatterns.some((pattern) => hostname.includes(pattern));
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost:3000';
  const domain = extractDomain(hostname);

  // 🚀 MODE DEV : Support query param ?tenant=code
  const tenantParam = request.nextUrl.searchParams.get('tenant');
  if (tenantParam && isDevDomain(hostname)) {
    const response = NextResponse.next();
    response.cookies.set('tenant_code', tenantParam, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });
    response.headers.set('x-tenant-code', tenantParam);
    return response;
  }

  // En développement, utiliser le tenant par défaut ou celui configuré
  if (isDevDomain(hostname)) {
    // Vérifier si un tenant de dev est configuré
    const devTenantCode = process.env.DEV_TENANT_CODE;

    if (devTenantCode) {
      const response = NextResponse.next();
      response.cookies.set('tenant_code', devTenantCode, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600,
        path: '/',
      });
      response.headers.set('x-tenant-code', devTenantCode);
      return response;
    }

    // Pas de tenant en dev, continuer normalement
    return NextResponse.next();
  }

  // Rechercher le tenant par domaine
  const tenant = await lookupTenant(domain);

  if (!tenant) {
    // Tenant non trouvé
    // Option 1: Rediriger vers une page 404 tenant
    // Option 2: Continuer avec le thème par défaut

    // Pour l'instant, on continue avec le thème par défaut
    // En production, vous voudrez peut-être afficher une page d'erreur
    const response = NextResponse.next();
    response.cookies.delete('tenant_code');
    return response;
  }

  // Tenant trouvé, injecter le code dans les cookies et headers
  const response = NextResponse.next();

  // Cookie accessible côté client pour TenantProvider
  response.cookies.set('tenant_code', tenant.code, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 heure
    path: '/',
  });

  // Header pour le SSR (accessible dans les composants serveur)
  response.headers.set('x-tenant-code', tenant.code);

  return response;
}

/**
 * Configuration du matcher pour le middleware.
 * Exclut les routes statiques et API internes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes internes Next.js)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - robots.txt (robots)
     * - sitemap.xml (sitemap)
     * - public files (avec extension)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
