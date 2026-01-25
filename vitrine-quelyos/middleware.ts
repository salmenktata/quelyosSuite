import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware pour proxy Finance et Marketing
 * Redirige les routes protégées vers les apps dédiées
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes à proxifier vers Finance (auth, dashboard, API)
  // NOTE: /finance/login et /finance/register sont servis localement
  const financeProxyRoutes = [
    '/finance/dashboard',
    '/finance/auth/',
    '/finance/api/',
  ];

  // Routes à proxifier vers Marketing (auth, dashboard, API)
  // NOTE: /marketing/login et /marketing/register sont servis localement
  const marketingProxyRoutes = [
    '/marketing/dashboard',
    '/marketing/auth/',
    '/marketing/api/',
  ];

  const shouldProxyFinance = financeProxyRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  const shouldProxyMarketing = marketingProxyRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  // Redirect to Finance
  if (shouldProxyFinance) {
    const financeUrl = process.env.NEXT_PUBLIC_FINANCE_APP_URL || 'http://localhost:3007';

    // Construire l'URL cible en remplaçant /finance par la racine Finance
    const targetPath = pathname.replace('/finance', '');

    const targetUrl = `${financeUrl}${targetPath}${request.nextUrl.search}`;

    // Redirect instead of proxying to avoid hydration issues
    return NextResponse.redirect(new URL(targetUrl));
  }

  // Redirect to Marketing
  if (shouldProxyMarketing) {
    const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_APP_URL || 'http://localhost:3002';

    // Construire l'URL cible en remplaçant /marketing par la racine Marketing
    // Construire l'URL cible en remplaçant /marketing par la racine Marketing
    const targetPath = pathname.replace('/marketing', '');

    const targetUrl = `${marketingUrl}${targetPath}${request.nextUrl.search}`;

    // Redirect instead of proxying to avoid hydration issues
    return NextResponse.redirect(new URL(targetUrl));
  }

  // Laisser passer les autres requêtes
  return NextResponse.next();
}

// Configurer le matcher pour les routes Finance et Marketing
export const config = {
  matcher: [
    // Finance (login/register servis localement)
    '/finance/dashboard/:path*',
    '/finance/auth/:path*',
    '/finance/api/:path*',
    // Marketing (login/register servis localement)
    '/marketing/dashboard/:path*',
    '/marketing/auth/:path*',
    '/marketing/api/:path*',
  ],
};
