/**
 * Configuration Sentry pour vitrine-quelyos
 * Monitoring erreurs + alertes sécurité en production
 */

// @ts-expect-error - Module Sentry optionnel non installé en dev
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENV = process.env.NODE_ENV || 'development';
const SENTRY_ENABLED = SENTRY_ENV === 'production' && !!SENTRY_DSN;

/**
 * Initialise Sentry pour le monitoring
 */
export function initSentry() {
  if (!SENTRY_ENABLED) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% des transactions

    // Errors filtering
    // @ts-expect-error - Sentry types
    beforeSend(event, hint) {
      // Ignore erreurs client connues et bénignes
      const error = hint.originalException as Error;

      if (error?.message?.includes('ResizeObserver')) {
        return null; // Erreur bénigne navigateur
      }

      if (error?.message?.includes('hydration')) {
        return null; // Erreur React hydration (dev)
      }

      return event;
    },

    // Filtrer données sensibles
    // @ts-expect-error - Sentry types
    beforeBreadcrumb(breadcrumb) {
      // Ne pas logger les clics sur inputs password
      if (breadcrumb.category === 'ui.click') {
        const target = breadcrumb.message;
        if (target?.includes('password') || target?.includes('secret')) {
          return null;
        }
      }

      return breadcrumb;
    },

    // Tags personnalisés
    initialScope: {
      tags: {
        application: 'vitrine-quelyos',
      },
    },
  });
}

/**
 * Capture une erreur avec contexte enrichi
 */
export function captureError(
  error: Error | unknown,
  context?: {
    level?: 'fatal' | 'error' | 'warning' | 'info';
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  if (!SENTRY_ENABLED) {
    return;
  }

  // @ts-expect-error - Sentry types
  Sentry.withScope((scope) => {
    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture un événement de sécurité suspect
 */
export function captureSecurityEvent(
  message: string,
  details: {
    type: 'xss_attempt' | 'sql_injection' | 'rate_limit' | 'auth_failure' | 'suspicious_input';
    userIp?: string;
    userAgent?: string;
    payload?: unknown;
  }
) {
  if (!SENTRY_ENABLED) {
    return;
  }

  // @ts-expect-error - Sentry types
  Sentry.withScope((scope) => {
    scope.setLevel('warning');
    scope.setTag('security_event', details.type);

    if (details.userIp) {
      scope.setTag('user_ip', details.userIp);
    }

    scope.setExtra('details', details);

    Sentry.captureMessage(`[SECURITY] ${message}`, 'warning');
  });
}

/**
 * Capture un pattern suspect dans les inputs utilisateur
 */
export function detectSuspiciousPatterns(input: string, source: string): boolean {
  const suspiciousPatterns = [
    // SQL Injection
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /UNION.*SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,

    // XSS
    /<script[^>]*>.*<\/script>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onclick\s*=/i,

    // Path Traversal
    /\.\.[\/\\]/,

    // Command Injection
    /;\s*(rm|wget|curl|bash|sh)\s+/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      captureSecurityEvent('Suspicious input pattern detected', {
        type: 'suspicious_input',
        payload: {
          source,
          input: input.substring(0, 100), // Truncate
          pattern: pattern.source,
        },
      });
      return true;
    }
  }

  return false;
}

/**
 * Wrapper pour API calls avec monitoring automatique
 */
export async function monitoredFetch<T>(
  url: string,
  options?: RequestInit,
  context?: { operation: string }
): Promise<T> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    // Alert si requête lente (> 3s)
    if (duration > 3000 && SENTRY_ENABLED) {
      Sentry.captureMessage(
        `Slow API call: ${context?.operation || url} took ${duration}ms`,
        'warning'
      );
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    captureError(error, {
      level: 'error',
      tags: {
        operation: context?.operation || 'fetch',
        url,
      },
      extra: {
        duration: Date.now() - startTime,
        options,
      },
    });
    throw error;
  }
}

/**
 * Track une métrique custom
 */
export function trackMetric(name: string, value: number, unit?: string) {
  if (!SENTRY_ENABLED) {
    return;
  }

  Sentry.metrics.gauge(name, value, {
    unit: unit || 'none',
  });
}
