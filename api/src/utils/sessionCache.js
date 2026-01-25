const NodeCache = require('node-cache');
const { randomBytes } = require('crypto');
const logger = require('../../logger');

/**
 * Session cache pour stocker temporairement les données d'import
 * TTL: 15 minutes par session
 */
class ImportSessionCache {
  constructor() {
    // TTL: 15 minutes (900 secondes)
    // checkperiod: vérification toutes les 2 minutes
    this.cache = new NodeCache({
      stdTTL: 900,
      checkperiod: 120,
      useClones: false // Performance: évite clonage profond
    });

    // Log des statistiques
    this.cache.on('expired', (key) => {
      logger.info(`[SessionCache] Session expirée: ${key}`);
    });

    logger.info('[SessionCache] Initialized with TTL=900s');
  }

  /**
   * Crée une nouvelle session avec un ID unique
   * @param {Object} data - Données à stocker dans la session
   * @returns {string} sessionId généré
   */
  createSession(data) {
    const sessionId = randomBytes(32).toString('hex');

    this.cache.set(sessionId, {
      ...data,
      createdAt: Date.now(),
      companyId: data.companyId, // Pour sécurité
    });

    logger.info(`[SessionCache] Session créée: ${sessionId} (companyId: ${data.companyId})`);

    return sessionId;
  }

  /**
   * Récupère une session avec vérification de ownership
   * @param {string} sessionId - ID de la session
   * @param {number} companyId - ID de la company pour vérification
   * @returns {Object|null} Données de la session ou null si invalide
   */
  getSession(sessionId, companyId) {
    if (!sessionId) {
      logger.warn('[SessionCache] SessionId manquant');
      return null;
    }

    const session = this.cache.get(sessionId);

    if (!session) {
      logger.warn(`[SessionCache] Session introuvable ou expirée: ${sessionId}`);
      return null;
    }

    // Sécurité: vérifie que la session appartient bien à cette company
    if (session.companyId !== companyId) {
      logger.error(`[SessionCache] Tentative d'accès non autorisé à session ${sessionId} par company ${companyId}`);
      return null;
    }

    return session;
  }

  /**
   * Supprime une session
   * @param {string} sessionId - ID de la session à supprimer
   */
  deleteSession(sessionId) {
    const deleted = this.cache.del(sessionId);
    if (deleted > 0) {
      logger.info(`[SessionCache] Session supprimée: ${sessionId}`);
    }
    return deleted > 0;
  }

  /**
   * Met à jour une session existante
   * @param {string} sessionId - ID de la session
   * @param {Object} updates - Données à mettre à jour
   */
  updateSession(sessionId, updates) {
    const session = this.cache.get(sessionId);
    if (!session) {
      logger.warn(`[SessionCache] Impossible de mettre à jour session inexistante: ${sessionId}`);
      return false;
    }

    const updatedSession = { ...session, ...updates };
    this.cache.set(sessionId, updatedSession);

    logger.debug(`[SessionCache] Session mise à jour: ${sessionId}`);
    return true;
  }

  /**
   * Retourne les statistiques du cache
   * @returns {Object} Stats du cache
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats(),
    };
  }

  /**
   * Vide toutes les sessions (utile pour tests)
   */
  flush() {
    this.cache.flushAll();
    logger.warn('[SessionCache] Cache vidé complètement');
  }
}

// Export singleton
module.exports = new ImportSessionCache();
