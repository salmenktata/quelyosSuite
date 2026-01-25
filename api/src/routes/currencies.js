/**
 * Currency Management Routes
 */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../../logger");
const {
  CURRENCY_CODES,
  updateExchangeRates,
  getExchangeRate,
  getCompanyBaseCurrency,
  getUserDisplayCurrency,
  updateCompanyRatesIfNeeded,
  convertCurrency,
} = require("../utils/currency");

/**
 * GET /currencies
 * List all supported currencies
 */
router.get("/", (req, res) => {
  res.json({
    currencies: CURRENCY_CODES,
    defaultCurrency: "EUR",
  });
});

/**
 * GET /exchange-rates
 * Get current exchange rates for company's base currency
 */
router.get("/exchange-rates", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const baseCurrency = await getCompanyBaseCurrency(companyId);

    // Trigger update if needed
    void updateCompanyRatesIfNeeded(companyId).catch((error) => {
      logger.warn("Exchange rate auto-update failed:", error);
    });

    // Get latest rates from database
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let rates = await prisma.exchangeRate.findMany({
      where: {
        fromCurrency: baseCurrency,
        date: today,
      },
      orderBy: {
        toCurrency: "asc",
      },
    });

    let effectiveDate = today;
    if (rates.length === 0) {
      const latest = await prisma.exchangeRate.findFirst({
        where: { fromCurrency: baseCurrency },
        orderBy: { date: "desc" },
        select: { date: true },
      });

      if (latest?.date) {
        effectiveDate = latest.date;
        rates = await prisma.exchangeRate.findMany({
          where: {
            fromCurrency: baseCurrency,
            date: latest.date,
          },
          orderBy: {
            toCurrency: "asc",
          },
        });
      }
    }

    // Transform to object format { USD: 1.10, GBP: 0.85, ... }
    const ratesObject = {};
    rates.forEach((rate) => {
      ratesObject[rate.toCurrency] = rate.rate;
    });

    // Add base currency with rate 1.0
    ratesObject[baseCurrency] = 1.0;

    res.json({
      baseCurrency,
      date: effectiveDate.toISOString().split("T")[0],
      rates: ratesObject,
      count: rates.length + 1,
    });
  } catch (error) {
    logger.error("Failed to fetch exchange rates:", error);
    res.status(500).json({ error: "Failed to fetch exchange rates" });
  }
});

/**
 * POST /exchange-rates/update
 * Manually trigger exchange rate update
 */
router.post("/exchange-rates/update", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const baseCurrency = await getCompanyBaseCurrency(companyId);

    const count = await updateExchangeRates(baseCurrency);

    // Update last update timestamp
    await prisma.companySettings.update({
      where: { companyId },
      data: { lastRateUpdate: new Date() },
    });

    res.json({
      success: true,
      message: `Updated ${count} exchange rates`,
      baseCurrency,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to update exchange rates:", error);
    res.status(500).json({ error: "Failed to update exchange rates" });
  }
});

/**
 * GET /exchange-rates/history
 * Get historical exchange rates
 */
router.get("/exchange-rates/history", auth, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, days = 30 } = req.query;
    const companyId = req.user.companyId;

    const from = fromCurrency || (await getCompanyBaseCurrency(companyId));
    const to = toCurrency || "USD";

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const rates = await prisma.exchangeRate.findMany({
      where: {
        fromCurrency: from,
        toCurrency: to,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        rate: true,
      },
    });

    res.json({
      fromCurrency: from,
      toCurrency: to,
      period: {
        from: startDate.toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
      rates: rates.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        rate: r.rate,
      })),
    });
  } catch (error) {
    logger.error("Failed to fetch exchange rate history:", error);
    res.status(500).json({ error: "Failed to fetch exchange rate history" });
  }
});

/**
 * POST /convert
 * Convert amount between currencies
 */
