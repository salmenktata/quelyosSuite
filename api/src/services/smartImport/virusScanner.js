const NodeClam = require('clamscan');
const logger = require('../../../logger');

let clamScanInstance = null;
let initializationAttempted = false;
let initializationError = null;

/**
 * Initialise ClamAV
 * @returns {Promise<NodeClam|null>}
 */
async function initClamAV() {
  // Retourner instance existante si déjà initialisée
  if (clamScanInstance) {
    return clamScanInstance;
  }

  // Ne pas réessayer si déjà échoué
  if (initializationAttempted && initializationError) {
    return null;
  }

  initializationAttempted = true;

  try {
    // Configuration ClamAV
    const config = {
      clamdscan: {
        socket: process.env.CLAMAV_SOCKET || '/var/run/clamav/clamd.sock',
        host: process.env.CLAMAV_HOST || 'localhost',
        port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
        timeout: 60000, // 60 secondes
        active: process.env.CLAMAV_ENABLED !== 'false', // Activé par défaut
      },
      preference: 'clamdscan', // Préférer daemon mode (plus rapide)
    };

    logger.info('[ClamAV] Initializing virus scanner...');
    clamScanInstance = await new NodeClam().init(config);

    // Test de connexion
    const version = await clamScanInstance.getVersion();
    logger.info(`[ClamAV] Successfully initialized (version: ${version})`);

    return clamScanInstance;
  } catch (err) {
    initializationError = err;
    logger.error('[ClamAV] Initialization failed:', err.message);

    // Stratégie fallback selon environnement
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[ClamAV] Running in dev/test mode - virus scanning will be skipped');
      logger.warn('[ClamAV] To enable scanning, start ClamAV daemon:');
      logger.warn('[ClamAV]   - Docker: docker run -d -p 3310:3310 clamav/clamav:latest');
      logger.warn('[ClamAV]   - Or set CLAMAV_ENABLED=false to suppress this warning');
      return null;
    } else {
      // En production: fail-closed (bloquer si pas de scan)
      logger.error('[ClamAV] CRITICAL: Virus scanning unavailable in production!');
      throw new Error('ClamAV unavailable in production environment');
    }
  }
}

/**
 * Scanne un buffer pour détecter des virus
 * @param {Buffer} buffer - Fichier à scanner
 * @param {string} filename - Nom du fichier (pour logs)
 * @returns {Promise<{isInfected: boolean, viruses: string[]}>}
 */
async function scanBuffer(buffer, filename) {
  try {
    const scanner = await initClamAV();

    // Fallback: pas de scanner disponible
    if (!scanner) {
      if (process.env.NODE_ENV === 'production') {
        // En production: rejeter
        throw new Error('Service de sécurité temporairement indisponible');
      }

      // En dev/test: permettre mais logger
      logger.warn(`[ClamAV] Skipping virus scan for "${filename}" (scanner unavailable in dev/test)`);
      return {
        isInfected: false,
        viruses: [],
        skipped: true,
      };
    }

    // Scanner le buffer
    logger.debug(`[ClamAV] Scanning file "${filename}" (${buffer.length} bytes)...`);
    const startTime = Date.now();

    const { isInfected, viruses } = await scanner.scanBuffer(buffer, 3000, filename);

    const scanTime = Date.now() - startTime;
    logger.debug(`[ClamAV] Scan completed in ${scanTime}ms`);

    if (isInfected) {
      logger.warn(`[ClamAV] VIRUS DETECTED in "${filename}":`, viruses);
    }

    return { isInfected, viruses };
  } catch (err) {
    logger.error('[ClamAV] Scan error:', err);

    // En production: fail-closed (considérer comme infecté par sécurité)
    if (process.env.NODE_ENV === 'production') {
      logger.error(`[ClamAV] Scan failed in production - rejecting file "${filename}" by security policy`);
      throw new Error('Impossible de vérifier la sécurité du fichier');
    }

    // En dev/test: permettre mais logger
    logger.warn(`[ClamAV] Scan failed for "${filename}", allowing in dev/test mode:`, err.message);
    return {
      isInfected: false,
      viruses: [],
      error: err.message,
    };
  }
}

/**
 * Vérifie si ClamAV est disponible
 * @returns {Promise<boolean>}
 */
async function isAvailable() {
  try {
    const scanner = await initClamAV();
    return scanner !== null;
  } catch {
    return false;
  }
}

/**
 * Obtient le statut du scanner
 * @returns {Promise<Object>}
 */
async function getStatus() {
  try {
    const scanner = await initClamAV();

    if (!scanner) {
      return {
        available: false,
        enabled: process.env.CLAMAV_ENABLED !== 'false',
        environment: process.env.NODE_ENV,
        message: 'Scanner not initialized',
      };
    }

    const version = await scanner.getVersion();

    return {
      available: true,
      enabled: true,
      version,
      environment: process.env.NODE_ENV,
      config: {
        socket: process.env.CLAMAV_SOCKET,
        host: process.env.CLAMAV_HOST,
        port: process.env.CLAMAV_PORT,
      },
    };
  } catch (err) {
    return {
      available: false,
      enabled: process.env.CLAMAV_ENABLED !== 'false',
      environment: process.env.NODE_ENV,
      error: err.message,
    };
  }
}

module.exports = {
  scanBuffer,
  isAvailable,
  getStatus,
  initClamAV,
};
