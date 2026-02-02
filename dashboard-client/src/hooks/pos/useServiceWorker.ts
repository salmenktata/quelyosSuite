/**
 * Hook pour la gestion du Service Worker POS
 * Enregistrement, communication et état
 */

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isReady: boolean
  registration: ServiceWorkerRegistration | null
  updateAvailable: boolean
  cacheStatus: Record<string, number> | null
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  register: () => Promise<void>
  unregister: () => Promise<void>
  update: () => Promise<void>
  skipWaiting: () => void
  cacheProducts: (products: unknown[]) => void
  clearCache: () => void
  getCacheStatus: () => void
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isReady: false,
    registration: null,
    updateAvailable: false,
    cacheStatus: null,
  })

  // Enregistrer le Service Worker
  const register = useCallback(async () => {
    if (!state.isSupported) {
      logger.warn('[SW Hook] Service Worker not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      logger.debug('[SW Hook] Service Worker registered:', registration.scope)

      setState((prev) => ({
        ...prev,
        isRegistered: true,
        registration,
      }))

      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, updateAvailable: true }))
            }
          })
        }
      })

      // Vérifier si déjà actif
      if (registration.active) {
        setState((prev) => ({ ...prev, isReady: true }))
      }
    } catch (error) {
      logger.error('[SW Hook] Registration failed:', error)
    }
  }, [state.isSupported])

  // Désenregistrer
  const unregister = useCallback(async () => {
    if (state.registration) {
      await state.registration.unregister()
      setState((prev) => ({
        ...prev,
        isRegistered: false,
        isReady: false,
        registration: null,
      }))
    }
  }, [state.registration])

  // Forcer une mise à jour
  const update = useCallback(async () => {
    if (state.registration) {
      await state.registration.update()
    }
  }, [state.registration])

  // Activer le nouveau Service Worker
  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [state.registration])

  // Cacher les produits
  const cacheProducts = useCallback((products: unknown[]) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PRODUCTS',
        payload: products,
      })
    }
  }, [])

  // Vider le cache
  const clearCache = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
      })
    }
  }, [])

  // Obtenir le statut du cache
  const getCacheStatus = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_CACHE_STATUS',
      })
    }
  }, [])

  // Écouter les messages du Service Worker
  useEffect(() => {
    if (!state.isSupported) return

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {}

      switch (type) {
        case 'CACHE_STATUS':
          setState((prev) => ({ ...prev, cacheStatus: payload }))
          break
        case 'SYNC_ORDERS_START':
          // Déclencher la sync des commandes
          window.dispatchEvent(new CustomEvent('pos-sync-orders'))
          break
      }
    }

    const handleControllerChange = () => {
      setState((prev) => ({ ...prev, isReady: true, updateAvailable: false }))
      // Recharger pour utiliser le nouveau SW
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Vérifier si déjà prêt
    if (navigator.serviceWorker.controller) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((prev) => ({ ...prev, isReady: true }))
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [state.isSupported])

  // Enregistrer automatiquement au montage
  useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      register()
    }
  }, [state.isSupported, state.isRegistered, register])

  return {
    ...state,
    register,
    unregister,
    update,
    skipWaiting,
    cacheProducts,
    clearCache,
    getCacheStatus,
  }
}

/**
 * Hook pour demander le Background Sync
 */
export function useBackgroundSync() {
  const requestSync = useCallback(async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag)
        logger.debug('[Background Sync] Registered:', tag)
      } catch (error) {
        logger.error('[Background Sync] Failed to register:', error)
      }
    }
  }, [])

  const syncOrders = useCallback(() => {
    return requestSync('sync-pos-orders')
  }, [requestSync])

  return { requestSync, syncOrders }
}
