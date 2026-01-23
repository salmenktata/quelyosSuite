/**
 * Utilitaires SEO
 */

import { Metadata } from 'next';

const SITE_NAME = 'Quelyos';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_DESCRIPTION = 'Découvrez notre sélection de produits de qualité chez Quelyos. Livraison rapide, paiement sécurisé et service client à votre écoute.';

export interface SEOData {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
}

/**
 * Génère les metadata pour une page
 */
export function generateMetadata(data: SEOData): Metadata {
  const {
    title,
    description = SITE_DESCRIPTION,
    keywords,
    image = `${SITE_URL}/og-image.png`,
    url = SITE_URL,
    type = 'website',
    noIndex = false,
  } = data;

  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'fr_FR',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Génère le JSON-LD pour un produit
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock';
  brand?: string;
  sku?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: product.currency,
      price: product.price,
      availability: `https://schema.org/${product.availability}`,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };
}

/**
 * Génère le JSON-LD pour l'organisation
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Service client',
      telephone: '+216-XX-XXX-XXX',
      email: 'contact@quelyos.com',
    },
    sameAs: [
      'https://www.facebook.com/quelyos',
      'https://www.instagram.com/quelyos',
      'https://twitter.com/quelyos',
    ],
  };
}

/**
 * Génère le JSON-LD pour le breadcrumb
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Génère le JSON-LD pour une page web
 */
export function generateWebPageSchema(data: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: data.name,
    description: data.description,
    url: `${SITE_URL}${data.url}`,
  };
}
