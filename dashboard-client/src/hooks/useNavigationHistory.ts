import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

interface NavigationHistoryReturn {
  recentPages: string[]
  favorites: string[]
  addToHistory: (path: string) => void
  toggleFavorite: (path: string) => void
  isFavorite: (path: string) => boolean
}

/**
 * Hook pour gérer l'historique de navigation et les favoris
 * @returns État de l'historique et fonctions de gestion
 */
export function useNavigationHistory(): NavigationHistoryReturn {
  const location = useLocation()

  const [recentPages, setRecentPages] = useState<string[]>(() => {
    const stored = localStorage.getItem('recent_pages')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  })

  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem('favorite_pages')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  })

  const addToHistory = useCallback((path: string) => {
    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p !== path)
      const updated = [path, ...filtered].slice(0, 5) // Max 5 pages
      localStorage.setItem('recent_pages', JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleFavorite = useCallback((path: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      localStorage.setItem('favorite_pages', JSON.stringify(updated))
      return updated
    })
  }, [])

  const isFavorite = useCallback(
    (path: string) => {
      return favorites.includes(path)
    },
    [favorites]
  )

  // Track navigation automatiquement
  useEffect(() => {
    const path = location.pathname
    // Ignorer certaines routes
    if (path && path !== '/' && path !== '/login') {
      addToHistory(path)
    }
  }, [location.pathname, addToHistory])

  return {
    recentPages,
    favorites,
    addToHistory,
    toggleFavorite,
    isFavorite
  }
}
