const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require("@sentry/profiling-node");

function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  
  // Si pas de DSN, Sentry est désactivé
  if (!dsn) {
    console.log('ℹ️  Sentry monitoring disabled (no SENTRY_DSN)');
    return { enabled: false };
  }

  const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
  const profilesSampleRate = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1');

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0.1 : tracesSampleRate,
    
    // Profiling
    profilesSampleRate: Number.isNaN(profilesSampleRate) ? 0.1 : profilesSampleRate,
    integrations: [
      new ProfilingIntegration(),
    ],
    
    // Configuration avancée
    release: process.env.SENTRY_RELEASE || `quelyos-api@${process.env.npm_package_version || 'unknown'}`,
    serverName: process.env.SERVER_NAME || require('os').hostname(),
    
    // Filtres
    ignoreErrors: [
      // Erreurs réseau communes à ignorer
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NetworkError',
      // Erreurs client à ignorer
      'Invalid credentials',
      'No token provided',
    ],
    
    // Données sensibles
    beforeSend(event, hint) {
      // Masquer les données sensibles
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      
      // Ajouter contexte user si disponible
      if (event.user) {
        delete event.user.ip_address;
      }
      
      return event;
    },
    
    // Breadcrumbs pour traçabilité
    beforeBreadcrumb(breadcrumb, hint) {
      // Filtrer les breadcrumbs sensibles
      if (breadcrumb.category === 'console' && breadcrumb.message?.includes('password')) {
        return null;
      }
      return breadcrumb;
    }
  });

  // Middleware Sentry pour Express
  app.use(Sentry.Handlers.requestHandler({
    ip: false, // Ne pas capturer les IPs
    user: ['id', 'email', 'role'], // Capturer seulement ces champs user
  }));
  
  app.use(Sentry.Handlers.tracingHandler());

  console.log('✅ Sentry monitoring enabled:', {
    environment: process.env.NODE_ENV,
    tracesSampleRate,
    profilesSampleRate
  });

  return { enabled: true, Sentry };
}

module.exports = { initSentry };
