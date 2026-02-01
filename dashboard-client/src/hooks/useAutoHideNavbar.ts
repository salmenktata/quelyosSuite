import { useState, useEffect, useCallback } from 'react'

export function useAutoHideNavbar() {
  const [isVisible, setIsVisible] = useState(false) // Cachée par défaut

  // Détection position curseur (comme macOS)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Visible UNIQUEMENT si curseur tout en haut (< 5px)
    // Zone très réduite pour éviter conflit avec les tabs
    if (e.clientY < 5) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [])

  useEffect(() => {
    // Throttle mouse move events (max 60fps)
    let mouseMoveTicking = false
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseMoveTicking) {
        window.requestAnimationFrame(() => {
          handleMouseMove(e)
          mouseMoveTicking = false
        })
        mouseMoveTicking = true
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [handleMouseMove])

  return isVisible
}
