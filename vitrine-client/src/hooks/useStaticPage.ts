import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface StaticPage {
  id: number
  title: string
  subtitle?: string
  content: string
  layout: string
  show_sidebar: boolean
  sidebar_content?: string
  header_image_url?: string
  show_header_image: boolean
  meta_title: string
  meta_description?: string
  published_date?: string
  updated_date?: string
}

export function useStaticPage(slug: string) {
  const [page, setPage] = useState<StaticPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    fetch(`/api/static-pages/${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.page) {
          setPage(data.page)
        } else {
          setError(data.error || 'Page non trouvée')
        }
      })
      .catch(err => {
        logger.error('Failed to load static page:', err)
        setError('Erreur de chargement')
      })
      .finally(() => setLoading(false))
  }, [slug])

  return { page, loading, error }
}
