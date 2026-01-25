import { useState, useEffect } from 'react'

export interface PromoBanner {
  id: number
  title: string
  description?: string
  tag?: string
  gradient: string
  tag_color: string
  button_bg: string
  image_url?: string
  cta_text: string
  cta_link: string
}

export function usePromoBanners() {
  const [banners, setBanners] = useState<PromoBanner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/promo-banners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBanners(data.banners)
      })
      .catch((err) => console.error('Failed to load promo banners:', err))
      .finally(() => setLoading(false))
  }, [])

  return { banners, loading }
}
