const axios = require('axios');
const mlConfig = require('./config-loader');

/**
 * Client HTTP pour le service ML de budget optimization
 *
 * Pattern: Singleton with DB config
 * Service Python: budget-optimizer (port 8005)
 */
class BudgetOptimizerClient {
  constructor() {
    this.baseUrl = process.env.ML_BUDGET_URL || 'http://localhost:8005';
    this.cache = new Map();
    this.cacheTTL = 604800000; // Default 7 days cache, will be overridden from DB
    this.timeout = 10000; // 10s timeout
    this.config = null; // Will be loaded from DB

    console.log(`BudgetOptimizerClient initialized: ${this.baseUrl}`);
    this.loadConfig(); // Load config asynchronously
  }

  /**
   * Load configuration from database
   */
  async loadConfig() {
    try {
      this.config = await mlConfig.getBudgetConfig();
      this.cacheTTL = this.config.cacheValidityDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      console.log('[BudgetOptimizerClient] Config loaded from DB:', {
        recommendedPercentile: this.config.recommendedPercentile,
        minHistoricalMonths: this.config.minHistoricalMonths,
        maxHistoricalMonths: this.config.maxHistoricalMonths,
        confidenceThreshold: this.config.confidenceThreshold,
        cacheTTL: this.cacheTTL,
      });
    } catch (error) {
      console.error('[BudgetOptimizerClient] Error loading config, using defaults:', error.message);
      // Fallback to defaults if DB unavailable
      this.config = {
        recommendedPercentile: 'q3',
        minHistoricalMonths: 3,
        maxHistoricalMonths: 24,
        confidenceThreshold: 70,
        seasonalAdjustment: true,
        trendDetection: true,
        outlierRemoval: true,
        cacheValidityDays: 7,
        growthFactor: 10,
        minTransactionsPerMonth: 3,
        enableAutoCreate: false,
        seasonalityMonths: 12,
        forecastMonthsAhead: 3,
        patternStable: 'stable',
      };
      this.cacheTTL = this.config.cacheValidityDays * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Recommander un montant de budget optimal pour une catégorie
   *
   * @param {number} companyId
   * @param {number} categoryId
   * @param {Array<Object>} transactions - Transactions historiques
   * @param {number} transactions[].amount
   * @param {string} transactions[].date - ISO format
   * @param {number} historicalMonths - Nombre de mois à analyser (3-24)
   *
   * @returns {Promise<Object>} {
   *   recommended_amount: number,
   *   confidence: number (0-100),
   *   seasonal_pattern: "stable"|"increasing"|"decreasing"|"seasonal",
   *   breakdown: {min, q1, median, q3, max, avg, std},
   *   seasonal_factors: {monthly_amounts: {1: ..., 2: ...}} | null,
   *   analysis_months: number,
   *   samples_used: number
   * }
   */
  async recommendBudget(companyId, categoryId, transactions, historicalMonths = 12) {
    try {
      // Check cache first
      const cacheKey = `budget:${companyId}:${categoryId}:${historicalMonths}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`[BudgetOptimizer] Cache hit for ${cacheKey}`);
        return cached.data;
      }

      const response = await axios.post(
        `${this.baseUrl}/recommend-budget`,
        {
          company_id: companyId,
          category_id: categoryId,
          transactions: transactions.map(tx => ({
            amount: tx.amount,
            date: tx.date || tx.occurredAt
          })),
          historical_months: historicalMonths
        },
        { timeout: this.timeout }
      );

      // Cache result
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('[BudgetOptimizer] Service unavailable, skipping recommendation');
        // Graceful fallback - return null
        return null;
      }

      console.error('[BudgetOptimizer] Error:', error.message);
      throw new Error(`Budget optimization failed: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('[BudgetOptimizer] Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Clear cache for a specific company/category
   */
  clearCache(companyId, categoryId) {
    const pattern = `budget:${companyId}:${categoryId}`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }
}

module.exports = new BudgetOptimizerClient();
