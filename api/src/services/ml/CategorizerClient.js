const axios = require('axios');
const mlConfig = require('./config-loader');

class CategorizerClient {
  constructor() {
    this.baseUrl = process.env.ML_CATEGORIZER_URL || 'http://localhost:8002';
    this.cache = new Map();
    this.cacheTTL = 0; // No cache for real-time suggestions
    this.timeout = 5000;
    this.config = null; // Will be loaded from DB

    console.log(`CategorizerClient initialized: ${this.baseUrl}`);
    this.loadConfig(); // Load config asynchronously
  }

  /**
   * Load configuration from database
   */
  async loadConfig() {
    try {
      this.config = await mlConfig.getCategorizationConfig();
      console.log('[CategorizerClient] Config loaded from DB:', {
        confidenceThreshold: this.config.confidenceThreshold,
        cacheTTL: this.config.cacheTTL,
        trainingMinTransactions: this.config.trainingMinTransactions,
      });
    } catch (error) {
      console.error('[CategorizerClient] Error loading config, using defaults:', error.message);
      // Fallback to defaults if DB unavailable
      this.config = {
        confidenceThreshold: 60,
        cacheTTL: 300,
        trainingMinTransactions: 100,
        fallbackToGlobal: true,
        retrainFrequencyDays: 7,
        maxSuggestionsPerTransaction: 3,
        enableAutoCategorization: true,
        learningRate: 0.01,
      };
    }
  }

  /**
   * Get current confidence threshold from config
   */
  async getConfidenceThreshold() {
    if (!this.config) await this.loadConfig();
    return this.config.confidenceThreshold;
  }

  /**
   * Get training minimum transactions from config
   */
  async getTrainingMinTransactions() {
    if (!this.config) await this.loadConfig();
    return this.config.trainingMinTransactions;
  }

  /**
   * Suggère des catégories pour une transaction
   */
  async categorize(companyId, transaction) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/categorize?company_id=${companyId}`,
        {
          description: transaction.description || '',
          amount: transaction.amount,
          type: transaction.type,
          paymentFlowType: transaction.paymentFlowType || null
        },
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Pas de modèle entraîné
        console.warn(`No model for company ${companyId}, need training`);
        return {
          suggestions: [],
          recommended: null,
          model_info: { exists: false }
        };
      }

      console.error('[CategorizerClient] Error:', error.message);
      throw new Error(`Categorization failed: ${error.message}`);
    }
  }

  /**
   * Entraîne le modèle pour une société
   */
  async train(companyId, transactions, forceRetrain = false) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/train`,
        {
          companyId,
          transactions,
          force_retrain: forceRetrain
        },
        { timeout: 60000 } // 60s timeout pour training
      );

      // Clear cache après training
      this.clearCache(companyId);

      return response.data;
    } catch (error) {
      console.error('[CategorizerClient] Training error:', error.message);
      throw new Error(`Training failed: ${error.message}`);
    }
  }

  /**
   * Récupère info sur le modèle
   */
  async getModelInfo(companyId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/model/info/${companyId}`,
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      console.error('[CategorizerClient] Model info error:', error.message);
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
      console.error('[CategorizerClient] Health check failed:', error.message);
      return false;
    }
  }

  clearCache(companyId) {
    const pattern = `categorize:${companyId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new CategorizerClient();
