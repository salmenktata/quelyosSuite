const axios = require('axios');
const mlConfig = require('./config-loader');

/**
 * Client HTTP pour le service ML de détection d'anomalies
 *
 * Pattern: Singleton avec cache from DB config
 * Service Python: ml-anomaly-detector (port 8003)
 */
class AnomalyDetectorClient {
  constructor() {
    this.baseUrl = process.env.ML_ANOMALY_URL || 'http://localhost:8003';
    this.cache = new Map();
    this.cacheTTL = 3600000; // Default 1h cache, will be overridden from DB
    this.timeout = 5000; // 5s timeout
    this.config = null; // Will be loaded from DB

    console.log(`AnomalyDetectorClient initialized: ${this.baseUrl}`);
    this.loadConfig(); // Load config asynchronously
  }

  /**
   * Load configuration from database
   */
  async loadConfig() {
    try {
      this.config = await mlConfig.getAnomalyConfig();
      this.cacheTTL = this.config.cacheTTL * 1000; // Convert seconds to milliseconds
      console.log('[AnomalyDetectorClient] Config loaded from DB:', {
        contamination: this.config.contamination,
        severityThresholds: {
          high: this.config.severityThresholdHigh,
          medium: this.config.severityThresholdMedium,
          low: this.config.severityThresholdLow,
        },
        cacheTTL: this.cacheTTL,
      });
    } catch (error) {
      console.error('[AnomalyDetectorClient] Error loading config, using defaults:', error.message);
      // Fallback to defaults if DB unavailable
      this.config = {
        contamination: 5,
        severityThresholdHigh: 0.8,
        severityThresholdMedium: 0.6,
        severityThresholdLow: 0.4,
        minTransactionsForDetection: 50,
        lookbackDays: 90,
        enableAmountDetection: true,
        enableFrequencyDetection: true,
        enablePatternDetection: true,
        autoDismissLowSeverity: false,
        autoDismissDays: 7,
        cacheTTL: 600,
      };
      this.cacheTTL = this.config.cacheTTL * 1000;
    }
  }

  /**
   * Détecte les anomalies dans une liste de transactions
   *
   * @param {number} companyId - ID de la société
   * @param {Array<Object>} transactions - Transactions à analyser
   * @param {number} transactions[].id
   * @param {number} transactions[].amount
   * @param {string} transactions[].date - ISO format
   * @param {number} transactions[].categoryId
   *
   * @returns {Promise<Object>} {
   *   anomalies: [
   *     {
   *       transaction_id: number,
   *       amount: number,
   *       category_id: number,
   *       date: string,
   *       is_anomaly: boolean,
   *       anomaly_score: number (0-1),
   *       severity: "low"|"medium"|"high",
   *       explanation: string
   *     }
   *   ],
   *   total_checked: number,
   *   anomalies_found: number
   * }
   */
  async detect(companyId, transactions) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/detect`,
        {
          companyId,
          transactions: transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount,
            date: tx.date || tx.occurredAt,
            categoryId: tx.categoryId
          }))
        },
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('[AnomalyDetectorClient] Service unavailable, skipping anomaly detection');
        // Fallback gracieux
        return {
          anomalies: [],
          total_checked: transactions.length,
          anomalies_found: 0
        };
      }

      console.error('[AnomalyDetectorClient] Error:', error.message);
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Entraîne un modèle pour une catégorie
   *
   * @param {number} companyId
   * @param {number} categoryId
   * @param {Array<Object>} transactions - Min 50 transactions
   * @param {boolean} forceRetrain
   *
   * @returns {Promise<Object>} {
   *   success: boolean,
   *   company_id: number,
   *   category_id: number,
   *   samples_used: number,
   *   message: string
   * }
   */
  async train(companyId, categoryId, transactions, forceRetrain = false) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/train`,
        {
          companyId,
          categoryId,
          transactions: transactions.map(tx => ({
            amount: tx.amount,
            date: tx.date || tx.occurredAt
          })),
          force_retrain: forceRetrain
        },
        { timeout: 60000 } // 60s timeout pour training
      );

      // Clear cache après training
      this.clearCache(companyId, categoryId);

      return response.data;
    } catch (error) {
      console.error('[AnomalyDetectorClient] Training error:', error.message);
      throw new Error(`Training failed: ${error.message}`);
    }
  }

  /**
   * Récupère info sur le modèle
   */
  async getModelInfo(companyId, categoryId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/model/info/${companyId}/${categoryId}`,
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      console.error('[AnomalyDetectorClient] Model info error:', error.message);
      return { exists: false };
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
      console.error('[AnomalyDetectorClient] Health check failed:', error.message);
      return false;
    }
  }

  clearCache(companyId, categoryId) {
    const pattern = `anomaly:${companyId}:${categoryId}`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new AnomalyDetectorClient();
