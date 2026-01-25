/**
 * Multi-Currency Support Utilities
 *
 * Provides currency conversion, exchange rate fetching, and caching
 */

const logger = require("../../logger");
const prisma = require("../../prismaClient");

// Free API: https://exchangerate-api.io (1500 req/month free)
// Alternative: https://api.exchangerate-api.com/v4/latest/{currency}
const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest";
const DEFAULT_EXCHANGE_RATE_TIMEOUT_MS = Number.parseInt(
  process.env.EXCHANGE_RATE_TIMEOUT_MS,
  10
);
const EXCHANGE_RATE_TIMEOUT_MS = Number.isFinite(DEFAULT_EXCHANGE_RATE_TIMEOUT_MS)
  ? DEFAULT_EXCHANGE_RATE_TIMEOUT_MS
  : 5000;

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error(`Exchange rate API timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch latest exchange rates from external API
 * @param {string} baseCurrency - Base currency code (e.g., "EUR")
 * @returns {Promise<Object>} - Exchange rates object { USD: 1.10, GBP: 0.85, ... }
 */
async function fetchExchangeRatesFromAPI(baseCurrency = "EUR") {
  try {
    const response = await fetchWithTimeout(
      `${EXCHANGE_RATE_API}/${baseCurrency}`,
      EXCHANGE_RATE_TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates) {
      throw new Error("Invalid exchange rate API response");
    }

    return {
      base: data.base,
      date: data.date,
      rates: data.rates,
    };
  } catch (error) {
    logger.error("Failed to fetch exchange rates from API:", error);
    throw error;
  }
}

/**
 * Update exchange rates in database from API
 * @param {string} baseCurrency - Base currency code
 * @returns {Promise<number>} - Number of rates updated
 */
async function updateExchangeRates(baseCurrency = "EUR") {
  try {
    const apiData = await fetchExchangeRatesFromAPI(baseCurrency);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    let updatedCount = 0;

    // Store each exchange rate
    for (const [toCurrency, rate] of Object.entries(apiData.rates)) {
      await prisma.exchangeRate.upsert({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: baseCurrency,
            toCurrency: toCurrency,
            date: today,
          },
        },
        update: {
          rate: rate,
          source: "api",
          updatedAt: new Date(),
        },
        create: {
          fromCurrency: baseCurrency,
          toCurrency: toCurrency,
          rate: rate,
          date: today,
          source: "api",
        },
      });
      updatedCount++;
    }

    logger.info(`Updated ${updatedCount} exchange rates for ${baseCurrency}`);
    return updatedCount;
  } catch (error) {
    logger.error("Failed to update exchange rates:", error);
    throw error;
  }
}

/**
 * Get exchange rate from database (with fallback to API)
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Date} date - Date for exchange rate (defaults to today)
 * @returns {Promise<number>} - Exchange rate
 */
async function getExchangeRate(fromCurrency, toCurrency, date = new Date()) {
  // Same currency = rate 1.0
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  // Normalize date to midnight
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  try {
    // Try to get rate from database
    let exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        date: normalizedDate,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (exchangeRate) {
      return exchangeRate.rate;
    }

    // If not found, try to fetch latest rates and retry
    logger.info(`Exchange rate ${fromCurrency} → ${toCurrency} not found, fetching from API`);
    await updateExchangeRates(fromCurrency);

    exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        date: normalizedDate,
      },
    });

    if (exchangeRate) {
      return exchangeRate.rate;
    }

    // If still not found, try reverse rate (1 / rate)
    const reverseRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: toCurrency,
        toCurrency: fromCurrency,
        date: normalizedDate,
      },
    });

    if (reverseRate) {
      return 1 / reverseRate.rate;
    }

    throw new Error(`Exchange rate not available for ${fromCurrency} → ${toCurrency}`);
  } catch (error) {
    logger.error("Failed to get exchange rate:", error);
    throw error;
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Date} date - Date for exchange rate (defaults to today)
 * @returns {Promise<number>} - Converted amount
 */
async function convertCurrency(amount, fromCurrency, toCurrency, date = new Date()) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency, date);
  return amount * rate;
}

/**
 * Get company's base currency from settings
 * @param {number} companyId - Company ID
 * @returns {Promise<string>} - Base currency code (defaults to "EUR")
 */
async function getCompanyBaseCurrency(companyId) {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { companyId },
      select: { baseCurrency: true },
    });

    return settings?.baseCurrency || "EUR";
  } catch (error) {
    logger.warn(`Failed to get company base currency, defaulting to EUR:`, error);
    return "EUR";
  }
}

/**
 * Get user's display currency preference
 * @param {number} userId - User ID
 * @returns {Promise<string>} - Display currency code (falls back to company base currency)
 */
async function getUserDisplayCurrency(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayCurrency: true,
        companyId: true,
      },
    });

    if (!user) {
      return "EUR";
    }

    // If user has preference, use it
    if (user.displayCurrency) {
      return user.displayCurrency;
    }

    // Otherwise, use company base currency
    return await getCompanyBaseCurrency(user.companyId);
  } catch (error) {
    logger.warn(`Failed to get user display currency, defaulting to EUR:`, error);
    return "EUR";
  }
}

/**
 * Convert array of amounts to target currency
 * @param {Array<{amount: number, currency: string}>} items - Array of items with amount and currency
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<number>} - Total converted amount
 */
async function convertMultipleCurrencies(items, targetCurrency) {
  let total = 0;

  for (const item of items) {
    const converted = await convertCurrency(item.amount, item.currency, targetCurrency);
    total += converted;
  }

  return total;
}

/**
 * Check if exchange rates need updating (older than 24h)
 * @param {number} companyId - Company ID
 * @returns {Promise<boolean>} - True if rates need updating
 */
async function needsRateUpdate(companyId) {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { companyId },
      select: {
        autoUpdateRates: true,
        lastRateUpdate: true,
      },
    });

    // If auto-update is disabled, don't update
    if (!settings?.autoUpdateRates) {
      return false;
    }

    // If never updated, need update
    if (!settings.lastRateUpdate) {
      return true;
    }

    // Check if last update was more than 24h ago
    const hoursSinceUpdate = (Date.now() - settings.lastRateUpdate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate >= 24;
  } catch (error) {
    logger.warn("Failed to check rate update status:", error);
    return false;
  }
}

/**
 * Update company exchange rates if needed
 * @param {number} companyId - Company ID
 * @returns {Promise<boolean>} - True if rates were updated
 */
async function updateCompanyRatesIfNeeded(companyId) {
  try {
    if (!(await needsRateUpdate(companyId))) {
      return false;
    }

    const baseCurrency = await getCompanyBaseCurrency(companyId);
    await updateExchangeRates(baseCurrency);

    // Update last update timestamp
    await prisma.companySettings.update({
      where: { companyId },
      data: { lastRateUpdate: new Date() },
    });

    return true;
  } catch (error) {
    logger.error("Failed to update company exchange rates:", error);
    return false;
  }
}

// List of common currency codes
const CURRENCY_CODES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  // Maghreb currencies
  { code: "TND", symbol: "د.ت", name: "Tunisian Dinar" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "DZD", symbol: "د.ج", name: "Algerian Dinar" },
];

module.exports = {
  fetchExchangeRatesFromAPI,
  updateExchangeRates,
  getExchangeRate,
  convertCurrency,
  convertMultipleCurrencies,
  getCompanyBaseCurrency,
  getUserDisplayCurrency,
  needsRateUpdate,
  updateCompanyRatesIfNeeded,
  CURRENCY_CODES,
};
