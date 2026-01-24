/**
 * Layout pour les pages produits avec métadonnées SEO dynamiques
 * Ce layout Server Component gère generateMetadata pour Open Graph et Twitter Cards
 */

import { Metadata } from 'next';
import { odooClient } from '@/lib/odoo/client';
import { siteConfig } from '@/lib/config/site';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  // Await params in Next.js 15+
  const { slug } = await params;

  try {
    const response = await odooClient.getProductBySlug(slug);

    if (!response.success || !response.product) {
      return {
        title: 'Produit non trouvé',
        description: 'Le produit que vous recherchez n\'existe pas.',
      };
    }

    const product = response.product;
    const mainImage = product.images?.find(img => img.is_main)?.url || product.images?.[0]?.url || '/placeholder-product.svg';
    const imageUrl = mainImage.startsWith('http') ? mainImage : `${SITE_URL}${mainImage}`;

    const title = `${product.name} - ${siteConfig.brand.name}`;
    const description = product.description || `Découvrez ${product.name} sur ${siteConfig.brand.name}. Livraison rapide et service client de qualité.`;
    const url = `${SITE_URL}/products/${product.slug}`;

    // Prix pour Open Graph
    const price = product.list_price.toString();
    const currency = product.currency?.name || 'TND';

    return {
      title,
      description,
      keywords: [
        product.name,
        product.category?.name || '',
        'acheter',
        'boutique',
        siteConfig.brand.name,
      ].filter(Boolean),
      openGraph: {
        type: 'product',
        title,
        description,
        url,
        siteName: siteConfig.brand.name,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        locale: 'fr_FR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      // Product specific meta tags
      other: {
        'product:price:amount': price,
        'product:price:currency': currency,
        'product:availability': product.in_stock ? 'in stock' : 'out of stock',
        'product:condition': 'new',
      },
    };
  } catch (error) {
    console.error('Error generating product metadata:', error);
    return {
      title: 'Produit - ' + siteConfig.brand.name,
      description: siteConfig.brand.description,
    };
  }
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
