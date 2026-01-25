/**
 * Middleware de Cache Avancé - Phase 4.1
 *
 * Stratégies de cache différenciées par type de données :
 * - STATIC: données rarement modifiées (catégories, devises) - 1h
 * - DYNAMIC: données fréquemment modifiées (transactions) - 5min
 * - REALTIME: données temps réel (dashboard) - 30s
 * - USER: données utilisateur spécifiques - 10min
 */

const logger = require("../../logger");
const redisClient = require("../services/redis-client");

/**
 * TTL Presets par stratégie de cache
 */
const CACHE_TTL = {
  STATIC: 3600,      // 1 heure - catégories, devises, config
  DYNAMIC: 300,      // 5 minutes - transactions, budgets
  REALTIME: 30,      // 30 secondes - dashboard, KPIs
  USER: 600,         // 10 minutes - préférences utilisateur
  SHORT: 60,         // 1 minute - listes paginées
  NONE: 0,           // Pas de cache
};

/**
 * Génère une clé de cache unique
 * @param {string} prefix - Préfixe (ex: "accounts", "transactions")
 * @param {object} req - Request Express
 * @param {object} options - Options de génération
 */
function generateCacheKey(prefix, req, options = {}) {
  const parts = [prefix];

  // Company ID pour isolation multi-tenant
  if (req.user?.companyId) {
    parts.push(`company:${req.user.companyId}`);
  }

  // User ID si cache user-specific
  if (options.perUser && req.user?.id) {
    parts.push(`user:${req.user.id}`);
  }

  // Path et méthode
  parts.push(req.method);
  parts.push(req.originalUrl.replace(/[?&]/g, ':'));

  // Query params triés pour cohérence
  if (Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(k => `${k}=${req.query[k]}`)
      .join(':');
    parts.push(sortedQuery);
  }

  return parts.join(':');
}

/**
 * Middleware de cache configurable
 * @param {object} options - Configuration cache
 * @param {string} options.prefix - Préfixe clé cache
 * @param {number} options.ttl - TTL en secondes (ou utiliser strategy)
 * @param {string} options.strategy - Stratégie: STATIC, DYNAMIC, REALTIME, USER
 * @param {boolean} options.perUser - Cache par utilisateur
 * @param {function} options.condition - Fonction (req) => boolean pour activer cache
 */
function cacheMiddleware(options = {}) {
  const {
    prefix = 'api',
    ttl,
    strategy = 'DYNAMIC',
    perUser = false,
    condition = null,
  } = options;

  const cacheTTL = ttl || CACHE_TTL[strategy] || CACHE_TTL.DYNAMIC;

  return async (req, res, next) => {
    // Skip cache si TTL = 0 ou condition non remplie
    if (cacheTTL === 0) {
      return next();
    }

    if (condition && !condition(req)) {
      return next();
    }

    // Uniquement GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(prefix, req, { perUser });

    try {
      // Vérifier cache
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        logger.debug(`[Cache] HIT: ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-TTL', cacheTTL);
        return res.json(cached);
      }

      logger.debug(`[Cache] MISS: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      // Intercepter res.json pour cacher la réponse
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        // Ne pas cacher les erreurs
        if (res.statusCode >= 400) {
          return originalJson(data);
        }

        // Stocker en cache
        await redisClient.set(cacheKey, data, cacheTTL);
        logger.debug(`[Cache] SET: ${cacheKey} (TTL: ${cacheTTL}s)`);

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error(`[Cache] Error:`, error);
      // En cas d'erreur cache, continuer sans cache
      next();
    }
  };
}

/**
 * Invalide le cache pour un préfixe donné
 * @param {string} prefix - Préfixe à invalider
 * @param {number} companyId - Company ID pour isolation
 */
async function invalidateCache(prefix, companyId = null) {
  try {
    let pattern = `${prefix}:*`;
    if (companyId) {
      pattern = `${prefix}:company:${companyId}:*`;
    }

    await redisClient.delPattern(pattern);
    logger.info(`[Cache] Invalidated: ${pattern}`);
    return true;
  } catch (error) {
    logger.error(`[Cache] Invalidation error:`, error);
    return false;
  }
}

/**
 * Invalide plusieurs préfixes à la fois
 * @param {string[]} prefixes - Liste de préfixes
 * @param {number} companyId - Company ID
 */
async function invalidateMultiple(prefixes, companyId = null) {
  const results = await Promise.all(
    prefixes.map(prefix => invalidateCache(prefix, companyId))
  );
  return results.every(r => r);
}

/**
 * Middleware factory pour stratégies courantes
 */
const cache = {
  // Cache statique (catégories, devises, config)
  static: (prefix) => cacheMiddleware({
    prefix,
    strategy: 'STATIC',
  }),

  // Cache dynamique (transactions, budgets)
  dynamic: (prefix) => cacheMiddleware({
    prefix,
    strategy: 'DYNAMIC',
  }),

  // Cache temps réel (dashboard, KPIs)
  realtime: (prefix) => cacheMiddleware({
    prefix,
    strategy: 'REALTIME',
  }),

  // Cache utilisateur (préférences, settings)
  user: (prefix) => cacheMiddleware({
    prefix,
    strategy: 'USER',
    perUser: true,
  }),

  // Cache court (listes paginées)
  short: (prefix) => cacheMiddleware({
    prefix,
    strategy: 'SHORT',
  }),

  // Cache personnalisé
  custom: (prefix, ttlSeconds) => cacheMiddleware({
    prefix,
    ttl: ttlSeconds,
  }),

  // Pas de cache
  none: () => (req, res, next) => next(),
};

/**
 * Décorateur pour invalider cache après mutation
 * Usage: router.post("/", auth, invalidateAfter(['transactions', 'dashboard']), ...)
 */
function invalidateAfter(prefixes) {
  return async (req, res, next) => {
    // Intercepter res.json pour invalider après succès
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      // Si succès, invalider cache
      if (res.statusCode < 400) {
        const companyId = req.user?.companyId;
        await invalidateMultiple(prefixes, companyId);
      }
      return originalJson(data);
    };
    next();
  };
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateMultiple,
  invalidateAfter,
  cache,
  CACHE_TTL,
  generateCacheKey,
};
