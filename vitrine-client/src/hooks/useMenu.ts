import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface MenuItem {
  id: number
  label: string
  url: string
  icon?: string
  description?: string
  open_new_tab: boolean
  css_class?: string
  children: MenuItem[]
}

export function useMenu(menuCode: string) {
  const [menu, setMenu] = useState<MenuItem[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/menus/${menuCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.menu) {
          setMenu(data.menu.items || [])
        }
      })
      .catch((err) => logger.error(`Failed to load menu ${menuCode}:`, err))
      .finally(() => setLoading(false))
  }, [menuCode])

  return { menu, loading }
}
