import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface SeoMetadata {
  meta_title: string
  meta_description: string
  og_title?: string
  og_description?: string
  og_image_url?: string
  og_type: string
  twitter_card: string
  twitter_title?: string
  twitter_description?: string
  twitter_image_url?: string
  schema_type: string
  noindex: boolean
  nofollow: boolean
  canonical_url?: string
}

export function useSeoMetadata(slug: string) {
  const [metadata, setMetadata] = useState<SeoMetadata | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    fetch(`/api/seo-metadata/${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.metadata) {
          setMetadata(data.metadata)
        }
      })
      .catch(err => logger.error('Failed to load SEO metadata:', err))
      .finally(() => setLoading(false))
  }, [slug])

  return { metadata, loading }
}
