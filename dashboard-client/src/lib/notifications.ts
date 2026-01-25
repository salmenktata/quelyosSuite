/**
 * Shim de compatibilité pour les notifications
 * Redirige vers le système de toast existant
 */

type ToastType = 'success' | 'error' | 'warning' | 'info'

// Fonction showToast compatible avec l'ancien système
export function showToast(message: string, type: ToastType = 'info') {
  // Utilise l'event system pour communiquer avec ToastContext
  const event = new CustomEvent('show-toast', {
    detail: { message, type }
  })
  window.dispatchEvent(event)
}

// Alias pour compatibilité
export const toast = {
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error'),
  warning: (message: string) => showToast(message, 'warning'),
  info: (message: string) => showToast(message, 'info'),
}

export default toast
