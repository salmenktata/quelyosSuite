import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook pour déterminer si une route est active
 * Une route est considérée active si le pathname actuel correspond exactement
 * ou commence par le path donné suivi d'un slash
 */
export function useActiveRoute() {
  const location = useLocation()

  const isActive = useCallback(
    (path: string) => {
      return (
        location.pathname === path ||
        location.pathname.startsWith(path + '/')
      )
    },
    [location.pathname]
  )

  return {
    isActive,
    currentPath: location.pathname
  }
}
