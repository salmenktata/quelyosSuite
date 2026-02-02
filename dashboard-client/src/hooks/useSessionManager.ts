import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import { logger } from '@quelyos/logger'

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_REFRESH_INTERVAL = 25 * 60 * 1000 // 25 minutes (rafraîchir avant expiration à 30min)
const SESSION_WARNING_TIME = 5 * 60 * 1000 // Avertir 5 minutes avant expiration

interface SessionManagerConfig {
  enableAutoRefresh?: boolean
  enableWarning?: boolean
}

export function useSessionManager(config: SessionManagerConfig = {}) {
  const { enableAutoRefresh = true, enableWarning = true } = config
  const navigate = useNavigate()
  const toast = useToast()
  const checkIntervalRef = useRef<number | undefined>(undefined)
  const refreshIntervalRef = useRef<number | undefined>(undefined)
  const lastActivityRef = useRef<number>(Date.now())
  const warningShownRef = useRef<boolean>(false)

  // TEMPORAIRE DEV : Désactiver la gestion de session en développement
  // car l'authentification est désactivée (voir ProtectedRoute.tsx et TODO_AUTH.md)
  const isDevMode = import.meta.env.DEV

  const checkSession = useCallback(async () => {
    // Ne pas vérifier la session en mode DEV
    if (isDevMode) {
      return true
    }
    try {
      const result = await api.checkSession()

      if (!result.is_authenticated) {
        // Session expirée
        localStorage.removeItem('session_id')
        localStorage.removeItem('user')
        toast.error('Votre session a expiré. Veuillez vous reconnecter.')
        navigate('/login')
        return false
      }

      // Calculer le temps restant
      const sessionStart = lastActivityRef.current
      const elapsed = Date.now() - sessionStart
      const remaining = SESSION_REFRESH_INTERVAL - elapsed

      // Afficher un avertissement si proche de l'expiration
      if (enableWarning && remaining < SESSION_WARNING_TIME && !warningShownRef.current) {
        const minutesLeft = Math.floor(remaining / 60000)
        toast.warning(`Votre session va expirer dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`)
        warningShownRef.current = true
      }

      return true
    } catch (error) {
      logger.error('Session check error:', error)
      return false
    }
  }, [navigate, toast, enableWarning, isDevMode])

  const refreshSession = useCallback(async () => {
    // Ne pas rafraîchir la session en mode DEV
    if (isDevMode) {
      return
    }

    try {
      const result = await api.checkSession()

      if (result.is_authenticated) {
        lastActivityRef.current = Date.now()
        warningShownRef.current = false
        logger.debug('Session refreshed successfully')
      } else {
        // Session expirée
        localStorage.removeItem('session_id')
        localStorage.removeItem('user')
        toast.error('Votre session a expiré. Veuillez vous reconnecter.')
        navigate('/login')
      }
    } catch (error) {
      logger.error('Session refresh error:', error)
    }
  }, [navigate, toast, isDevMode])

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    warningShownRef.current = false
  }, [])

  useEffect(() => {
    // Ne pas démarrer les timers en mode DEV
    if (isDevMode) {
      return
    }

    // Ne démarrer que si une session existe
    const sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      return
    }

    // Vérifier la session périodiquement
    checkIntervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL) as unknown as number

    // Rafraîchir automatiquement la session
    if (enableAutoRefresh) {
      refreshIntervalRef.current = setInterval(refreshSession, SESSION_REFRESH_INTERVAL) as unknown as number
    }

    // Écouter l'activité utilisateur pour réinitialiser le timer
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [checkSession, refreshSession, updateActivity, enableAutoRefresh, isDevMode])

  return {
    checkSession,
    refreshSession,
    updateActivity,
  }
}
