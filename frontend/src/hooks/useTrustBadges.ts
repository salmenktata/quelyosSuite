import { useState, useEffect } from 'react'

export interface TrustBadge {
  id: number
  title: string
  subtitle?: string
  icon: 'creditcard' | 'delivery' | 'shield' | 'support'
}

export function useTrustBadges() {
  const [badges, setBadges] = useState<TrustBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trust-badges')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBadges(data.badges)
      })
      .catch((err) => console.error('Failed to load trust badges:', err))
      .finally(() => setLoading(false))
  }, [])

  return { badges, loading }
}
