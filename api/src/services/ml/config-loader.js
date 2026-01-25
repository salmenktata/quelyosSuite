const configCache = require("../config-cache.service");
const logger = require("../../../logger");

const prisma = require("../../../prismaClient");

/**
 * ML Configuration Loader
 *
 * Loads ML service configuration from database with caching.
 * Provides hot reload capability when config changes.
 *
 * Usage:
 *   const mlConfig = require('./config-loader');
 *   const threshold = await mlConfig.get('ml.categorization.confidence_threshold');
 */

class MLConfigLoader {
  constructor() {
    this.cache = new Map();
    this.defaultValues = new Map();

    // Listen to cache invalidation events for hot reload
    configCache.on("cache:invalidated", ({ category }) => {
      this.handleCacheInvalidation(category);
    });

    configCache.on("cache:invalidated:all", () => {
      this.cache.clear();
      logger.info("[MLConfigLoader] All config cache cleared");
    });

    logger.info("[MLConfigLoader] Initialized with hot reload support");
  }

  /**
   * Handle cache invalidation from config-cache service
   * @param {string} category - Category that was invalidated
   */
  handleCacheInvalidation(category) {
    // Remove all cached values for this category
    const prefix = category.toLowerCase().replace("_", ".");
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        logger.debug(`[MLConfigLoader] Removed cached value for ${key}`);
      }
    }
  }

  /**
   * Get configuration value from database with caching
   * @param {string} key - Parameter key (e.g., 'ml.categorization.confidence_threshold')
   * @param {any} fallback - Fallback value if not found
   * @returns {Promise<any>} Configuration value
   */
  async get(key, fallback = null) {
    try {
      // Check local cache first (faster than configCache)
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      // Try to get from configCache service
      const param = await configCache.getParam(prisma, key);

      if (param !== null) {
        const parsed = this.parseValue(param);
        this.cache.set(key, parsed);
        return parsed;
      }

      // Not found, use fallback
      logger.warn(`[MLConfigLoader] Parameter ${key} not found, using fallback: ${fallback}`);
      return fallback;
    } catch (error) {
      logger.error(`[MLConfigLoader] Error loading ${key}:`, error);
      return fallback;
    }
  }

  /**
   * Parse parameter value based on its stored format
   * @param {string} value - Stored value
   * @returns {any} Parsed value
   */
  parseValue(value) {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // Not JSON, return as-is
      return value;
    }
  }

  /**
   * Get multiple configuration values at once
   * @param {string[]} keys - Array of parameter keys
   * @returns {Promise<Object>} Map of key -> value
   */
  async getMany(keys) {
    const results = {};

    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.get(key);
      })
    );

    return results;
  }

  /**
   * Get all parameters for a category
   * @param {string} category - Category enum value (e.g., 'ML_CATEGORIZATION')
   * @returns {Promise<Object>} Map of key -> value
   */
  async getCategory(category) {
    try {
      const params = await configCache.getOrFetch(prisma, category);

      const result = {};
      params.forEach((param) => {
        result[param.key] = this.parseValue(param.value);
        // Also cache individual values
        this.cache.set(param.key, this.parseValue(param.value));
      });

      return result;
    } catch (error) {
      logger.error(`[MLConfigLoader] Error loading category ${category}:`, error);
      return {};
    }
  }

  /**
   * Get number value with validation
   * @param {string} key - Parameter key
   * @param {number} fallback - Fallback value
   * @returns {Promise<number>} Numeric value
   */
  async getNumber(key, fallback = 0) {
    const value = await this.get(key, fallback);
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  }

  /**
   * Get boolean value
   * @param {string} key - Parameter key
   * @param {boolean} fallback - Fallback value
   * @returns {Promise<boolean>} Boolean value
   */
  async getBoolean(key, fallback = false) {
    const value = await this.get(key, fallback);
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return fallback;
  }

  /**
   * Get string value
   * @param {string} key - Parameter key
   * @param {string} fallback - Fallback value
   * @returns {Promise<string>} String value
   */
  async getString(key, fallback = "") {
    const value = await this.get(key, fallback);
    return value?.toString() || fallback;
  }

  /**
   * Clear local cache (keeps configCache intact)
   */
  clearCache() {
    this.cache.clear();
    logger.debug("[MLConfigLoader] Local cache cleared");
  }

  /**
   * Preload commonly used ML configuration
   * @returns {Promise<void>}
   */
  async preload() {
    try {
      const categories = [
        "ML_CATEGORIZATION",
        "ML_ANOMALY",
        "ML_DUPLICATES",
        "ML_SMART_BUDGETS",
        "ML_CREDIT_SCORING",
        "FORECASTING_PROPHET",
      ];

      await Promise.all(categories.map((cat) => this.getCategory(cat)));

      logger.info(`[MLConfigLoader] Preloaded ${categories.length} ML categories`);
    } catch (error) {
      logger.error("[MLConfigLoader] Error preloading config:", error);
    }
  }

  /**
   * Get ML Categorization config
   * @returns {Promise<Object>}
   */
  async getCategorizationConfig() {
    return {
      confidenceThreshold: await this.getNumber("ml.categorization.confidence_threshold", 60),
      cacheTTL: await this.getNumber("ml.categorization.cache_ttl", 300),
      trainingMinTransactions: await this.getNumber("ml.categorization.training_min_transactions", 100),
      fallbackToGlobal: await this.getBoolean("ml.categorization.fallback_to_global", true),
      retrainFrequencyDays: await this.getNumber("ml.categorization.retrain_frequency_days", 7),
      maxSuggestionsPerTransaction: await this.getNumber("ml.categorization.max_suggestions_per_transaction", 3),
      enableAutoCategorization: await this.getBoolean("ml.categorization.enable_auto_categorization", true),
      learningRate: await this.getNumber("ml.categorization.learning_rate", 0.01),
    };
  }

  /**
   * Get ML Anomaly Detection config
   * @returns {Promise<Object>}
   */
  async getAnomalyConfig() {
    return {
      contamination: await this.getNumber("ml.anomaly.contamination", 5),
      severityThresholdHigh: await this.getNumber("ml.anomaly.severity_threshold_high", 0.8),
      severityThresholdMedium: await this.getNumber("ml.anomaly.severity_threshold_medium", 0.6),
      severityThresholdLow: await this.getNumber("ml.anomaly.severity_threshold_low", 0.4),
      minTransactionsForDetection: await this.getNumber("ml.anomaly.min_transactions_for_detection", 50),
      lookbackDays: await this.getNumber("ml.anomaly.lookback_days", 90),
      enableAmountDetection: await this.getBoolean("ml.anomaly.enable_amount_detection", true),
      enableFrequencyDetection: await this.getBoolean("ml.anomaly.enable_frequency_detection", true),
      enablePatternDetection: await this.getBoolean("ml.anomaly.enable_pattern_detection", true),
      autoDismissLowSeverity: await this.getBoolean("ml.anomaly.auto_dismiss_low_severity", false),
      autoDismissDays: await this.getNumber("ml.anomaly.auto_dismiss_days", 7),
      cacheTTL: await this.getNumber("ml.anomaly.cache_ttl", 600),
    };
  }

  /**
   * Get ML Duplicate Detection config
   * @returns {Promise<Object>}
   */
  async getDuplicateConfig() {
    return {
      similarityThreshold: await this.getNumber("ml.duplicates.similarity_threshold", 75),
      weightDescription: await this.getNumber("ml.duplicates.weight_description", 60),
      weightAmount: await this.getNumber("ml.duplicates.weight_amount", 20),
      weightDate: await this.getNumber("ml.duplicates.weight_date", 20),
      dateWindowDays: await this.getNumber("ml.duplicates.date_window_days", 7),
      amountTolerancePercent: await this.getNumber("ml.duplicates.amount_tolerance_percent", 5),
      autoFlagThreshold: await this.getNumber("ml.duplicates.auto_flag_threshold", 90),
      fuzzyMatchingEnabled: await this.getBoolean("ml.duplicates.fuzzy_matching_enabled", true),
      caseSensitive: await this.getBoolean("ml.duplicates.case_sensitive", false),
      ignoreWhitespace: await this.getBoolean("ml.duplicates.ignore_whitespace", true),
    };
  }

  /**
   * Get ML Smart Budgets config
   * @returns {Promise<Object>}
   */
  async getBudgetConfig() {
    return {
      recommendedPercentile: await this.getString("ml.budgets.recommended_percentile", "q3"),
      minHistoricalMonths: await this.getNumber("ml.budgets.min_historical_months", 3),
      maxHistoricalMonths: await this.getNumber("ml.budgets.max_historical_months", 24),
      confidenceThreshold: await this.getNumber("ml.budgets.confidence_threshold", 70),
      seasonalAdjustment: await this.getBoolean("ml.budgets.seasonal_adjustment", true),
      trendDetection: await this.getBoolean("ml.budgets.trend_detection", true),
      outlierRemoval: await this.getBoolean("ml.budgets.outlier_removal", true),
      cacheValidityDays: await this.getNumber("ml.budgets.cache_validity_days", 7),
      growthFactor: await this.getNumber("ml.budgets.growth_factor", 10),
      minTransactionsPerMonth: await this.getNumber("ml.budgets.min_transactions_per_month", 3),
      enableAutoCreate: await this.getBoolean("ml.budgets.enable_auto_create", false),
      seasonalityMonths: await this.getNumber("ml.budgets.seasonality_months", 12),
      forecastMonthsAhead: await this.getNumber("ml.budgets.forecast_months_ahead", 3),
      patternStable: await this.getString("ml.budgets.pattern_stable", "stable"),
    };
  }

  /**
   * Get ML Credit Scoring config
   * @returns {Promise<Object>}
   */
  async getCreditScoringConfig() {
    return {
      riskThresholdLowMax: await this.getNumber("ml.credit.risk_threshold_low_max", 30),
      riskThresholdMediumMax: await this.getNumber("ml.credit.risk_threshold_medium_max", 60),
      riskThresholdHighMax: await this.getNumber("ml.credit.risk_threshold_high_max", 85),
      minInvoicesForScoring: await this.getNumber("ml.credit.min_invoices_for_scoring", 3),
      lookbackMonths: await this.getNumber("ml.credit.lookback_months", 12),
      weightPaymentDelay: await this.getNumber("ml.credit.weight_payment_delay", 40),
      weightLateRate: await this.getNumber("ml.credit.weight_late_rate", 30),
      weightRelationshipMonths: await this.getNumber("ml.credit.weight_relationship_months", 20),
      weightPaymentConsistency: await this.getNumber("ml.credit.weight_payment_consistency", 10),
      cacheValidityDays: await this.getNumber("ml.credit.cache_validity_days", 30),
      autoSuspendCriticalRisk: await this.getBoolean("ml.credit.auto_suspend_critical_risk", false),
      alertOnRiskChange: await this.getBoolean("ml.credit.alert_on_risk_change", true),
      paymentTermsDefault: await this.getNumber("ml.credit.payment_terms_default", 30),
      earlyPaymentBonus: await this.getNumber("ml.credit.early_payment_bonus", 2),
      latePaymentPenalty: await this.getNumber("ml.credit.late_payment_penalty", 10),
      modelVersion: await this.getString("ml.credit.model_version", "1.0"),
    };
  }

  /**
   * Get Forecasting Prophet config
   * @returns {Promise<Object>}
   */
  async getForecastConfig() {
    return {
      horizonDays: await this.getNumber("forecast.horizon_days", 365),
      confidenceLevelPrimary: await this.getNumber("forecast.confidence_level_primary", 80),
      confidenceLevelSecondary: await this.getNumber("forecast.confidence_level_secondary", 95),
      minHistoricalDays: await this.getNumber("forecast.min_historical_days", 90),
      seasonalityMode: await this.getString("forecast.seasonality_mode", "multiplicative"),
      yearlySeasonality: await this.getBoolean("forecast.yearly_seasonality", true),
      weeklySeasonality: await this.getBoolean("forecast.weekly_seasonality", true),
      dailySeasonality: await this.getBoolean("forecast.daily_seasonality", false),
      growthModel: await this.getString("forecast.growth_model", "linear"),
      cacheTTL: await this.getNumber("forecast.cache_ttl_hours", 24),
      autoEventsDetection: await this.getBoolean("forecast.auto_events_detection", true),
      changepointPriorScale: await this.getNumber("forecast.changepoint_prior_scale", 0.05),
    };
  }
}

// Export singleton instance
const mlConfigLoader = new MLConfigLoader();

module.exports = mlConfigLoader;
