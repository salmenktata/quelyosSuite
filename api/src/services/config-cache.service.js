const EventEmitter = require("events");
const logger = require("../../logger");

/**
 * Configuration Cache Service
 *
 * Provides in-memory caching for system configuration parameters
 * with category-level invalidation and automatic expiration.
 *
 * Features:
 * - In-memory cache with TTL (default: 5 minutes)
 * - Category-level cache invalidation
 * - Event emission for cache changes
 * - Automatic cleanup of expired entries
 *
 * Events:
 * - 'cache:invalidated' - { category }
 * - 'cache:invalidated:all'
 * - 'cache:hit' - { category }
 * - 'cache:miss' - { category }
 */
class ConfigCacheService extends EventEmitter {
  constructor() {
    super();

    // Cache storage: Map<category, { data, expiresAt }>
    this.cache = new Map();

    // Default TTL: 5 minutes
    this.defaultTTL = 5 * 60 * 1000; // 300000ms

    // Start cleanup interval
    this.startCleanupInterval();

    logger.info("ConfigCacheService initialized");
  }

  /**
   * Get cached configuration for a category
   * @param {string} category - Parameter category
   * @returns {Object|null} Cached data or null if not found/expired
   */
  get(category) {
    const entry = this.cache.get(category);

    if (!entry) {
      this.emit("cache:miss", { category });
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      // Entry expired, remove it
      this.cache.delete(category);
      this.emit("cache:miss", { category });
      logger.debug(`Cache expired for category: ${category}`);
      return null;
    }

    this.emit("cache:hit", { category });
    logger.debug(`Cache hit for category: ${category}`);
    return entry.data;
  }

  /**
   * Set cached configuration for a category
   * @param {string} category - Parameter category
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(category, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;

    this.cache.set(category, {
      data,
      expiresAt,
      cachedAt: Date.now(),
    });

    logger.debug(`Cache set for category: ${category}, TTL: ${ttl}ms`);
  }

  /**
   * Check if cache entry is valid (exists and not expired)
   * @param {string} category - Parameter category
   * @returns {boolean} True if valid cache exists
   */
  isValid(category) {
    const entry = this.cache.get(category);
    return entry && entry.expiresAt > Date.now();
  }

  /**
   * Invalidate cache for a specific category
   * @param {string} category - Parameter category
   */
  invalidateCategory(category) {
    const existed = this.cache.delete(category);

    if (existed) {
      this.emit("cache:invalidated", { category });
      logger.info(`Cache invalidated for category: ${category}`);
    }
  }

  /**
   * Invalidate all cached configuration
   */
  invalidateAll() {
    const count = this.cache.size;
    this.cache.clear();

    this.emit("cache:invalidated:all");
    logger.info(`All cache invalidated (${count} entries)`);
  }

  /**
   * Invalidate cache for multiple categories
   * @param {string[]} categories - Array of categories to invalidate
   */
  invalidateCategories(categories) {
    if (!Array.isArray(categories)) {
      logger.warn("invalidateCategories called with non-array argument");
      return;
    }

    categories.forEach((category) => {
      this.invalidateCategory(category);
    });
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    return {
      totalEntries: this.cache.size,
      validEntries: entries.filter(([_, entry]) => entry.expiresAt > now).length,
      expiredEntries: entries.filter(([_, entry]) => entry.expiresAt <= now).length,
      categories: entries.map(([category, entry]) => ({
        category,
        isValid: entry.expiresAt > now,
        cachedAt: new Date(entry.cachedAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        ttl: entry.expiresAt - now,
      })),
    };
  }

  /**
   * Remove all expired cache entries
   * @returns {number} Number of entries removed
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [category, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(category);
        removed++;
        logger.debug(`Cleaned up expired cache for category: ${category}`);
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup: removed ${removed} expired entries`);
    }

    return removed;
  }

  /**
   * Start automatic cleanup interval
   * Runs every minute to remove expired entries
   */
  startCleanupInterval() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 1 minute

    // Prevent interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }

    logger.debug("Cache cleanup interval started");
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.debug("Cache cleanup interval stopped");
    }
  }

  /**
   * Warm up cache by preloading specific categories
   * @param {Object} prisma - Prisma client instance
   * @param {string[]} categories - Categories to warm up (optional, defaults to all)
   */
  async warmup(prisma, categories = null) {
    try {
      const where = categories ? { category: { in: categories } } : {};

      const params = await prisma.systemParameter.findMany({
        where,
        orderBy: { key: "asc" },
      });

      // Group by category
      const grouped = params.reduce((acc, param) => {
        if (!acc[param.category]) {
          acc[param.category] = [];
        }
        acc[param.category].push({
          key: param.key,
          value: param.value,
          type: param.type,
        });
        return acc;
      }, {});

      // Cache each category
      Object.entries(grouped).forEach(([category, data]) => {
        this.set(category, data);
      });

      logger.info(`Cache warmed up: ${Object.keys(grouped).length} categories`);

      return {
        success: true,
        categoriesWarmed: Object.keys(grouped).length,
        parametersLoaded: params.length,
      };
    } catch (error) {
      logger.error("Error warming up cache:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get or fetch configuration for a category
   * If not in cache, fetch from database and cache it
   * @param {Object} prisma - Prisma client instance
   * @param {string} category - Parameter category
   * @param {number} ttl - Optional TTL override
   * @returns {Promise<Object[]>} Configuration parameters
   */
  async getOrFetch(prisma, category, ttl = null) {
    // Check cache first
    const cached = this.get(category);
    if (cached) {
      return cached;
    }

    // Fetch from database
    try {
      const params = await prisma.systemParameter.findMany({
        where: { category },
        orderBy: { key: "asc" },
      });

      const data = params.map((p) => ({
        key: p.key,
        value: p.value,
        type: p.type,
        scope: p.scope,
        label: p.label,
        description: p.description,
        unit: p.unit,
        validation: p.validation,
      }));

      // Cache the result
      this.set(category, data, ttl || this.defaultTTL);

      logger.debug(`Fetched and cached category: ${category} (${data.length} params)`);

      return data;
    } catch (error) {
      logger.error(`Error fetching category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get single parameter value from cache or database
   * @param {Object} prisma - Prisma client instance
   * @param {string} key - Parameter key
   * @returns {Promise<string|null>} Parameter value or null
   */
  async getParam(prisma, key) {
    try {
      // Try to find in cached categories
      for (const [_, entry] of this.cache.entries()) {
        if (entry.expiresAt > Date.now()) {
          const param = entry.data.find((p) => p.key === key);
          if (param) {
            return param.value;
          }
        }
      }

      // Not in cache, fetch from database
      const param = await prisma.systemParameter.findUnique({
        where: { key },
        select: { value: true },
      });

      return param ? param.value : null;
    } catch (error) {
      logger.error(`Error getting param ${key}:`, error);
      return null;
    }
  }
}

// Export singleton instance
const configCacheService = new ConfigCacheService();

module.exports = configCacheService;
