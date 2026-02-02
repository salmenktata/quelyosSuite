import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenService } from '../lib/tokenService'
import { api } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import { logger } from '@quelyos/logger'

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_WARNING_THRESHOLD = 3 * 60 * 1000 // Avertir 3 min avant expiration

interface SessionManagerConfig {
  enableWarning?: boolean
}

/**
 * Gestion de session unifiée basée sur tokenService (JWT).
 * - Vérifie périodiquement la validité du token côté serveur
 * - Affiche un warning avant expiration
 * - Écoute les événements tokenService (expired, refreshed)
 * - Le refresh automatique est géré par tokenService.scheduleRefresh()
 * - La fonction de refresh est configurée par useAuth (compat/auth.ts)
 */
export function useSessionManager(config: SessionManagerConfig = {}) {
  const { enableWarning = true } = config
  const navigate = useNavigate()
  const toast = useToast()
  const checkIntervalRef = useRef<number | undefined>(undefined)
  const warningShownRef = useRef<boolean>(false)

  const handleLogout = useCallback(() => {
    toast.error('Votre session a expiré. Veuillez vous reconnecter.')
    navigate('/login', { replace: true })
  }, [navigate, toast])

  const checkSession = useCallback(async () => {
    if (!tokenService.isAuthenticated()) {
      handleLogout()
      return false
    }

    try {
      const result = await api.checkSession()

      if (!result.is_authenticated) {
        tokenService.clear()
        handleLogout()
        return false
      }

      // Warning si proche de l'expiration
      if (enableWarning && !warningShownRef.current) {
        const remaining = tokenService.getTimeRemaining() * 1000
        if (remaining > 0 && remaining < SESSION_WARNING_THRESHOLD) {
          const minutesLeft = Math.ceil(remaining / 60000)
          toast.warning(`Votre session expire dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`)
          warningShownRef.current = true
        }
      }

      return true
    } catch (error) {
      logger.error('[SessionManager] Check session error:', error)
      return false
    }
  }, [handleLogout, enableWarning, toast])

  useEffect(() => {
    if (!tokenService.isAuthenticated()) {
      return
    }

    const unsubscribe = tokenService.subscribe((event) => {
      if (event === 'expired') {
        handleLogout()
      } else if (event === 'refreshed') {
        warningShownRef.current = false
      }
    })

    checkIntervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL) as unknown as number

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      unsubscribe()
    }
  }, [checkSession, handleLogout])

  return {
    checkSession,
  }
}
