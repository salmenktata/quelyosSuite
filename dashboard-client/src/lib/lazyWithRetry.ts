import { lazy, type ComponentType } from 'react'

const RELOAD_KEY = 'chunk-reload-timestamp'
const RELOAD_COOLDOWN = 30_000 // 30s anti-boucle

function isChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('dynamically imported module')
  )
}

/**
 * Wrapper autour de React.lazy qui gère les erreurs de chunks périmés
 * après un redéploiement en forçant un reload unique de la page.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (error) {
      if (!isChunkError(error)) throw error

      const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || '0')
      const now = Date.now()

      // Un seul reload par cooldown pour éviter la boucle infinie
      if (now - lastReload > RELOAD_COOLDOWN) {
        sessionStorage.setItem(RELOAD_KEY, String(now))
        window.location.reload()
      }

      // Si on a déjà reload récemment, propager l'erreur
      // pour que l'ErrorBoundary affiche un message utile
      throw error
    }
  })
}

export { isChunkError }
