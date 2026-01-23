/**
 * Robots.txt dynamique
 */

import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function GET() {
  const robotsTxt = `# robots.txt pour Quelyos E-commerce

User-agent: *
Allow: /
Disallow: /api/
Disallow: /account/
Disallow: /checkout/
Disallow: /cart
Disallow: /login
Disallow: /register

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay
Crawl-delay: 1
`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
