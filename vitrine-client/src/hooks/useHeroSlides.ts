import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface HeroSlide {
  id: number
  title: string
  subtitle?: string
  description?: string
  image_url?: string
  cta_text: string
  cta_link: string
  cta_secondary_text?: string
  cta_secondary_link?: string
}

export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hero-slides')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSlides(data.slides)
      })
      .catch((err) => logger.error('Failed to load hero slides:', err))
      .finally(() => setLoading(false))
  }, [])

  return { slides, loading }
}
