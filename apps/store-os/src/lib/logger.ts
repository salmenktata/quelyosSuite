const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV

export const logger = {
  error: (...args: unknown[]) => {
    if (isDevelopment) console.error(...args)
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) console.warn(...args)
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) console.info(...args)
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) console.debug('[DEBUG]', ...args)
  },
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isDevelopment) {
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message
    return 'Une erreur est survenue'
  }

  const err = error as Record<string, unknown> | null
  const status = (err?.response as Record<string, unknown>)?.status as number | undefined

  if (status === 404) return 'Ressource non trouvée'
  if (status === 401 || status === 403) return 'Accès non autorisé.'
  if (status && status >= 500) return 'Erreur du serveur.'

  return 'Une erreur est survenue. Veuillez réessayer.'
}

export default logger
