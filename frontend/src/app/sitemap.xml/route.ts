/**
 * Sitemap XML dynamique
 */

import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

function generateSitemapXML(urls: SitemapURL[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export async function GET() {
  try {
    // URLs statiques
    const staticURLs: SitemapURL[] = [
      {
        loc: `${SITE_URL}/`,
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${SITE_URL}/products`,
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        loc: `${SITE_URL}/cart`,
        changefreq: 'weekly',
        priority: 0.7,
      },
      {
        loc: `${SITE_URL}/login`,
        changefreq: 'monthly',
        priority: 0.5,
      },
      {
        loc: `${SITE_URL}/register`,
        changefreq: 'monthly',
        priority: 0.5,
      },
    ];

    // TODO: Récupérer les produits depuis l'API
    // const productsResponse = await fetch(`${ODOO_URL}/api/ecommerce/products?limit=1000`);
    // const { products } = await productsResponse.json();

    // const productURLs: SitemapURL[] = products.map((product: any) => ({
    //   loc: `${SITE_URL}/products/${product.slug}`,
    //   lastmod: product.write_date,
    //   changefreq: 'weekly',
    //   priority: 0.8,
    // }));

    // TODO: Récupérer les catégories depuis l'API
    // const categoriesResponse = await fetch(`${ODOO_URL}/api/ecommerce/categories`);
    // const { categories } = await categoriesResponse.json();

    // const categoryURLs: SitemapURL[] = categories.map((category: any) => ({
    //   loc: `${SITE_URL}/categories/${category.slug}`,
    //   changefreq: 'weekly',
    //   priority: 0.7,
    // }));

    // Combiner toutes les URLs
    const allURLs = [
      ...staticURLs,
      // ...productURLs,
      // ...categoryURLs,
    ];

    const sitemap = generateSitemapXML(allURLs);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
