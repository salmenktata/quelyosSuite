'use client'

import { useEffect } from 'react'
import { useTenantBranding } from '@/lib/tenant/TenantProvider'

/**
 * Applique le favicon dynamique du tenant
 * Les couleurs/polices sont gérées par ThemeProvider
 */
export function FaviconApplier() {
  const branding = useTenantBranding()

  useEffect(() => {
    if (!branding?.faviconUrl) return

    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (link) {
      link.href = branding.faviconUrl
    } else {
      const newLink = document.createElement('link')
      newLink.rel = 'icon'
      newLink.href = branding.faviconUrl
      document.head.appendChild(newLink)
    }
  }, [branding?.faviconUrl])

  return null
}
