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
    const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:8069';

    // URLs statiques
    const staticURLs: SitemapURL[] = [
      {
        loc: `${SITE_URL}/`,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        loc: `${SITE_URL}/products`,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        loc: `${SITE_URL}/about`,
        changefreq: 'monthly',
        priority: 0.5,
      },
      {
        loc: `${SITE_URL}/contact`,
        changefreq: 'monthly',
        priority: 0.5,
      },
    ];

    let productURLs: SitemapURL[] = [];
    let categoryURLs: SitemapURL[] = [];

    // Récupérer les produits depuis l'API
    try {
      const productsResponse = await fetch(`${ODOO_URL}/api/ecommerce/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: { limit: 1000, filters: { website_published: true } } }),
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();

        // JSON-RPC retourne les données dans result
        const result = productsData.result || productsData;
        if (result.success && result.products) {
          productURLs = result.products.map((product: any) => ({
            loc: `${SITE_URL}/products/${product.slug || product.id}`,
            lastmod: product.write_date ? new Date(product.write_date).toISOString().split('T')[0] : undefined,
            changefreq: 'weekly' as const,
            priority: 0.8,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching products for sitemap:', error);
    }

    // Récupérer les catégories depuis l'API (si disponible)
    // Note: Désactivé temporairement car product.public.category nécessite website_sale
    // try {
    //   const categoriesResponse = await fetch(`${ODOO_URL}/api/ecommerce/categories`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({}),
    //     next: { revalidate: 3600 },
    //   });

    //   if (categoriesResponse.ok) {
    //     const categoriesData = await categoriesResponse.json();

    //     if (categoriesData.success && categoriesData.data?.categories) {
    //       categoryURLs = categoriesData.data.categories.map((category: any) => ({
    //         loc: `${SITE_URL}/category/${category.slug || category.id}`,
    //         changefreq: 'weekly' as const,
    //         priority: 0.7,
    //       }));
    //     }
    //   }
    // } catch (error) {
    //   console.error('Error fetching categories for sitemap:', error);
    // }

    // Combiner toutes les URLs
    const allURLs = [
      ...staticURLs,
      ...productURLs,
      ...categoryURLs,
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
