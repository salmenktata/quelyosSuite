import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { logger } from '@/lib/logger'

export interface MarketingPopup {
  id: number
  name: string
  popup_type: string
  title: string
  subtitle?: string
  content?: string
  image_url?: string
  cta_text: string
  cta_link: string
  cta_color: string
  show_close_button: boolean
  close_text: string
  trigger_type: 'immediate' | 'delay' | 'scroll' | 'exit_intent'
  trigger_delay: number
  trigger_scroll_percent: number
  show_once_per_session: boolean
  show_once_per_user: boolean
  cookie_duration_days: number
  position: string
  overlay_opacity: number
  max_width: number
  background_color: string
  text_color: string
}

export function useMarketingPopups() {
  const pathname = usePathname()
  const [popups, setPopups] = useState<MarketingPopup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketing-popups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_path: pathname }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.popups) {
          setPopups(data.popups)
        }
      })
      .catch(err => logger.error('Failed to load popups:', err))
      .finally(() => setLoading(false))
  }, [pathname])

  return { popups, loading }
}

export function trackPopupView(popupId: number) {
  fetch('/api/marketing-popups/track-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ popup_id: popupId }),
  }).catch(err => logger.error('Failed to track popup view:', err))
}

export function trackPopupClick(popupId: number) {
  fetch('/api/marketing-popups/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ popup_id: popupId }),
  }).catch(err => logger.error('Failed to track popup click:', err))
}
