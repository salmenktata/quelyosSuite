const axios = require('axios');

/**
 * Client for communicating with the Python Prophet forecasting service
 * Handles forecast generation with caching for performance
 */
class ProphetClient {
  constructor() {
    this.baseUrl = process.env.PROPHET_SERVICE_URL || 'http://localhost:8001';
    this.cache = new Map(); // In-memory cache
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.timeout = 10000; // 10 second timeout

    console.log(`ProphetClient initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Generate forecast using Prophet service
   *
   * @param {Array} historicalTransactions - Array of transaction objects with occurredAt, type, amount
   * @param {number} horizonDays - Number of days to forecast (default: 365)
   * @param {Array} confidenceLevels - Confidence interval levels (default: [0.8, 0.95])
   * @returns {Promise<Object>} - Prophet forecast response
   */
  async forecast(historicalTransactions, horizonDays = 365, confidenceLevels = [0.8, 0.95]) {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(historicalTransactions, horizonDays);

      // Check cache (24h TTL)
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`[ProphetClient] Cache hit for ${horizonDays}-day forecast`);
        return cached.data;
      }

      console.log(`[ProphetClient] Cache miss - generating new forecast for ${horizonDays} days`);

      // Prepare data for Prophet
      const historicalData = this.prepareData(historicalTransactions);

      if (historicalData.length < 30) {
        throw new Error(
          `Insufficient historical data for Prophet forecasting. Required: 30 days, Available: ${historicalData.length} days`
        );
      }

      // Call Python Prophet service
      const startTime = Date.now();
      const response = await axios.post(
        `${this.baseUrl}/forecast`,
        {
          historical_data: historicalData,
          horizon_days: horizonDays,
          confidence_levels: confidenceLevels
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const duration = Date.now() - startTime;
      console.log(`[ProphetClient] Forecast generated in ${duration}ms`);

      // Cache the result
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        // Prophet service returned an error
        console.error(`[ProphetClient] Prophet service error: ${error.response.status}`, error.response.data);
        throw new Error(`Prophet forecasting failed: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        // Prophet service not reachable
        console.error(`[ProphetClient] Prophet service unreachable at ${this.baseUrl}`);
        throw new Error(
          `Prophet service unreachable. Ensure the service is running at ${this.baseUrl}. Error: ${error.message}`
        );
      } else {
        // Other error
        console.error(`[ProphetClient] Unexpected error:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Prepare transaction data for Prophet
   * Converts transactions into daily balance time series
   *
   * @param {Array} transactions - Array of transactions
   * @returns {Array} - Array of {date, balance} objects
   */
  prepareData(transactions) {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Group transactions by date and calculate running balance
    const dailyBalances = {};
    let balance = 0;

    // Sort transactions by date
    const sortedTransactions = transactions
      .filter(tx => tx.occurredAt) // Filter out transactions without dates
      .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));

    sortedTransactions.forEach(tx => {
      const date = new Date(tx.occurredAt).toISOString().split('T')[0]; // YYYY-MM-DD

      // Update running balance
      if (tx.type === 'credit') {
        balance += tx.amount;
      } else if (tx.type === 'debit') {
        balance -= tx.amount;
      }

      // Store daily balance (last balance of the day if multiple transactions)
      dailyBalances[date] = balance;
    });

    // Convert to Prophet format: array of {date, balance}
    const historicalData = Object.entries(dailyBalances).map(([date, balance]) => ({
      date,
      balance
    }));

    console.log(
      `[ProphetClient] Prepared ${historicalData.length} days of historical data (${historicalData[0]?.date} to ${
        historicalData[historicalData.length - 1]?.date
      })`
    );

    return historicalData;
  }

  /**
   * Generate cache key from transactions and horizon
   *
   * @param {Array} transactions - Transactions array
   * @param {number} horizonDays - Forecast horizon
   * @returns {string} - Cache key
   */
  generateCacheKey(transactions, horizonDays) {
    // Use first/last transaction dates and count as cache key
    // This is a simple heuristic - if transactions change, key changes
    if (!transactions || transactions.length === 0) {
      return `forecast:empty:${horizonDays}`;
    }

    const firstDate = transactions[0]?.occurredAt || '';
    const lastDate = transactions[transactions.length - 1]?.occurredAt || '';
    const count = transactions.length;

    return `forecast:${firstDate}:${lastDate}:${count}:${horizonDays}`;
  }

  /**
   * Clear the forecast cache
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[ProphetClient] Cleared ${size} cached forecasts`);
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} - Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      ttl_hours: this.cacheTTL / (60 * 60 * 1000)
    };
  }

  /**
   * Run backtesting validation on Prophet model
   *
   * @param {Array} historicalTransactions - Array of transaction objects (min 365 days)
   * @param {number} horizonDays - Forecast horizon to validate (default: 90)
   * @returns {Promise<Object>} - Backtesting metrics (MAE, RMSE, MAPE, coverage)
   */
  async backtest(historicalTransactions, horizonDays = 90) {
    try {
      console.log(`[ProphetClient] Running backtesting for ${horizonDays}-day horizon`);

      const historicalData = this.prepareData(historicalTransactions);

      if (historicalData.length < 365) {
        throw new Error(
          `Insufficient data for backtesting. Required: 365 days (12 months), Available: ${historicalData.length} days`
        );
      }

      // Call Python Prophet backtesting service
      const startTime = Date.now();
      const response = await axios.post(
        `${this.baseUrl}/backtest`,
        {
          historical_data: historicalData,
          horizon_days: horizonDays
        },
        {
          timeout: 60000, // 60s timeout (backtesting is computationally intensive)
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const duration = Date.now() - startTime;
      console.log(`[ProphetClient] Backtesting complete in ${duration}ms`);

      return response.data;
    } catch (error) {
      if (error.response) {
        // Prophet service returned an error
        console.error(
          `[ProphetClient] Backtesting failed: ${error.response.status}`,
          error.response.data
        );
        throw new Error(`Backtesting failed: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        // Prophet service not reachable
        console.error(`[ProphetClient] Prophet service unreachable at ${this.baseUrl}`);
        throw new Error(
          `Prophet service unreachable. Ensure the service is running at ${this.baseUrl}. Error: ${error.message}`
        );
      } else {
        // Other error
        console.error(`[ProphetClient] Backtesting error:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Health check - verify Prophet service is reachable
   *
   * @returns {Promise<boolean>} - True if service is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return response.data.status === 'healthy';
    } catch (error) {
      console.error(`[ProphetClient] Health check failed:`, error.message);
      return false;
    }
  }
}

// Singleton instance
module.exports = new ProphetClient();
