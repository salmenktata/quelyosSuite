/**
 * Product Page Metadata (Next.js 14 App Router)
 * Dynamically generates SEO metadata for product pages
 */

import { Metadata } from 'next';
import { getProductSeoMetadata } from '@/lib/seo/metadata';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface Props {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Generate metadata for product page
 * This function is called by Next.js during build and on-demand
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Extract product ID from slug (format: "product-name-123" or just "123")
    const slug = params.slug;
    let productId: number;

    // Try to extract ID from slug
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];

    if (!isNaN(Number(lastPart))) {
      productId = Number(lastPart);
    } else {
      // Fallback: search by slug
      const response = await backendClient.getProductBySlug(slug);

      if (!response.success || !response.product) {
        return {
          title: 'Product Not Found',
          description: 'The product you are looking for does not exist.',
        };
      }

      productId = response.product.id;
    }

    // Fetch SEO metadata from backend
    return await getProductSeoMetadata(productId);
  } catch (_error) {
    logger.error('Error generating product metadata:', error);
    return {
      title: 'Product',
      description: 'View product details',
    };
  }
}

/**
 * Generate static params for static site generation (SSG)
 * Uncomment to enable static generation of product pages
 */
// export async function generateStaticParams() {
//   try {
//     const response = await backendClient.post('/api/ecommerce/products/list', {
//       limit: 100, // Generate first 100 products
//       filters: { website_published: true },
//     });
//
//     if (!response.success || !response.data?.products) {
//       return [];
//     }
//
//     return response.data.products.map((product: any) => ({
//       slug: product.slug || String(product.id),
//     }));
//   } catch (_error) {
//     logger.error('Error generating static params:', error);
//     return [];
//   }
// }
