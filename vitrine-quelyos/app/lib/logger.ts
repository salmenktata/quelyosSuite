/**
 * Logger sécurisé pour vitrine-quelyos (Next.js 14)
 *
 * Masque automatiquement les logs en production pour éviter
 * l'exposition de détails techniques dans la console navigateur.
 * Intégré avec Sentry pour monitoring en production.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.error('Erreur chargement données:', error);
 *   logger.warn('Stock faible:', productId);
 *   logger.info('Panier créé:', cartId);
 */

import { captureError as _captureError } from './sentry';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const _isProduction = process.env.NODE_ENV === 'production';

/**
 * Interface Logger pour maintenir compatibilité avec console
 */
interface Logger {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
  log(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}

/**
 * Logger qui masque automatiquement les logs en production
 */
export const logger: Logger = {
  /**
   * Erreurs (affichées en dev, masquées en production)
   *
   * En production, considérer l'envoi à un service de monitoring
   * comme Sentry, Datadog, ou LogRocket.
   */
  error(...args: unknown[]): void {
    if (isDevelopment || isTest) {
      console.error('[ERROR]', ...args);
    } else {
      // Production: masquer console, mais pouvoir envoyer à Sentry
      // TODO: Intégrer Sentry.captureException(args[args.length - 1])
    }
  },

  /**
   * Warnings (affichés en dev, masqués en production)
   */
  warn(...args: unknown[]): void {
    if (isDevelopment || isTest) {
      console.warn('[WARN]', ...args);
    } else {
      // Production: masquer
    }
  },

  /**
   * Informations (affichées en dev uniquement)
   */
  info(...args: unknown[]): void {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Logs généraux (affichés en dev uniquement)
   */
  log(...args: unknown[]): void {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },

  /**
   * Debug (affichés en dev uniquement)
   */
  debug(...args: unknown[]): void {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
};

/**
 * Logger pour composants React (avec nom de composant)
 *
 * Usage:
 *   const log = createComponentLogger('ProductCard');
 *   log.error('Failed to load product:', error);
 */
export function createComponentLogger(componentName: string): Logger {
  return {
    error(...args: unknown[]): void {
      logger.error(`[${componentName}]`, ...args);
    },
    warn(...args: unknown[]): void {
      logger.warn(`[${componentName}]`, ...args);
    },
    info(...args: unknown[]): void {
      logger.info(`[${componentName}]`, ...args);
    },
    log(...args: unknown[]): void {
      logger.log(`[${componentName}]`, ...args);
    },
    debug(...args: unknown[]): void {
      logger.debug(`[${componentName}]`, ...args);
    },
  };
}

/**
 * Logger pour API routes (avec endpoint)
 *
 * Usage:
 *   const log = createApiLogger('POST /api/votes');
 *   log.error('Database error:', error);
 */
export function createApiLogger(endpoint: string): Logger {
  return {
    error(...args: unknown[]): void {
      logger.error(`[API:${endpoint}]`, ...args);
    },
    warn(...args: unknown[]): void {
      logger.warn(`[API:${endpoint}]`, ...args);
    },
    info(...args: unknown[]): void {
      logger.info(`[API:${endpoint}]`, ...args);
    },
    log(...args: unknown[]): void {
      logger.log(`[API:${endpoint}]`, ...args);
    },
    debug(...args: unknown[]): void {
      logger.debug(`[API:${endpoint}]`, ...args);
    },
  };
}

/**
 * Sanitize error pour éviter fuite d'infos sensibles
 *
 * Usage:
 *   logger.error('API failed:', sanitizeError(error));
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // En production, retourner message générique
    if (!isDevelopment && !isTest) {
      return 'An error occurred';
    }

    // En dev, retourner détails
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}

export default logger;
