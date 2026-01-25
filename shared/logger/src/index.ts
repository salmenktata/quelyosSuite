/**
 * Logger sécurisé partagé entre Frontend et Backoffice
 * Masque les détails techniques en production
 *
 * Compatible Next.js (SSR + Client) et Vite
 */

// Détection d'environnement universelle (Next.js + Vite)
const isDevelopment =
  typeof process !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

/**
 * Logger avec masquage automatique en production
 */
export const logger = {
  /**
   * Log d'erreur - détails complets en dev, silencieux en prod
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // En production, envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(args[0]);
  },

  /**
   * Log d'avertissement - détails complets en dev, silencieux en prod
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log d'information - toujours visible (utilisé pour messages non-sensibles)
   */
  info: (...args: any[]) => {
    console.info(...args);
  },

  /**
   * Log de debug - uniquement en développement
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
};

/**
 * Formatte un message d'erreur pour l'utilisateur final
 * Retourne un message générique sans détails techniques en production
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (isDevelopment) {
    // En développement, afficher le vrai message
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return error?.response?.data?.error || error?.message || 'Une erreur est survenue';
  }

  // En production, messages génériques basés sur le type d'erreur
  if (error?.response?.status === 404) {
    return 'Ressource non trouvée';
  }
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return 'Accès non autorisé. Veuillez vous reconnecter.';
  }
  if (error?.response?.status >= 500) {
    return 'Erreur du serveur. Veuillez réessayer ultérieurement.';
  }

  // Détection par message d'erreur
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('network') || message.includes('fetch')) {
    return 'Erreur de connexion au serveur';
  }
  if (message.includes('timeout')) {
    return "Délai d'attente dépassé";
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
}
