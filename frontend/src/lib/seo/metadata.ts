/**
 * SEO Metadata Utilities for Next.js 14
 * Integrates with Odoo backend SEO metadata
 */

import { Metadata } from 'next';
import { odooClient } from '@/lib/odoo/client';
import { logger } from '@/lib/logger';

export interface SeoData {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  robots: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  twitter_card: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  structured_data: any;
}

/**
 * Get SEO metadata for a product
 */
export async function getProductSeoMetadata(productId: number): Promise<Metadata> {
  try {
    const response = await odooClient.getProductSeoMetadata(productId);

    if (!response.success || !response.data) {
      return getDefaultMetadata();
    }

    const seo: SeoData = response.data;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quelyos.com';

    return {
      title: seo.meta_title,
      description: seo.meta_description,
      keywords: seo.meta_keywords?.split(',').map((k) => k.trim()),
      alternates: {
        canonical: `${baseUrl}${seo.canonical_url}`,
      },
      robots: {
        index: seo.robots.includes('index'),
        follow: seo.robots.includes('follow'),
      },
      openGraph: {
        title: seo.og_title,
        description: seo.og_description,
        images: [
          {
            url: seo.og_image.startsWith('http')
              ? seo.og_image
              : `${process.env.NEXT_PUBLIC_ODOO_URL || ''}${seo.og_image}`,
            alt: seo.og_title,
          },
        ],
        type: seo.og_type as any,
        url: `${baseUrl}${seo.canonical_url}`,
        siteName: 'Quelyos',
      },
      twitter: {
        card: seo.twitter_card as any,
        title: seo.twitter_title,
        description: seo.twitter_description,
        images: [
          seo.twitter_image.startsWith('http')
            ? seo.twitter_image
            : `${process.env.NEXT_PUBLIC_ODOO_URL || ''}${seo.twitter_image}`,
        ],
      },
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération des métadonnées SEO:', error);
    return getDefaultMetadata();
  }
}

/**
 * Get structured data script for product
 */
export async function getProductStructuredData(productId: number): Promise<string | null> {
  try {
    const response = await odooClient.getProductSeoMetadata(productId);

    if (!response.success || !response.data?.structured_data) {
      return null;
    }

    return JSON.stringify(response.data.structured_data);
  } catch (error) {
    logger.error('Erreur lors de la récupération des données structurées:', error);
    return null;
  }
}

/**
 * Get breadcrumb structured data for product
 */
export async function getBreadcrumbStructuredData(productId: number): Promise<string | null> {
  try {
    const response = await odooClient.getBreadcrumbsData(productId);

    if (!response.success || !response.data?.structured_data) {
      return null;
    }

    return JSON.stringify(response.data.structured_data);
  } catch (error) {
    logger.error('Erreur lors de la récupération du fil d\'Ariane:', error);
    return null;
  }
}

/**
 * Get organization structured data for homepage
 */
export async function getOrganizationStructuredData(): Promise<string | null> {
  try {
    const response = await odooClient.getOrganizationSeoData();

    if (!response.success || !response.data?.structured_data) {
      return null;
    }

    return JSON.stringify(response.data.structured_data);
  } catch (error) {
    logger.error('Erreur lors de la récupération des données de l\'organisation:', error);
    return null;
  }
}

/**
 * Default metadata fallback
 */
export function getDefaultMetadata(): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quelyos.com';

  return {
    title: {
      default: 'Quelyos - E-commerce',
      template: '%s | Quelyos',
    },
    description: 'Découvrez notre catalogue de produits',
    keywords: ['e-commerce', 'boutique en ligne', 'quelyos'],
    alternates: {
      canonical: baseUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      siteName: 'Quelyos',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

/**
 * Homepage metadata
 */
export async function getHomepageMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quelyos.com';

  return {
    title: 'Quelyos - Boutique en ligne',
    description: 'Découvrez notre sélection de produits de qualité au meilleur prix',
    keywords: ['e-commerce', 'boutique en ligne', 'quelyos', 'shopping'],
    alternates: {
      canonical: baseUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: 'Quelyos - Boutique en ligne',
      description: 'Découvrez notre sélection de produits de qualité au meilleur prix',
      type: 'website',
      url: baseUrl,
      siteName: 'Quelyos',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Quelyos - Boutique en ligne',
      description: 'Découvrez notre sélection de produits de qualité au meilleur prix',
    },
  };
}
