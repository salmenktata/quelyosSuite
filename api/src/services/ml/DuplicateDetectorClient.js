const axios = require('axios');
const mlConfig = require('./config-loader');

/**
 * Client HTTP pour le service ML de détection de doublons
 *
 * Pattern: Singleton with DB config
 * Service Python: ml-duplicate-detector (port 8004)
 */
class DuplicateDetectorClient {
  constructor() {
    this.baseUrl = process.env.ML_DUPLICATE_URL || 'http://localhost:8004';
    this.timeout = 3000; // 3s timeout (operation rapide, pas de ML training)
    this.config = null; // Will be loaded from DB

    console.log(`DuplicateDetectorClient initialized: ${this.baseUrl}`);
    this.loadConfig(); // Load config asynchronously
  }

  /**
   * Load configuration from database
   */
  async loadConfig() {
    try {
      this.config = await mlConfig.getDuplicateConfig();
      console.log('[DuplicateDetectorClient] Config loaded from DB:', {
        similarityThreshold: this.config.similarityThreshold,
        weights: {
          description: this.config.weightDescription,
          amount: this.config.weightAmount,
          date: this.config.weightDate,
        },
        dateWindowDays: this.config.dateWindowDays,
      });
    } catch (error) {
      console.error('[DuplicateDetectorClient] Error loading config, using defaults:', error.message);
      // Fallback to defaults if DB unavailable
      this.config = {
        similarityThreshold: 75,
        weightDescription: 60,
        weightAmount: 20,
        weightDate: 20,
        dateWindowDays: 7,
        amountTolerancePercent: 5,
        autoFlagThreshold: 90,
        fuzzyMatchingEnabled: true,
        caseSensitive: false,
        ignoreWhitespace: true,
      };
    }
  }

  /**
   * Vérifie si une transaction est potentiellement un doublon
   *
   * @param {Object} transaction - Nouvelle transaction à vérifier
   * @param {string} transaction.description
   * @param {number} transaction.amount
   * @param {string} transaction.date - ISO format YYYY-MM-DD
   * @param {number} transaction.accountId
   * @param {Array<Object>} existingTransactions - Transactions du même compte (30 derniers jours)
   * @param {number} [maxDaysDiff=30] - Différence max en jours
   *
   * @returns {Promise<Object>} {
   *   is_likely_duplicate: boolean,
   *   matches: [
   *     {
   *       transactionId: number,
   *       description: string,
   *       amount: number,
   *       date: string,
   *       similarity_score: number (0-1),
   *       description_similarity: number,
   *       amount_proximity: number,
   *       date_proximity: number
   *     }
   *   ],
   *   threshold_used: number
   * }
   */
  async checkDuplicates(transaction, existingTransactions, maxDaysDiff = 30) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/find-duplicates`,
        {
          transaction: {
            accountId: transaction.accountId,
            description: transaction.description || '',
            amount: transaction.amount,
            date: transaction.date
          },
          existing_transactions: existingTransactions.map(tx => ({
            id: tx.id,
            description: tx.description || '',
            amount: tx.amount,
            date: tx.occurredAt || tx.date // Support occurredAt ou date
          })),
          max_days_diff: maxDaysDiff
        },
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('[DuplicateDetectorClient] Service unavailable, skipping duplicate check');
        // Fallback gracieux: pas de doublons détectés
        return {
          is_likely_duplicate: false,
          matches: [],
          threshold_used: 0.75
        };
      }

      console.error('[DuplicateDetectorClient] Error:', error.message);
      throw new Error(`Duplicate check failed: ${error.message}`);
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
      console.error('[DuplicateDetectorClient] Health check failed:', error.message);
      return false;
    }
  }
}

module.exports = new DuplicateDetectorClient();
