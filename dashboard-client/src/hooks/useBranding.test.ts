import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBranding, useEditionColor, useEditionName } from './useBranding'
import * as editionDetector from '@/lib/editionDetector'

describe('useBranding', () => {
  beforeEach(() => {
    // Mock document.documentElement.style
    document.documentElement.style.setProperty = vi.fn()
    document.documentElement.style.removeProperty = vi.fn()

    // Mock querySelector pour favicon
    const mockFavicon = document.createElement('link')
    mockFavicon.rel = 'icon'
    document.querySelector = vi.fn((selector: string) => {
      if (selector === 'link[rel="icon"]') return mockFavicon
      return null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('devrait retourner la configuration de l\'édition courante', () => {
    vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
      id: 'finance',
      name: 'Quelyos Finance',
      shortName: 'Finance',
      description: 'Gestion financière',
      color: '#059669',
      logo: '/favicon.svg',
      favicon: '/favicon.svg',
      modules: ['finance'],
      port: 3010,
    })

    const { result } = renderHook(() => useBranding())

    expect(result.current.id).toBe('finance')
    expect(result.current.name).toBe('Quelyos Finance')
    expect(result.current.color).toBe('#059669')
    expect(result.current.modules).toEqual(['finance'])
  })

  it('devrait appliquer la couleur primaire en CSS variable', () => {
    vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
      id: 'store',
      name: 'Quelyos Store',
      shortName: 'Store',
      description: 'E-commerce',
      color: '#7C3AED',
      logo: '/favicon.svg',
      favicon: '/favicon.svg',
      modules: ['store', 'marketing'],
      port: 3011,
    })

    renderHook(() => useBranding())

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--color-primary',
      '#7C3AED'
    )
  })

  it('devrait changer le titre de la page', () => {
    vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
      id: 'sales',
      name: 'Quelyos Sales',
      shortName: 'Sales',
      description: 'CRM',
      color: '#2563EB',
      logo: '/favicon.svg',
      favicon: '/favicon.svg',
      modules: ['crm', 'marketing'],
      port: 3013,
    })

    renderHook(() => useBranding())

    expect(document.title).toBe('Quelyos Sales')
  })

  it('devrait nettoyer les effets lors du démontage', () => {
    vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
      id: 'finance',
      name: 'Quelyos Finance',
      shortName: 'Finance',
      description: 'Finance',
      color: '#059669',
      logo: '/favicon.svg',
      favicon: '/favicon.svg',
      modules: ['finance'],
      port: 3010,
    })

    const { unmount } = renderHook(() => useBranding())

    unmount()

    expect(document.documentElement.style.removeProperty).toHaveBeenCalledWith(
      '--color-primary'
    )
  })
})

describe('useEditionColor', () => {
  it('devrait retourner uniquement la couleur de l\'édition', () => {
    vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
      id: 'retail',
      name: 'Quelyos Retail',
      shortName: 'Retail',
      description: 'POS',
      color: '#DC2626',
      logo: '/favicon.svg',
      favicon: '/favicon.svg',
      modules: ['pos', 'store', 'stock'],
      port: 3014,
    })

    const { result } = renderHook(() => useEditionColor())

    expect(result.current).toBe('#DC2626')
  })
})

describe('useEditionName', () => {
  it('devrait retourner uniquement le nom de l\'édition', () => {
    vi.spyOn(editionDetector, 'getCurrentEdition').mockReturnValue({
      id: 'team',
      name: 'Quelyos Team',
      shortName: 'Team',
      description: 'RH',
      color: '#0891B2',
      logo: '/favicon.svg',
      favicon: '/favicon.svg',
      modules: ['hr'],
      port: 3015,
    })

    const { result } = renderHook(() => useEditionName())

    expect(result.current).toBe('Quelyos Team')
  })
})
