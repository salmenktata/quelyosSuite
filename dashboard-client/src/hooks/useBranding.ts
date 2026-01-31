import { useEffect, useMemo } from 'react'
import { getCurrentEdition } from '@/lib/editionDetector'
import type { Edition } from '@/config/editions'

/**
 * Hook pour gérer le branding dynamique de l'édition active
 *
 * Applique automatiquement :
 * - Couleur primaire (CSS variable --color-primary)
 * - Favicon dynamique
 * - Titre de page (<title>)
 *
 * @returns Configuration complète de l'édition
 */
export function useBranding(): Edition {
  const edition = useMemo(() => getCurrentEdition(), [])

  useEffect(() => {
    // 1. Couleur primaire (CSS variable pour Tailwind)
    document.documentElement.style.setProperty('--color-primary', edition.color)

    // 2. Favicon dynamique
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon) {
      favicon.href = edition.favicon
    }

    // 3. Titre de page
    document.title = edition.name

    // 4. Meta theme-color (mobile)
    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!themeColor) {
      themeColor = document.createElement('meta')
      themeColor.name = 'theme-color'
      document.head.appendChild(themeColor)
    }
    themeColor.content = edition.color

    return () => {
      // Cleanup : Reset à valeur par défaut si besoin
      document.documentElement.style.removeProperty('--color-primary')
    }
  }, [edition])

  return edition
}

/**
 * Hook léger qui retourne uniquement la couleur de l'édition
 * (sans effets de bord)
 */
export function useEditionColor(): string {
  const edition = useMemo(() => getCurrentEdition(), [])
  return edition.color
}

/**
 * Hook léger qui retourne uniquement le nom de l'édition
 * (sans effets de bord)
 */
export function useEditionName(): string {
  const edition = useMemo(() => getCurrentEdition(), [])
  return edition.name
}
