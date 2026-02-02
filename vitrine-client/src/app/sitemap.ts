import { MetadataRoute } from 'next'
import { backendClient } from '@/lib/backend/client'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalider toutes les heures

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Pages statiques
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Récupérer tous les produits
    const productsResponse = await backendClient.getProducts({ limit: 1000, offset: 0 })
    const products = productsResponse.success && productsResponse.products
      ? productsResponse.products
      : []

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Récupérer toutes les catégories
    const categoriesResponse = await backendClient.getCategories({ limit: 100 })
    const categories = categoriesResponse.success && categoriesResponse.categories
      ? categoriesResponse.categories
      : []

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/categories/${category.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticRoutes, ...productRoutes, ...categoryRoutes]
  } catch (_error) {
    logger.error('Error generating sitemap:', error)
    // En cas d'erreur, retourner au moins les routes statiques
    return staticRoutes
  }
}
