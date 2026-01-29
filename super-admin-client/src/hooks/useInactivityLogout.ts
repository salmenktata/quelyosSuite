/**
 * Hook pour auto-logout après inactivité
 *
 * Détecte l'inactivité utilisateur et déconnecte automatiquement
 * après 30 minutes sans activité.
 */

import { useEffect, useRef, useCallback } from 'react'

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000 // 2 minutes avant logout

interface UseInactivityLogoutOptions {
  /** Timeout en ms avant logout (défaut: 30min) */
  timeout?: number
  /** Afficher warning avant logout (défaut: 2min avant) */
  warningTime?: number
  /** Callback appelé au logout */
  onLogout?: () => void
  /** Callback appelé au warning */
  onWarning?: (remainingTime: number) => void
}

export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const {
    timeout = INACTIVITY_TIMEOUT,
    warningTime = WARNING_BEFORE_LOGOUT,
    onLogout,
    onWarning,
  } = options

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const warningRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastActivityRef = useRef(Date.now())

  /**
   * Déconnecte l'utilisateur via callback
   * Note: Ne gère plus la navigation, c'est le callback qui s'en charge
   */
  const logout = useCallback(() => {
    // Callback custom qui gère logout API + navigation
    onLogout?.()
  }, [onLogout])

  /**
   * Reset le timer d'inactivité
   */
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Clear les timers existants
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    // Warning avant logout
    warningRef.current = setTimeout(() => {
      const remaining = timeout - warningTime
      onWarning?.(remaining)
    }, timeout - warningTime)

    // Logout après timeout
    timeoutRef.current = setTimeout(() => {
      logout()
    }, timeout)
  }, [timeout, warningTime, logout, onWarning])

  /**
   * Détection activité utilisateur
   */
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    // Handler throttled (max 1x par seconde)
    let throttleTimeout: NodeJS.Timeout
    const handleActivity = () => {
      if (throttleTimeout) return

      throttleTimeout = setTimeout(() => {
        resetInactivityTimer()
        throttleTimeout = undefined as any
      }, 1000)
    }

    // Attacher les listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Démarrer le timer initial
    resetInactivityTimer()

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (throttleTimeout) clearTimeout(throttleTimeout)
    }
  }, [resetInactivityTimer])

  /**
   * Détection changement de tab (visibility API)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab cachée → ne pas reset le timer
        return
      }

      // Tab active → vérifier si timeout dépassé
      const elapsed = Date.now() - lastActivityRef.current
      if (elapsed >= timeout) {
        logout()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [timeout, logout])

  return {
    /** Force le reset du timer (utile après action importante) */
    resetTimer: resetInactivityTimer,
    /** Force le logout immédiat */
    forceLogout: logout,
    /** Temps depuis dernière activité (ms) */
    getInactivityDuration: () => Date.now() - lastActivityRef.current,
  }
}
