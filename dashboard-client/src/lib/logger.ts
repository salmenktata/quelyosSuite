/**
 * Logger sécurisé pour Dashboard Client
 * Masque les détails techniques en production
 * Intégré avec le système de health check
 */

import { logError as healthLogError, logWarning as healthLogWarning } from './health';

const isDevelopment = import.meta.env.DEV;

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

    // Logger dans le health check
    const errorMsg = args
      .map((arg) => (typeof arg === 'string' ? arg : arg?.message || JSON.stringify(arg)))
      .join(' ');

    healthLogError(errorMsg);
  },

  /**
   * Log d'avertissement - détails complets en dev, silencieux en prod
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }

    // Logger dans le health check
    const warnMsg = args
      .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
      .join(' ');

    healthLogWarning(warnMsg);
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
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isDevelopment) {
    // En développement, afficher le vrai message
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;

    // Type narrowing pour accès propriétés
    if (error && typeof error === 'object') {
      const err = error as Record<string, any>;
      return err.response?.data?.error || err.message || 'Une erreur est survenue';
    }
    return 'Une erreur est survenue';
  }

  // En production, messages génériques basés sur le type d'erreur
  if (error && typeof error === 'object') {
    const err = error as Record<string, any>;

    if (err.response?.status === 404) {
      return 'Ressource non trouvée';
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      return 'Accès non autorisé. Veuillez vous reconnecter.';
    }
    if (err.response?.status >= 500) {
      return 'Erreur du serveur. Veuillez réessayer ultérieurement.';
    }

    // Détection par message d'erreur
    const message = err.message?.toLowerCase?.() || '';
    if (message.includes('network') || message.includes('fetch')) {
      return 'Erreur de connexion au serveur';
    }
    if (message.includes('timeout')) {
      return "Délai d'attente dépassé";
    }
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
}
