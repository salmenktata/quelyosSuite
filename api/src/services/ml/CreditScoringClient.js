const axios = require('axios');
const mlConfig = require('./config-loader');

/**
 * Client HTTP pour le service ML de credit scoring
 *
 * Pattern: Singleton with DB config
 * Service Python: credit-scoring (port 8006)
 */
class CreditScoringClient {
  constructor() {
    this.baseUrl = process.env.ML_CREDIT_SCORING_URL || 'http://localhost:8006';
    this.cache = new Map();
    this.cacheTTL = 2592000000; // Default 30 days cache, will be overridden from DB
    this.timeout = 10000; // 10s timeout
    this.config = null; // Will be loaded from DB

    console.log(`CreditScoringClient initialized: ${this.baseUrl}`);
    this.loadConfig(); // Load config asynchronously
  }

  /**
   * Load configuration from database
   */
  async loadConfig() {
    try {
      this.config = await mlConfig.getCreditScoringConfig();
      this.cacheTTL = this.config.cacheValidityDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      console.log('[CreditScoringClient] Config loaded from DB:', {
        riskThresholds: {
          low: this.config.riskThresholdLowMax,
          medium: this.config.riskThresholdMediumMax,
          high: this.config.riskThresholdHighMax,
        },
        minInvoices: this.config.minInvoicesForScoring,
        lookbackMonths: this.config.lookbackMonths,
        cacheTTL: this.cacheTTL,
      });
    } catch (error) {
      console.error('[CreditScoringClient] Error loading config, using defaults:', error.message);
      // Fallback to defaults if DB unavailable
      this.config = {
        riskThresholdLowMax: 30,
        riskThresholdMediumMax: 60,
        riskThresholdHighMax: 85,
        minInvoicesForScoring: 3,
        lookbackMonths: 12,
        weightPaymentDelay: 40,
        weightLateRate: 30,
        weightRelationshipMonths: 20,
        weightPaymentConsistency: 10,
        cacheValidityDays: 30,
        autoSuspendCriticalRisk: false,
        alertOnRiskChange: true,
        paymentTermsDefault: 30,
        earlyPaymentBonus: 2,
        latePaymentPenalty: 10,
        modelVersion: '1.0',
      };
      this.cacheTTL = this.config.cacheValidityDays * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Scorer le risque de crédit d'un client basé sur son historique de factures
   *
   * @param {number} customerId
   * @param {number} companyId
   * @param {Array<Object>} invoices - Historique des factures
   * @param {number} invoices[].amount
   * @param {string} invoices[].dueDate - ISO format
   * @param {string} invoices[].paidDate - ISO format (null if unpaid)
   * @param {number} invoices[].paymentDelay - Days late (+ or -)
   * @param {string} invoices[].status - Invoice status
   *
   * @returns {Promise<Object>} {
   *   score: number (0-100),
   *   risk_level: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
   *   predicted_delay: number | null,
   *   confidence: number (0-100),
   *   features: object,
   *   recommendation: string,
   *   invoices_analyzed: number
   * }
   */
  async scoreCustomer(customerId, companyId, invoices) {
    try {
      // Check cache first
      const cacheKey = `credit:${companyId}:${customerId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`[CreditScoring] Cache hit for ${cacheKey}`);
        return cached.data;
      }

      // Validate minimum invoices
      if (invoices.length < 5) {
        console.warn(`[CreditScoring] Insufficient invoices for customer ${customerId}: ${invoices.length} < 5`);
        return null;
      }

      const response = await axios.post(
        `${this.baseUrl}/score-customer`,
        {
          customer_id: customerId,
          company_id: companyId,
          invoices: invoices.map(inv => ({
            amount: inv.amount,
            dueDate: inv.dueDate,
            paidDate: inv.paidDate || null,
            paymentDelay: inv.paymentDelay !== undefined ? inv.paymentDelay : null,
            status: inv.status
          }))
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
        console.warn('[CreditScoring] Service unavailable, skipping credit scoring');
        // Graceful fallback - return null
        return null;
      }

      if (error.response?.status === 400) {
        console.warn('[CreditScoring] Validation error:', error.response.data?.detail);
        return null;
      }

      console.error('[CreditScoring] Error:', error.message);
      throw new Error(`Credit scoring failed: ${error.message}`);
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
      console.error('[CreditScoring] Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Clear cache for a specific customer
   */
  clearCache(companyId, customerId) {
    const cacheKey = `credit:${companyId}:${customerId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }
}

module.exports = new CreditScoringClient();