router.post("/convert", auth, async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        error: "Missing required fields: amount, fromCurrency, toCurrency",
      });
    }

    const converted = await convertCurrency(
      parseFloat(amount),
      fromCurrency,
      toCurrency
    );

    const rate = await getExchangeRate(fromCurrency, toCurrency);

    res.json({
      original: {
        amount: parseFloat(amount),
        currency: fromCurrency,
      },
      converted: {
        amount: converted,
        currency: toCurrency,
      },
      rate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Currency conversion failed:", error);
    res.status(500).json({ error: "Currency conversion failed" });
  }
});

/**
 * GET /user/currency-preference
 * Get user's currency preference
 */
router.get("/user/currency-preference", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const displayCurrency = await getUserDisplayCurrency(userId);
    const baseCurrency = await getCompanyBaseCurrency(req.user.companyId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayCurrency: true },
    });

    res.json({
      displayCurrency,
      baseCurrency,
      isCustom: !!user.displayCurrency,
    });
  } catch (error) {
    logger.error("Failed to fetch user currency preference:", error);
    res.status(500).json({ error: "Failed to fetch currency preference" });
  }
});

/**
 * PUT /user/currency-preference
 * Update user's currency preference
 */
router.put("/user/currency-preference", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currency } = req.body;

    // Debug logging
    console.log("[DEBUG] Currency preference update:", {
      userId,
      currency,
      bodyType: typeof currency,
      body: req.body,
    });

    if (!currency) {
      console.log("[DEBUG] Currency is missing/empty");
      return res.status(400).json({ error: "Currency code is required" });
    }

    // Validate currency code
    const validCurrency = CURRENCY_CODES.find((c) => c.code === currency);
    if (!validCurrency) {
      console.log("[DEBUG] Invalid currency code:", currency);
      console.log("[DEBUG] Valid codes:", CURRENCY_CODES.map((c) => c.code));
      return res.status(400).json({ error: "Invalid currency code" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { displayCurrency: currency },
    });

    res.json({
      success: true,
      displayCurrency: currency,
      message: `Currency preference updated to ${currency}`,
    });
  } catch (error) {
    logger.error("Failed to update currency preference:", error);
    res.status(500).json({ error: "Failed to update currency preference" });
  }
});

/**
 * GET /company/currency-settings
 * Get company currency settings
 */
router.get("/company/currency-settings", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    let settings = await prisma.companySettings.findUnique({
      where: { companyId },
      select: {
        baseCurrency: true,
        autoUpdateRates: true,
        lastRateUpdate: true,
      },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyId,
          baseCurrency: "EUR",
          autoUpdateRates: true,
        },
        select: {
          baseCurrency: true,
          autoUpdateRates: true,
          lastRateUpdate: true,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    logger.error("Failed to fetch company currency settings:", error);
    res.status(500).json({ error: "Failed to fetch currency settings" });
  }
});

/**
 * PUT /company/currency-settings
 * Update company currency settings (ADMIN only)
 */
router.put("/company/currency-settings", auth, async (req, res) => {
  try {
    // Only ADMIN or SUPERADMIN can change company settings
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const companyId = req.user.companyId;
    const { baseCurrency, autoUpdateRates } = req.body;

    const updateData = {};

    if (baseCurrency) {
      const validCurrency = CURRENCY_CODES.find((c) => c.code === baseCurrency);
      if (!validCurrency) {
        return res.status(400).json({ error: "Invalid currency code" });
      }
      updateData.baseCurrency = baseCurrency;
    }

    if (typeof autoUpdateRates === "boolean") {
      updateData.autoUpdateRates = autoUpdateRates;
    }

    const settings = await prisma.companySettings.upsert({
      where: { companyId },
      update: updateData,
      create: {
        companyId,
        baseCurrency: baseCurrency || "EUR",
        autoUpdateRates: autoUpdateRates !== undefined ? autoUpdateRates : true,
      },
    });

    // If base currency changed, trigger rate update
    if (baseCurrency) {
      await updateExchangeRates(baseCurrency);
      await prisma.companySettings.update({
        where: { companyId },
        data: { lastRateUpdate: new Date() },
      });
    }

    res.json({
      success: true,
      settings,
      message: "Currency settings updated",
    });
  } catch (error) {
    logger.error("Failed to update company currency settings:", error);
    res.status(500).json({ error: "Failed to update currency settings" });
  }
});

module.exports = router;
