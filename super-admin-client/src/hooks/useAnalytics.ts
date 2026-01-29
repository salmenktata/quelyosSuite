/**
 * Hook pour analytics avec Posthog
 *
 * Tracker les événements utilisateur pour améliorer l'expérience
 * et monitorer l'usage de la plateforme super admin
 */

import { useEffect } from 'react'
import posthog from 'posthog-js'

// Configuration Posthog
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'
const ENABLED = !!POSTHOG_KEY && import.meta.env.VITE_ENV !== 'development'

// Initialiser Posthog une seule fois
let initialized = false

function initializePosthog() {
  if (initialized || !ENABLED) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    loaded: (ph) => {
      if (import.meta.env.VITE_ENV === 'development') {
        ph.opt_out_capturing() // Désactiver en dev même si key fournie
      }
    },
    autocapture: false, // Désactiver autocapture pour contrôle manuel
    capture_pageview: false, // Géré manuellement via trackPageView
    disable_session_recording: true, // Pas de recording pour super admin (RGPD)
  })

  initialized = true
}

/**
 * Hook pour utiliser Posthog analytics
 */
export function useAnalytics() {
  useEffect(() => {
    initializePosthog()
  }, [])

  /**
   * Identifier l'utilisateur connecté
   */
  const identifyUser = (userId: number, properties?: Record<string, unknown>) => {
    if (!ENABLED) return
    posthog.identify(String(userId), properties)
  }

  /**
   * Reset l'identification (logout)
   */
  const resetUser = () => {
    if (!ENABLED) return
    posthog.reset()
  }

  /**
   * Tracker une page view
   */
  const trackPageView = (pageName: string, properties?: Record<string, unknown>) => {
    if (!ENABLED) return
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
      ...properties,
    })
  }

  /**
   * Tracker un événement custom
   */
  const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
    if (!ENABLED) return
    posthog.capture(eventName, properties)
  }

  /**
   * Tracker une action super admin
   */
  const trackAdminAction = (action: string, targetType: string, targetId?: number | string) => {
    if (!ENABLED) return
    posthog.capture('admin_action', {
      action, // 'create', 'update', 'delete', 'suspend', 'activate', etc.
      target_type: targetType, // 'tenant', 'subscription', 'user', etc.
      target_id: targetId,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Tracker une erreur
   */
  const trackError = (error: Error, context?: Record<string, unknown>) => {
    if (!ENABLED) return
    posthog.capture('error', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      ...context,
    })
  }

  return {
    identifyUser,
    resetUser,
    trackPageView,
    trackEvent,
    trackAdminAction,
    trackError,
    isEnabled: ENABLED,
  }
}
