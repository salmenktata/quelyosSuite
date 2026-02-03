import { MetadataRoute } from 'next'
import { getAppUrl } from '@quelyos/config'

export default function robots(): MetadataRoute.Robots {
  const env = (process.env.NODE_ENV === 'production' ? 'production' : 'development') as 'development' | 'production'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getAppUrl('ecommerce', env)

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/account/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
