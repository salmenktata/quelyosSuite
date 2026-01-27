/**
 * Health Check API - Dashboard Client
 * Expose l'état de santé du service et les erreurs récentes
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  errors: ErrorLog[];
  warnings: WarningLog[];
  metrics: {
    errorCount: number;
    warningCount: number;
    lastErrorTime?: string;
  };
}

interface ErrorLog {
  message: string;
  timestamp: string;
  stack?: string;
  component?: string;
}

interface WarningLog {
  message: string;
  timestamp: string;
  component?: string;
}

// Buffers en mémoire (limités aux 5 dernières minutes)
const errorBuffer: ErrorLog[] = [];
const warningBuffer: WarningLog[] = [];
const MAX_BUFFER_SIZE = 50;
const BUFFER_RETENTION_MS = 5 * 60 * 1000; // 5 minutes

const startTime = Date.now();

/**
 * Logger une erreur
 */
export function logError(error: Error | string, component?: string) {
  const errorLog: ErrorLog = {
    message: typeof error === 'string' ? error : error.message,
    timestamp: new Date().toISOString(),
    stack: typeof error === 'string' ? undefined : error.stack,
    component,
  };

  errorBuffer.push(errorLog);

  // Limiter la taille du buffer
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift();
  }

  // Nettoyer les anciennes entrées
  cleanOldLogs();
}

/**
 * Logger un warning
 */
export function logWarning(message: string, component?: string) {
  const warningLog: WarningLog = {
    message,
    timestamp: new Date().toISOString(),
    component,
  };

  warningBuffer.push(warningLog);

  if (warningBuffer.length > MAX_BUFFER_SIZE) {
    warningBuffer.shift();
  }

  cleanOldLogs();
}

/**
 * Nettoyer les logs trop anciens
 */
function cleanOldLogs() {
  const now = Date.now();
  const cutoff = new Date(now - BUFFER_RETENTION_MS).toISOString();

  // Supprimer les erreurs trop anciennes
  while (errorBuffer.length > 0 && errorBuffer[0].timestamp < cutoff) {
    errorBuffer.shift();
  }

  // Supprimer les warnings trop anciens
  while (warningBuffer.length > 0 && warningBuffer[0].timestamp < cutoff) {
    warningBuffer.shift();
  }
}

/**
 * Obtenir le statut de santé
 */
export function getHealthStatus(): HealthStatus {
  cleanOldLogs();

  const now = Date.now();
  const uptime = Math.floor((now - startTime) / 1000); // en secondes
  const recentErrors = errorBuffer.filter(
    (e) => new Date(e.timestamp).getTime() > now - 60000 // dernière minute
  );

  // Déterminer le statut
  let status: 'healthy' | 'degraded' | 'down' = 'healthy';
  if (recentErrors.length > 10) {
    status = 'down';
  } else if (recentErrors.length > 3) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime,
    errors: errorBuffer.slice(-10), // 10 dernières erreurs
    warnings: warningBuffer.slice(-10), // 10 derniers warnings
    metrics: {
      errorCount: errorBuffer.length,
      warningCount: warningBuffer.length,
      lastErrorTime: errorBuffer[errorBuffer.length - 1]?.timestamp,
    },
  };
}
