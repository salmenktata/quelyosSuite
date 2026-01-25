const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { getOrCreateVatSettings, toDisplay } = require("../utils/vat");
const prophetClient = require("../services/forecasting/ProphetClient");
const eventDetector = require("../services/forecasting/EventDetector");

function normalizeDate(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function dateKey(d) {
  return normalizeDate(d).toISOString().slice(0, 10);
}

function clampHorizon(value, min, max, fallback) {
  const v = Number(value);
  if (Number.isFinite(v)) return Math.min(Math.max(v, min), max);
  return fallback;
}

async function resolveAccountIds({ companyId, portfolioId, accountId }) {
  // Retourne la liste des comptes filtrés par company + portfolio/account
  const accountWhere = { companyId };
  if (accountId) {
    accountWhere.id = Number(accountId);
  }

  let accountIds = [];
  if (portfolioId) {
    const pid = Number(portfolioId);
    // comptes associés en direct ou via table de relation
    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        OR: [
          { portfolioId: pid },
          { portfolios: { some: { portfolioId: pid } } },
        ],
      },
      select: { id: true },
    });
    accountIds = accounts.map((a) => a.id);
    if (accountId && !accountIds.includes(Number(accountId))) {
      // Si l'utilisateur force un compte non lié au portfolio, on laisse vide pour cohérence
      accountIds = [];
    }
  } else {
    const accounts = await prisma.account.findMany({ where: accountWhere, select: { id: true } });
    accountIds = accounts.map((a) => a.id);
  }
  return accountIds;
}

function groupDates(range, groupBy) {
  const buckets = [];
  const cursor = normalizeDate(range.from);
  const end = normalizeDate(range.to);
  while (cursor <= end) {
    buckets.push(dateKey(cursor));
    if (groupBy === "month") {
      cursor.setMonth(cursor.getMonth() + 1);
      cursor.setDate(1);
    } else if (groupBy === "week") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return buckets;
}

function emptyDaily(keys) {
  return keys.reduce((acc, k) => {
    acc[k] = { date: k, credit: 0, debit: 0, plannedCredit: 0, plannedDebit: 0 };
    return acc;
  }, {});
}

function within(date, range) {
  const d = normalizeDate(date).getTime();
  return d >= normalizeDate(range.from).getTime() && d <= normalizeDate(range.to).getTime();
}

function makeRange({ from, to, daysFallback }) {
  if (from && to) return { from: normalizeDate(from), to: normalizeDate(to) };
  const toDate = normalizeDate(new Date());
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - (daysFallback - 1));
  return { from: fromDate, to: toDate };
}

async function fetchTransactions({ companyId, accountIds, includeCategories = false, paymentFlowId = null }) {
  const where = {
    archived: false,
    accountId: { in: accountIds.length > 0 ? accountIds : [0] },
    account: { companyId, status: "ACTIVE" },
  };
  
  // Filtrer par flux de paiement si spécifié
  if (paymentFlowId) {
    where.paymentFlowId = Number(paymentFlowId);
  }
  
  return prisma.transaction.findMany({
    where,
    include: {
      account: { select: { id: true, name: true } },
      category: includeCategories ? { select: { id: true, name: true, kind: true } } : false,
      paymentFlow: { select: { id: true, name: true, type: true } },
    },
  });
}

// ------- ACTUALS -------
router.get("/actuals", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const groupBy = ["day", "week", "month"].includes(req.query.groupBy) ? req.query.groupBy : "day";
    const range = makeRange({ from: req.query.from, to: req.query.to, daysFallback: clampHorizon(req.query.days, 1, 365, 30) });
    const paymentFlowId = req.query.paymentFlowId ? Number(req.query.paymentFlowId) : null;

    const accountIds = await resolveAccountIds({ companyId, portfolioId: req.query.portfolioId, accountId: req.query.accountId });
    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds, includeCategories: true, paymentFlowId })).map((t) => toDisplay(t, settings));

    const baseBalance = txs.reduce((sum, t) => {
      if (t.status !== "CONFIRMED") return sum;
      if (normalizeDate(t.occurredAt) < range.from) {
        return sum + (t.type === "credit" ? t.amount : -t.amount);
      }
      return sum;
    }, 0);

    const keys = groupDates(range, groupBy);
    const daily = emptyDaily(keys);
    const perAccountMap = new Map();
    const catIncome = new Map();
    const catExpense = new Map();

    txs.forEach((t) => {
      if (t.status !== "CONFIRMED") return;
      if (!within(t.occurredAt, range)) return;
      const key = groupBy === "month" ? t.occurredAt.slice(0, 7) : dateKey(t.occurredAt);
      const delta = t.type === "credit" ? t.amount : -t.amount;
      const bucket = daily[key];
      if (!bucket) return;
      if (t.type === "credit") bucket.credit += t.amount; else bucket.debit += t.amount;

      if (!perAccountMap.has(t.accountId)) {
        perAccountMap.set(t.accountId, {
          accountId: t.accountId,
          accountName: t.account?.name || `Compte #${t.accountId}`,
          baseBalance: 0,
          endBalance: 0,
          totalCredit: 0,
          totalDebit: 0,
          daily: emptyDaily(keys),
        });
      }
      const acc = perAccountMap.get(t.accountId);
      if (normalizeDate(t.occurredAt) < range.from) {
        acc.baseBalance += delta;
      } else {
        if (t.type === "credit") acc.totalCredit += t.amount; else acc.totalDebit += t.amount;
        acc.daily[key].credit += t.type === "credit" ? t.amount : 0;
        acc.daily[key].debit += t.type === "debit" ? t.amount : 0;
      }

      if (t.category) {
        const map = t.category.kind === "INCOME" ? catIncome : catExpense;
        if (!map.has(t.category.id || 0)) {
          map.set(t.category.id || 0, { categoryId: t.category.id, name: t.category.name || "Non catégorisé", total: 0 });
        }
        const entry = map.get(t.category.id || 0);
        entry.total += t.amount * (t.category.kind === "INCOME" ? 1 : 1); // montant positif affiché
      }
    });

    // Cumuls
    let running = baseBalance;
    const dailyList = keys.map((k) => {
      const row = daily[k];
      const net = row.credit - row.debit;
      running += net;
      return { ...row, balance: running };
    });

    perAccountMap.forEach((acc) => {
      let r = acc.baseBalance;
      acc.daily = keys.map((k) => {
        const row = acc.daily[k];
        const net = row.credit - row.debit;
        r += net;
        return { ...row, balance: r };
      });
      acc.endBalance = r;
    });

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      baseBalance,
      endBalance: running,
      totalCredit: dailyList.reduce((s, d) => s + d.credit, 0),
      totalDebit: dailyList.reduce((s, d) => s + d.debit, 0),
      net: running - baseBalance,
      daily: dailyList,
      perAccount: Array.from(perAccountMap.values()),
      categoryTotals: {
        income: Array.from(catIncome.values()).sort((a, b) => b.total - a.total),
        expense: Array.from(catExpense.values()).sort((a, b) => b.total - a.total),
      },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting actuals failed" });
  }
});

// ------- FORECAST -------
router.get("/forecast", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const horizonDays = clampHorizon(req.query.horizonDays, 1, 180, 30);
    const from = normalizeDate(req.query.from || new Date());
    const to = new Date(from);
    to.setDate(to.getDate() + horizonDays);
    const groupBy = ["day", "week"].includes(req.query.groupBy) ? req.query.groupBy : "day";
    const paymentFlowId = req.query.paymentFlowId ? Number(req.query.paymentFlowId) : null;

    const accountIds = await resolveAccountIds({ companyId, portfolioId: req.query.portfolioId, accountId: req.query.accountId });
    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds, paymentFlowId })).map((t) => toDisplay(t, settings));

    const baseBalance = txs.reduce((sum, t) => {
      if (t.status !== "CONFIRMED") return sum;
      if (normalizeDate(t.occurredAt) < from) {
        return sum + (t.type === "credit" ? t.amount : -t.amount);
      }
      return sum;
    }, 0);

    const range = { from, to };
    const keys = groupDates(range, groupBy);
    const daily = emptyDaily(keys);
    const perAccountMap = new Map();

    txs.forEach((t) => {
      const isPlanned = t.status === "PLANNED" || t.status === "SCHEDULED";
      const effectiveDate = isPlanned ? t.scheduledFor || t.occurredAt : t.occurredAt;
      if (!effectiveDate) return;
      if (!within(effectiveDate, range)) return;
      const key = groupBy === "week" ? dateKey(effectiveDate) : dateKey(effectiveDate);
      const bucket = daily[key];
      if (!bucket) return;
      if (t.type === "credit") {
        if (isPlanned) bucket.plannedCredit += t.amount; else bucket.credit += t.amount;
      } else {
        if (isPlanned) bucket.plannedDebit += t.amount; else bucket.debit += t.amount;
      }

      if (!perAccountMap.has(t.accountId)) {
        perAccountMap.set(t.accountId, {
          accountId: t.accountId,
          accountName: t.account?.name || `Compte #${t.accountId}`,
          baseBalance: 0,
          projectedBalance: 0,
          daily: emptyDaily(keys),
        });
      }
      const acc = perAccountMap.get(t.accountId);
      if (t.status === "CONFIRMED" && normalizeDate(t.occurredAt) < from) {
        acc.baseBalance += t.type === "credit" ? t.amount : -t.amount;
      } else {
        const accBucket = acc.daily[key];
        if (t.type === "credit") {
          if (isPlanned) accBucket.plannedCredit += t.amount; else accBucket.credit += t.amount;
        } else {
          if (isPlanned) accBucket.plannedDebit += t.amount; else accBucket.debit += t.amount;
        }
      }
    });

    let running = baseBalance;
    const dailyList = keys.map((k) => {
      const row = daily[k];
      const net = row.credit - row.debit + row.plannedCredit - row.plannedDebit;
      running += net;
      return { ...row, projectedBalance: running, plannedNet: row.plannedCredit - row.plannedDebit };
    });

    perAccountMap.forEach((acc) => {
      let r = acc.baseBalance;
      acc.daily = keys.map((k) => {
        const row = acc.daily[k];
        const net = row.credit - row.debit + row.plannedCredit - row.plannedDebit;
        r += net;
        return { ...row, projectedBalance: r, plannedNet: row.plannedCredit - row.plannedDebit };
      });
      acc.projectedBalance = r;
    });

    const futureImpact = running - baseBalance;

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      days: horizonDays,
      baseBalance,
      projectedBalance: baseBalance + futureImpact,
      futureImpact,
      daily: dailyList,
      perAccount: Array.from(perAccountMap.values()),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting forecast failed" });
  }
});

// ------- FORECAST ENHANCED (with trend analysis) -------
router.get("/forecast-enhanced", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const horizonDays = clampHorizon(req.query.horizonDays, 1, 365, 30); // Extended to 365 days
    const historicalDays = clampHorizon(req.query.historicalDays, 7, 365, 90); // Extended historical window

    const today = normalizeDate(new Date());
    const historicalFrom = new Date(today);
    historicalFrom.setDate(historicalFrom.getDate() - historicalDays);

    const forecastTo = new Date(today);
    forecastTo.setDate(forecastTo.getDate() + horizonDays);

    const accountIds = await resolveAccountIds({ companyId, portfolioId: req.query.portfolioId, accountId: req.query.accountId });
    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds })).map((t) => toDisplay(t, settings));

    // Calculate current balance
    const currentBalance = txs.reduce((sum, t) => {
      if (t.status !== "CONFIRMED") return sum;
      if (normalizeDate(t.occurredAt) <= today) {
        return sum + (t.type === "credit" ? t.amount : -t.amount);
      }
      return sum;
    }, 0);

    // Analyze historical transactions
    const historicalTxs = txs.filter(t =>
      t.status === "CONFIRMED" &&
      normalizeDate(t.occurredAt) >= historicalFrom &&
      normalizeDate(t.occurredAt) <= today
    );

    const totalHistoricalCredit = historicalTxs
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalHistoricalDebit = historicalTxs
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate daily averages
    const avgDailyIncome = totalHistoricalCredit / historicalDays;
    const avgDailyExpense = totalHistoricalDebit / historicalDays;
    const avgDailyNet = avgDailyIncome - avgDailyExpense;

    // Get planned/scheduled transactions for future
    const plannedTxs = txs.filter(t =>
      (t.status === "PLANNED" || t.status === "SCHEDULED") &&
      normalizeDate(t.scheduledFor || t.occurredAt) > today &&
      normalizeDate(t.scheduledFor || t.occurredAt) <= forecastTo
    );

    // ========== PROPHET INTEGRATION ==========
    // Use Prophet for ML-based forecasting (if sufficient historical data)
    let forecastDaily = [];
    let runningBalance = currentBalance;
    let useProphet = historicalTxs.length >= 30; // Minimum 30 days for Prophet

    if (useProphet) {
      try {
        logger.info(`[Forecast] Using Prophet for ${horizonDays}-day forecast with ${historicalTxs.length} historical points`);

        // Call Prophet service
        const prophetResponse = await prophetClient.forecast(historicalTxs, horizonDays);

        // Combine Prophet predictions with planned transactions
        prophetResponse.predictions.forEach(pred => {
          const dateStr = pred.ds;

          // Find planned transactions for this date
          const dayPlanned = plannedTxs.filter(t =>
            dateKey(t.scheduledFor || t.occurredAt) === dateStr
          );

          const plannedCredit = dayPlanned
            .filter(t => t.type === "credit")
            .reduce((sum, t) => sum + t.amount, 0);

          const plannedDebit = dayPlanned
            .filter(t => t.type === "debit")
            .reduce((sum, t) => sum + t.amount, 0);

          const plannedNet = plannedCredit - plannedDebit;

          // Combine Prophet prediction with planned transactions
          const predicted = pred.yhat + plannedNet;

          forecastDaily.push({
            date: dateStr,
            predicted: predicted,
            projectedBalance: predicted, // Alias for backwards compatibility
            confidence80: {
              upper: pred.yhat_upper_80 + plannedNet,
              lower: pred.yhat_lower_80 + plannedNet
            },
            confidence95: {
              upper: pred.yhat_upper + plannedNet,
              lower: pred.yhat_lower + plannedNet
            },
            components: {
              trend: pred.trend,
              seasonal: (pred.yearly || 0) + (pred.weekly || 0),
              planned: plannedNet
            },
            scenarios: {
              optimistic: predicted * 1.15, // +15%
              realistic: predicted,
              pessimistic: predicted * 0.85 // -15%
            },
            // Legacy fields for backwards compatibility
            plannedCredit,
            plannedDebit,
            netChange: plannedNet,
            forecastIncome: avgDailyIncome + plannedCredit,
            forecastExpense: avgDailyExpense + plannedDebit,
            trendBased: {
              income: avgDailyIncome,
              expense: avgDailyExpense
            }
          });
        });

        runningBalance = forecastDaily[forecastDaily.length - 1]?.projectedBalance || currentBalance;

        logger.info(`[Forecast] Prophet forecast generated successfully: ${forecastDaily.length} days`);
      } catch (error) {
        logger.warn(`[Forecast] Prophet forecasting failed: ${error.message}. Falling back to simple trend forecast.`);
        useProphet = false; // Fallback to simple forecast
      }
    }

    // Fallback: Simple trend-based forecast (if Prophet unavailable or insufficient data)
    if (!useProphet) {
      logger.info(`[Forecast] Using simple trend forecast (${historicalTxs.length} days historical data)`);

      for (let i = 1; i <= horizonDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = dateKey(date);

        // Planned transactions for this day
        const dayPlanned = plannedTxs.filter(t =>
          dateKey(t.scheduledFor || t.occurredAt) === dateStr
        );

        const plannedCredit = dayPlanned
          .filter(t => t.type === "credit")
          .reduce((sum, t) => sum + t.amount, 0);

        const plannedDebit = dayPlanned
          .filter(t => t.type === "debit")
          .reduce((sum, t) => sum + t.amount, 0);

        // Combine trend-based forecast with planned transactions
        const forecastIncome = avgDailyIncome + plannedCredit;
        const forecastExpense = avgDailyExpense + plannedDebit;
        const dayNet = forecastIncome - forecastExpense;

        runningBalance += dayNet;

        forecastDaily.push({
          date: dateStr,
          predicted: runningBalance,
          projectedBalance: runningBalance,
          forecastIncome,
          forecastExpense,
          plannedCredit,
          plannedDebit,
          netChange: dayNet,
          trendBased: {
            income: avgDailyIncome,
            expense: avgDailyExpense
          },
          // Simplified confidence intervals for fallback
          confidence80: {
            upper: runningBalance * 1.08,
            lower: runningBalance * 0.92
          },
          confidence95: {
            upper: runningBalance * 1.15,
            lower: runningBalance * 0.85
          },
          scenarios: {
            optimistic: runningBalance * 1.15,
            realistic: runningBalance,
            pessimistic: runningBalance * 0.85
          },
          components: {
            trend: dayNet,
            seasonal: 0,
            planned: plannedCredit - plannedDebit
          }
        });
      }
    }

    // Calculate runway (days until balance hits zero)
    let runwayDays = null;
    if (avgDailyNet < 0) {
      runwayDays = Math.floor(currentBalance / Math.abs(avgDailyNet));
      if (runwayDays < 0) runwayDays = 0;
      if (runwayDays > horizonDays) runwayDays = null; // Beyond horizon
    }

    // Find min balance in forecast period
    const minBalance = Math.min(...forecastDaily.map(d => d.projectedBalance), currentBalance);
    const maxBalance = Math.max(...forecastDaily.map(d => d.projectedBalance), currentBalance);

    // ========== EVENT DETECTION ==========
    // Detect recurring patterns in historical transactions
    const autoDetectedEvents = eventDetector.detectRecurringPatterns(historicalTxs);

    // Fetch manual events from database (within forecast horizon)
    const manualEvents = await prisma.forecastEvent.findMany({
      where: {
        companyId,
        date: {
          gte: today,
          lte: forecastTo
        }
      },
      orderBy: { date: 'asc' }
    });

    // Convert manual events to API format
    const manualEventsFormatted = manualEvents.map(e => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      label: e.label,
      confidence: e.confidence,
      type: e.type,
      description: e.description
    }));

    // Merge auto-detected and manual events
    const allEvents = [...autoDetectedEvents, ...manualEventsFormatted];

    logger.info(`[Forecast] Detected ${autoDetectedEvents.length} auto events + ${manualEventsFormatted.length} manual events`);

    res.json({
      range: {
        from: today.toISOString(),
        to: forecastTo.toISOString()
      },
      currentBalance,
      projectedBalance: runningBalance,
      futureImpact: runningBalance - currentBalance,
      minBalance,
      maxBalance,
      runwayDays,
      trends: {
        avgDailyIncome,
        avgDailyExpense,
        avgDailyNet,
        historicalDays
      },
      forecast: forecastDaily,
      model: {
        type: useProphet ? "prophet" : "simple_trend",
        trainedOn: historicalTxs.length,
        horizonDays: horizonDays,
        seasonality: useProphet ? ["yearly", "weekly", "monthly"] : ["none"],
        confidence_levels: [0.8, 0.95],
        last_trained: new Date().toISOString(),
        backtesting_available: historicalTxs.length >= 365
      },
      events: allEvents, // Auto-detected + manual events
      alerts: {
        lowCash: runwayDays !== null && runwayDays < 30,
        negativeBalance: minBalance < 0,
        runwayDays
      }
    });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Enhanced forecast failed" });
  }
});

// ------- FORECAST BACKTESTING -------
router.get("/forecast-backtest", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const horizonDays = clampHorizon(req.query.horizonDays, 7, 180, 90);

    const accountIds = await resolveAccountIds({
      companyId,
      portfolioId: req.query.portfolioId,
      accountId: req.query.accountId
    });

    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds })).map((t) => toDisplay(t, settings));

    // Filter for confirmed transactions only (backtesting requires actual historical data)
    const historicalTxs = txs.filter((t) => t.status === "CONFIRMED");

    if (historicalTxs.length < 365) {
      return res.status(400).json({
        error: "Insufficient data for backtesting",
        required: 365,
        available: historicalTxs.length,
        message: "Backtesting requires at least 12 months (365 days) of historical data"
      });
    }

    logger.info(`[Backtest] Running for company ${companyId}, ${historicalTxs.length} transactions, horizon ${horizonDays}d`);

    // Call Prophet backtesting service
    const backtestResult = await prophetClient.backtest(historicalTxs, horizonDays);

    if (!backtestResult.success) {
      return res.status(500).json({
        error: "Backtesting failed",
        details: backtestResult.error
      });
    }

    // Calculate MAE as percentage of average balance
    let runningBalance = 0;
    let sumBalances = 0;

    historicalTxs.forEach((t) => {
      runningBalance += t.type === "credit" ? t.amount : -t.amount;
      sumBalances += runningBalance;
    });

    const avgBalance = sumBalances / historicalTxs.length;
    const maePercentage = (backtestResult.metrics.mae / Math.abs(avgBalance)) * 100;
    const meetsTarget = maePercentage < 10; // Target: MAE < 10%

    res.json({
      success: true,
      metrics: {
        mae: backtestResult.metrics.mae,
        rmse: backtestResult.metrics.rmse,
        mape: backtestResult.metrics.mape,
        coverage: backtestResult.metrics.coverage,
        mae_percentage: maePercentage,
        meets_target: meetsTarget,
        target_mae: 10.0,
        avg_balance: avgBalance
      },
      validation: {
        data_points: historicalTxs.length,
        horizon_tested: horizonDays,
        cutoffs_tested: backtestResult.metrics.cutoffs_tested
      }
    });
  } catch (err) {
    logger.error("[Backtest] Error:", err);
    res.status(500).json({ error: "Backtesting failed", details: err.message });
  }
});

// ------- COMBINED -------
router.get("/combined", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const horizonDays = clampHorizon(req.query.horizonDays, 1, 180, 30);
    const from = normalizeDate(req.query.from || new Date());
    const to = new Date(from);
    to.setDate(to.getDate() + horizonDays);
    const groupBy = ["day", "week"].includes(req.query.groupBy) ? req.query.groupBy : "day";
    const paymentFlowId = req.query.paymentFlowId ? Number(req.query.paymentFlowId) : null;

    const accountIds = await resolveAccountIds({ companyId, portfolioId: req.query.portfolioId, accountId: req.query.accountId });
    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds, paymentFlowId })).map((t) => toDisplay(t, settings));

    const range = { from, to };
    const keys = groupDates(range, groupBy);
    const daily = emptyDaily(keys);
    const perAccountMap = new Map();

    let currentBalance = 0;

    txs.forEach((t) => {
      const isPlanned = t.status === "PLANNED" || t.status === "SCHEDULED";
      const effectiveDate = isPlanned ? t.scheduledFor || t.occurredAt : t.occurredAt;
      if (!effectiveDate) return;
      const delta = t.type === "credit" ? t.amount : -t.amount;

      if (t.status === "CONFIRMED" && normalizeDate(t.occurredAt) < from) {
        currentBalance += delta;
      }

      if (!within(effectiveDate, range)) return;
      const key = groupBy === "week" ? dateKey(effectiveDate) : dateKey(effectiveDate);
      const bucket = daily[key];
      if (!bucket) return;
      if (t.type === "credit") {
        if (isPlanned) bucket.plannedCredit += t.amount; else bucket.credit += t.amount;
      } else {
        if (isPlanned) bucket.plannedDebit += t.amount; else bucket.debit += t.amount;
      }

      if (!perAccountMap.has(t.accountId)) {
        perAccountMap.set(t.accountId, {
          accountId: t.accountId,
          accountName: t.account?.name || `Compte #${t.accountId}`,
          baseBalance: 0,
          projectedBalance: 0,
          daily: emptyDaily(keys),
        });
      }
      const acc = perAccountMap.get(t.accountId);
      if (t.status === "CONFIRMED" && normalizeDate(t.occurredAt) < from) {
        acc.baseBalance += delta;
      } else {
        const accBucket = acc.daily[key];
        if (t.type === "credit") {
          if (isPlanned) accBucket.plannedCredit += t.amount; else accBucket.credit += t.amount;
        } else {
          if (isPlanned) accBucket.plannedDebit += t.amount; else accBucket.debit += t.amount;
        }
      }
    });

    let running = currentBalance;
    const dailyList = keys.map((k) => {
      const row = daily[k];
      const netReal = row.credit - row.debit;
      const netPlanned = row.plannedCredit - row.plannedDebit;
      running += netReal + netPlanned;
      return { ...row, balance: running, plannedNet: netPlanned };
    });

    perAccountMap.forEach((acc) => {
      let r = acc.baseBalance;
      acc.daily = keys.map((k) => {
        const row = acc.daily[k];
        const netReal = row.credit - row.debit;
        const netPlanned = row.plannedCredit - row.plannedDebit;
        r += netReal + netPlanned;
        return { ...row, balance: r, plannedNet: netPlanned };
      });
      acc.projectedBalance = r;
    });

    const futureImpact = dailyList.reduce((s, d) => s + (d.plannedCredit - d.plannedDebit), 0);
    const landingBalance = currentBalance + futureImpact;

    // Runway: nombre de jours avant solde négatif en tenant compte du prévisionnel
    let runwayDays = undefined;
    let cursor = currentBalance;
    for (let i = 0; i < dailyList.length; i++) {
      const d = dailyList[i];
      cursor += (d.plannedCredit - d.plannedDebit) + (d.credit - d.debit);
      if (cursor < 0) {
        runwayDays = i + 1; // index jour courant (1-based)
        break;
      }
    }

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      currentBalance,
      futureImpact,
      landingBalance,
      runwayDays,
      daily: dailyList,
      perAccount: Array.from(perAccountMap.values()),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting combined failed" });
  }
});

// ------- TOP CATEGORIES -------
router.get("/top-categories", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const mode = req.query.mode === "previsionnel" ? "previsionnel" : "reel";
    const horizonDays = clampHorizon(req.query.horizonDays, 1, 180, 30);
    const range = req.query.from && req.query.to
      ? { from: normalizeDate(req.query.from), to: normalizeDate(req.query.to) }
      : { from: normalizeDate(new Date()), to: (() => { const d = normalizeDate(new Date()); d.setDate(d.getDate() + horizonDays); return d; })() };

    const accountIds = await resolveAccountIds({ companyId, portfolioId: req.query.portfolioId, accountId: req.query.accountId });
    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds, includeCategories: true })).map((t) => toDisplay(t, settings));

    const income = new Map();
    const expense = new Map();
    txs.forEach((t) => {
      if (!t.category) return;
      const isPlanned = t.status === "PLANNED" || t.status === "SCHEDULED";
      if (mode === "reel" && t.status !== "CONFIRMED") return;
      if (mode === "previsionnel" && !isPlanned) return;
      const when = isPlanned ? t.scheduledFor || t.occurredAt : t.occurredAt;
      if (!within(when, range)) return;
      const map = t.category.kind === "INCOME" ? income : expense;
      if (!map.has(t.category.id || 0)) map.set(t.category.id || 0, { categoryId: t.category.id, name: t.category.name || "Non catégorisé", total: 0 });
      const entry = map.get(t.category.id || 0);
      entry.total += t.amount;
    });

    const limit = clampHorizon(req.query.limit, 1, 50, 5);
    const sort = (m) => Array.from(m.values()).sort((a, b) => b.total - a.total).slice(0, limit);

    res.json({ income: sort(income), expense: sort(expense) });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting top categories failed" });
  }
});

// ------- BUDGETS (simplifié) -------
router.get("/budgets", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const period = ["month", "quarter", "year"].includes(req.query.period) ? req.query.period : "month";
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : undefined;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

    const budgets = await prisma.budget.findMany({
      where: {
        category: { companyId },
        year,
        ...(period === "month" && month ? { month } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });

    const actualTx = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        status: "CONFIRMED",
        account: { companyId },
        categoryId: { in: budgets.map((b) => b.categoryId) },
        occurredAt: {
          gte: new Date(Date.UTC(year, (period === "month" && month ? month - 1 : 0), 1)),
          lte: new Date(Date.UTC(year, period === "month" && month ? month : 12, 0, 23, 59, 59)),
        },
      },
      _sum: { amount: true },
    });

    const actualMap = new Map(actualTx.map((a) => [a.categoryId, a._sum.amount || 0]));

    const byCategory = budgets.map((b) => {
      const actual = actualMap.get(b.categoryId) || 0;
      const variance = actual - b.amount;
      return {
        categoryId: b.categoryId,
        name: b.category?.name || "Catégorie",
        budgeted: b.amount,
        actual,
        variance,
      };
    });

    const budgeted = byCategory.reduce((s, c) => s + c.budgeted, 0);
    const actual = byCategory.reduce((s, c) => s + c.actual, 0);
    const variance = actual - budgeted;

    res.json({
      period,
      budgeted,
      actual,
      variance,
      variancePct: budgeted === 0 ? null : variance / budgeted,
      byCategory,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting budgets failed" });
  }
});

// ------- BY PAYMENT FLOW -------
// Rapport par flux de paiement : breakdown des transactions par type de flux
router.get("/by-flow", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({ from: req.query.from, to: req.query.to, daysFallback: clampHorizon(req.query.days, 1, 365, 30) });
    
    const accountIds = await resolveAccountIds({ companyId, portfolioId: req.query.portfolioId, accountId: req.query.accountId });
    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds, includeCategories: true })).map((t) => toDisplay(t, settings));

    // Grouper par flux de paiement
    const byFlow = new Map();
    let noFlowCredit = 0;
    let noFlowDebit = 0;
    let noFlowCount = 0;

    txs.forEach((t) => {
      if (t.status !== "CONFIRMED") return;
      if (!within(t.occurredAt, range)) return;

      const flowId = t.paymentFlow?.id || null;
      const flowName = t.paymentFlow?.name || "Non assigné";
      const flowType = t.paymentFlow?.type || "OTHER";

      if (!flowId) {
        if (t.type === "credit") noFlowCredit += t.amount;
        else noFlowDebit += t.amount;
        noFlowCount++;
        return;
      }

      if (!byFlow.has(flowId)) {
        byFlow.set(flowId, {
          flowId,
          flowName,
          flowType,
          totalCredit: 0,
          totalDebit: 0,
          count: 0,
          transactions: [],
        });
      }

      const entry = byFlow.get(flowId);
      if (t.type === "credit") entry.totalCredit += t.amount;
      else entry.totalDebit += t.amount;
      entry.count++;
      // Limiter à 5 transactions par flux pour l'aperçu
      if (entry.transactions.length < 5) {
        entry.transactions.push({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.occurredAt,
          category: t.category?.name || null,
        });
      }
    });

    // Transformer en tableau trié par volume
    const flows = Array.from(byFlow.values())
      .map((f) => ({
        ...f,
        net: f.totalCredit - f.totalDebit,
        volume: f.totalCredit + f.totalDebit,
      }))
      .sort((a, b) => b.volume - a.volume);

    // Totaux globaux
    const totalCredit = flows.reduce((s, f) => s + f.totalCredit, 0) + noFlowCredit;
    const totalDebit = flows.reduce((s, f) => s + f.totalDebit, 0) + noFlowDebit;
    const totalCount = flows.reduce((s, f) => s + f.count, 0) + noFlowCount;

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      totalCredit,
      totalDebit,
      totalCount,
      net: totalCredit - totalDebit,
      flows,
      noFlow: {
        totalCredit: noFlowCredit,
        totalDebit: noFlowDebit,
        count: noFlowCount,
        net: noFlowCredit - noFlowDebit,
      },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting by flow failed" });
  }
});

// ------- BY ACCOUNT -------
// Rapport par compte : analyse des mouvements et évolution de chaque compte
router.get("/by-account", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({
      from: req.query.from,
      to: req.query.to,
      daysFallback: clampHorizon(req.query.days, 1, 365, 30)
    });

    const accountIds = await resolveAccountIds({
      companyId,
      portfolioId: req.query.portfolioId,
      accountId: req.query.accountId
    });

    // Récupérer les comptes avec leurs informations de portfolio
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds.length > 0 ? accountIds : [0] },
        companyId,
        status: "ACTIVE"
      },
      include: {
        portfolio: {
          select: { id: true, name: true }
        }
      }
    });

    const settings = await getOrCreateVatSettings(companyId);
    const txs = (await fetchTransactions({ companyId, accountIds })).map((t) => toDisplay(t, settings));

    // Créer une map pour agréger les données par compte
    const accountDataMap = new Map();
    accounts.forEach(acc => {
      accountDataMap.set(acc.id, {
        accountId: acc.id,
        accountName: acc.name,
        portfolioId: acc.portfolio?.id || null,
        portfolioName: acc.portfolio?.name || null,
        balance: acc.balance,
        totalCredit: 0,
        totalDebit: 0,
        movements: 0,
        evolution: 0,
        avgIncome: 0,
        avgExpense: 0
      });
    });

    // Agréger les transactions par compte
    txs.forEach(t => {
      if (t.status === "CONFIRMED" && within(t.occurredAt, range)) {
        const data = accountDataMap.get(t.accountId);
        if (!data) return; // Sécurité si le compte n'existe pas dans la map

        data.movements++;
        if (t.type === "credit") {
          data.totalCredit += t.amount;
        } else {
          data.totalDebit += t.amount;
        }
      }
    });

    // Calculer les métriques dérivées
    accountDataMap.forEach(acc => {
      const net = acc.totalCredit - acc.totalDebit;
      const baseBalance = acc.balance - net; // Solde au début de la période

      // Évolution en pourcentage
      acc.evolution = baseBalance !== 0 ? (net / Math.abs(baseBalance)) * 100 : 0;

      // Moyennes
      if (acc.movements > 0) {
        acc.avgIncome = acc.totalCredit / acc.movements;
        acc.avgExpense = acc.totalDebit / acc.movements;
      }
    });

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      accounts: Array.from(accountDataMap.values()).sort((a, b) => b.balance - a.balance)
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting by account failed" });
  }
});

// ------- BY PORTFOLIO -------
// Rapport par portefeuille : agrégation des comptes et mouvements par portfolio
router.get("/by-portfolio", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({
      from: req.query.from,
      to: req.query.to,
      daysFallback: clampHorizon(req.query.days, 1, 365, 30)
    });

    // Récupérer tous les portfolios avec leurs comptes
    const portfolios = await prisma.portfolio.findMany({
      where: {
        companyId,
        status: "ACTIVE"
      },
      include: {
        accounts: {
          where: { status: "ACTIVE" },
          select: { id: true, balance: true }
        }
      }
    });

    // Créer une map pour agréger les données par portfolio
    const portfolioDataMap = new Map();
    portfolios.forEach(p => {
      portfolioDataMap.set(p.id, {
        portfolioId: p.id,
        portfolioName: p.name,
        accountsCount: p.accounts.length,
        balance: p.accounts.reduce((sum, a) => sum + a.balance, 0),
        totalCredit: 0,
        totalDebit: 0,
        movements: 0,
        evolution: 0
      });
    });

    // Récupérer toutes les transactions pour tous les comptes de tous les portfolios
    const allAccountIds = portfolios.flatMap(p => p.accounts.map(a => a.id));

    if (allAccountIds.length > 0) {
      const settings = await getOrCreateVatSettings(companyId);
      const txs = (await fetchTransactions({ companyId, accountIds: allAccountIds })).map((t) => toDisplay(t, settings));

      // Créer un map accountId -> portfolioId pour un accès rapide
      const accountToPortfolio = new Map();
      portfolios.forEach(p => {
        p.accounts.forEach(a => {
          accountToPortfolio.set(a.id, p.id);
        });
      });

      // Agréger les transactions par portfolio
      txs.forEach(t => {
        if (t.status === "CONFIRMED" && within(t.occurredAt, range)) {
          const portfolioId = accountToPortfolio.get(t.accountId);
          if (!portfolioId) return;

          const data = portfolioDataMap.get(portfolioId);
          if (!data) return;

          data.movements++;
          if (t.type === "credit") {
            data.totalCredit += t.amount;
          } else {
            data.totalDebit += t.amount;
          }
        }
      });

      // Calculer l'évolution pour chaque portfolio
      portfolioDataMap.forEach(portfolio => {
        const net = portfolio.totalCredit - portfolio.totalDebit;
        const baseBalance = portfolio.balance - net; // Solde au début de la période

        // Évolution en pourcentage
        if (baseBalance !== 0) {
          portfolio.evolution = (net / Math.abs(baseBalance)) * 100;
        } else {
          portfolio.evolution = 0;
        }
      });
    }

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      portfolios: Array.from(portfolioDataMap.values()).sort((a, b) => b.balance - a.balance)
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting by portfolio failed" });
  }
});

// GET /reporting/profitability - Profitability analysis (P&L)
router.get("/profitability", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({
      from: req.query.from,
      to: req.query.to,
      daysFallback: clampHorizon(req.query.days, 1, 365, 30)
    });

    const accountIds = await resolveAccountIds({
      companyId,
      portfolioId: req.query.portfolioId,
      accountId: req.query.accountId
    });

    const settings = await getOrCreateVatSettings(companyId);
    const allTxs = await fetchTransactions({ companyId, accountIds });

    // Fetch categories for classification
    const categories = await prisma.category.findMany({
      where: { companyId },
      select: { id: true, name: true, kind: true }
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const txs = allTxs
      .map((t) => toDisplay(t, settings))
      .filter(t => t.status === "CONFIRMED" && within(t.occurredAt, range));

    let revenue = 0;
    let cogs = 0;
    let operatingExpenses = 0;
    let otherIncome = 0;
    let otherExpenses = 0;

    // COGS keywords (cost of goods sold)
    const cogsKeywords = /achat|matière|matériel|stock|fourniture|marchandise|approvisionnement/i;

    txs.forEach(t => {
      const category = t.categoryId ? categoryMap.get(t.categoryId) : null;

      if (t.type === "credit") {
        // Revenue: credits with INCOME category
        if (category && category.kind === "INCOME") {
          revenue += t.amount;
        } else {
          // Other income (without category or non-INCOME credits)
          otherIncome += t.amount;
        }
      } else if (t.type === "debit") {
        // Check if it's COGS based on category name
        const isCOGS = category && category.name && cogsKeywords.test(category.name);

        if (isCOGS) {
          cogs += t.amount;
        } else if (category && category.kind === "EXPENSE") {
          operatingExpenses += t.amount;
        } else {
          // Other expenses (without category or non-EXPENSE debits)
          otherExpenses += t.amount;
        }
      }
    });

    // Calculate profitability metrics
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

    // Net profit (simplified: operating profit + other income - other expenses)
    const netProfit = operatingProfit + otherIncome - otherExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      operatingExpenses,
      operatingProfit,
      operatingMargin,
      otherIncome,
      otherExpenses,
      netProfit,
      netMargin,
      // Breakdown for transparency
      breakdown: {
        totalIncome: revenue + otherIncome,
        totalExpenses: cogs + operatingExpenses + otherExpenses,
        transactionCount: txs.length
      }
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reporting profitability failed" });
  }
});

// DSO Reliability Scoring
function calculateDSOReliability(data) {
  const { paidInvoices, totalReceivables, totalRevenue } = data;
  const prerequisites = { met: [], missing: [], warnings: [] };
  const recommendations = [];
  let score = 100;
  let completeness = 100, consistency = 100, accuracy = 100;

  // Prerequisite 1: Minimum 5 paid invoices
  if (paidInvoices.length >= 5) {
    prerequisites.met.push("Au moins 5 factures payées dans la période");
  } else {
    prerequisites.missing.push(`Seulement ${paidInvoices.length} facture(s) payée(s) - minimum 5 recommandé`);
    score -= 30;
    completeness -= 40;
    recommendations.push("Créer plus de factures clients avec suivi des dates de paiement");
  }

  // Prerequisite 2: paymentDelay fields completed
  const invoicesWithDelay = paidInvoices.filter(inv => inv.paymentDelay !== null);
  const delayCompleteness = paidInvoices.length > 0 ? (invoicesWithDelay.length / paidInvoices.length) * 100 : 0;

  if (delayCompleteness >= 80) {
    prerequisites.met.push("Délais de paiement renseignés (≥80%)");
  } else {
    prerequisites.warnings.push(`${Math.round(delayCompleteness)}% des factures ont un délai de paiement`);
    score -= (80 - delayCompleteness) * 0.3;
    completeness -= (80 - delayCompleteness);
    recommendations.push("Renseigner les dates de paiement effectives sur toutes les factures");
  }

  // Prerequisite 3: Revenue > 0
  if (totalRevenue > 0) {
    prerequisites.met.push("Chiffre d'affaires positif sur la période");
  } else {
    prerequisites.missing.push("Aucun chiffre d'affaires - DSO non calculable");
    score = 0;
    accuracy = 0;
    recommendations.push("Générer des factures clients pour permettre le calcul du DSO");
  }

  const level = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "moderate" : "poor";

  return {
    score: Math.max(0, Math.round(score)),
    level,
    prerequisites,
    recommendations,
    dataQuality: {
      completeness: Math.max(0, Math.round(completeness)),
      consistency: Math.max(0, Math.round(consistency)),
      accuracy: Math.max(0, Math.round(accuracy)),
    }
  };
}

// GET /reporting/dso - Days Sales Outstanding analysis
router.get("/dso", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({
      from: req.query.from,
      to: req.query.to,
      daysFallback: clampHorizon(req.query.days, 1, 365, 30)
    });

    const days = Math.ceil((range.to - range.from) / (1000 * 60 * 60 * 24));

    // Fetch paid invoices in period (for revenue calculation)
    const paidInvoices = await prisma.customerInvoice.findMany({
      where: {
        customer: { companyId },
        status: { in: ['PAID'] },
        paidDate: {
          gte: range.from,
          lte: range.to
        }
      },
      include: {
        customer: {
          select: { id: true, name: true }
        }
      }
    });

    // Fetch outstanding receivables (current snapshot)
    const receivablesData = await prisma.customerInvoice.aggregate({
      where: {
        customer: { companyId },
        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }
      },
      _sum: {
        amountRemaining: true
      }
    });

    // Fetch invoice counts by status
    const invoiceCounts = await prisma.customerInvoice.groupBy({
      by: ['status'],
      where: {
        customer: { companyId }
      },
      _count: true
    });

    const totalReceivables = receivablesData._sum.amountRemaining || 0;
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate DSO: (Accounts Receivable / Total Revenue) × Days
    const dso = totalRevenue > 0 ? (totalReceivables / totalRevenue) * days : 0;

    // Calculate average payment delay from paid invoices
    const avgPaymentDelay = paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => sum + (inv.paymentDelay || 0), 0) / paidInvoices.length
      : 0;

    // Group by customer (top 10 by receivables)
    const byCustomerMap = new Map();

    const outstandingInvoices = await prisma.customerInvoice.findMany({
      where: {
        customer: { companyId },
        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }
      },
      include: {
        customer: {
          select: { id: true, name: true }
        }
      }
    });

    outstandingInvoices.forEach(inv => {
      const key = inv.customer.id;
      if (!byCustomerMap.has(key)) {
        byCustomerMap.set(key, {
          customerId: inv.customer.id,
          customerName: inv.customer.name,
          receivables: 0,
          invoiceCount: 0
        });
      }
      const entry = byCustomerMap.get(key);
      entry.receivables += inv.amountRemaining;
      entry.invoiceCount += 1;
    });

    const byCustomer = Array.from(byCustomerMap.values())
      .sort((a, b) => b.receivables - a.receivables)
      .slice(0, 10);

    // Calculate trend (compare with previous period)
    const previousRange = {
      from: new Date(range.from.getTime() - (range.to - range.from)),
      to: range.from
    };

    const previousPaidInvoices = await prisma.customerInvoice.findMany({
      where: {
        customer: { companyId },
        status: { in: ['PAID'] },
        paidDate: {
          gte: previousRange.from,
          lte: previousRange.to
        }
      }
    });

    const previousRevenue = previousPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const previousDso = previousRevenue > 0 ? (totalReceivables / previousRevenue) * days : dso;

    const trend = previousDso === 0 ? "stable" : dso < previousDso ? "improving" : "worsening";

    // Invoice counts
    const invoices = {
      paid: invoiceCounts.find(c => c.status === 'PAID')?._count || 0,
      overdue: invoiceCounts.find(c => c.status === 'OVERDUE')?._count || 0,
      pending: (invoiceCounts.find(c => c.status === 'SENT')?._count || 0) +
               (invoiceCounts.find(c => c.status === 'PARTIALLY_PAID')?._count || 0)
    };

    const reliability = calculateDSOReliability({
      paidInvoices,
      totalReceivables,
      totalRevenue,
    });

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      dso: Math.round(dso),
      avgPaymentDelay: Math.round(avgPaymentDelay),
      totalReceivables,
      totalRevenue,
      invoices,
      trend,
      byCustomer,
      reliability
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "DSO calculation failed" });
  }
});

// EBITDA Reliability Scoring
function calculateEBITDAReliability(data, allTransactions) {
  const { depreciationAndAmortization } = data;
  const prerequisites = { met: [], missing: [], warnings: [] };
  const recommendations = [];
  let score = 100;
  let completeness = 100, consistency = 100, accuracy = 100;

  // Prerequisite 1: Minimum 100 transactions
  if (allTransactions.length >= 100) {
    prerequisites.met.push("Historique de transactions suffisant (≥100)");
  } else {
    prerequisites.warnings.push(`${allTransactions.length} transactions - 100 recommandées`);
    score -= (100 - allTransactions.length) * 0.2;
    completeness -= Math.min(50, (100 - allTransactions.length) * 0.5);
    recommendations.push("Importer l'historique bancaire complet");
  }

  // Prerequisite 2: Categorization rate
  const categorized = allTransactions.filter(t => t.categoryId !== null);
  const categorizationRate = allTransactions.length > 0 ? (categorized.length / allTransactions.length) * 100 : 0;

  if (categorizationRate >= 80) {
    prerequisites.met.push("Transactions catégorisées (≥80%)");
  } else {
    prerequisites.missing.push(`${Math.round(categorizationRate)}% catégorisées - 80% requis`);
    score -= (80 - categorizationRate) * 0.5;
    completeness -= (80 - categorizationRate);
    recommendations.push("Catégoriser les transactions non classées");
  }

  // Prerequisite 3: D&A detection (regex-based = 90% accuracy max)
  if (depreciationAndAmortization > 0) {
    prerequisites.met.push("Amortissements détectés");
    accuracy = 90;
  } else {
    prerequisites.warnings.push("Aucun amortissement détecté");
    accuracy = 70;
  }

  const level = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "moderate" : "poor";

  return {
    score: Math.max(0, Math.round(score)),
    level,
    prerequisites,
    recommendations,
    dataQuality: {
      completeness: Math.max(0, Math.round(completeness)),
      consistency: Math.max(0, Math.round(consistency)),
      accuracy: Math.max(0, Math.round(accuracy)),
    }
  };
}

// GET /reporting/ebitda - EBITDA analysis (extends profitability)
router.get("/ebitda", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({
      from: req.query.from,
      to: req.query.to,
      daysFallback: clampHorizon(req.query.days, 1, 365, 30)
    });

    const accountIds = await resolveAccountIds({
      companyId,
      portfolioId: req.query.portfolioId,
      accountId: req.query.accountId
    });

    const settings = await getOrCreateVatSettings(companyId);
    const allTxs = await fetchTransactions({ companyId, accountIds });

    // Fetch categories for classification
    const categories = await prisma.category.findMany({
      where: { companyId },
      select: { id: true, name: true, kind: true }
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const txs = allTxs
      .map((t) => toDisplay(t, settings))
      .filter(t => t.status === "CONFIRMED" && within(t.occurredAt, range));

    let revenue = 0;
    let cogs = 0;
    let operatingExpenses = 0;
    let otherIncome = 0;
    let otherExpenses = 0;
    let depreciationAndAmortization = 0;

    // Keywords for detection
    const cogsKeywords = /achat|matière|matériel|stock|fourniture|marchandise|approvisionnement/i;
    const daKeywords = /amortissement|dépréciation|dotation|provision/i;

    txs.forEach(t => {
      const category = t.categoryId ? categoryMap.get(t.categoryId) : null;

      if (t.type === "credit") {
        if (category && category.kind === "INCOME") {
          revenue += t.amount;
        } else {
          otherIncome += t.amount;
        }
      } else if (t.type === "debit") {
        const isCOGS = category && category.name && cogsKeywords.test(category.name);
        const isDA = category && category.name && daKeywords.test(category.name);

        if (isDA) {
          // Depreciation & Amortization
          depreciationAndAmortization += t.amount;
          operatingExpenses += t.amount; // Still counts as operating expense
        } else if (isCOGS) {
          cogs += t.amount;
        } else if (category && category.kind === "EXPENSE") {
          operatingExpenses += t.amount;
        } else {
          otherExpenses += t.amount;
        }
      }
    });

    // Calculate profitability metrics
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

    // EBITDA = Operating Profit + D&A
    const ebitda = operatingProfit + depreciationAndAmortization;
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    const netProfit = operatingProfit + otherIncome - otherExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const reliability = calculateEBITDAReliability({
      depreciationAndAmortization
    }, allTxs);

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      operatingExpenses,
      operatingProfit,
      operatingMargin,
      depreciationAndAmortization,
      ebitda,
      ebitdaMargin,
      otherIncome,
      otherExpenses,
      netProfit,
      netMargin,
      breakdown: {
        totalIncome: revenue + otherIncome,
        totalExpenses: cogs + operatingExpenses + otherExpenses,
        transactionCount: txs.length
      },
      reliability
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "EBITDA calculation failed" });
  }
});

// BFR Reliability Scoring
function calculateBFRReliability(data) {
  const { components, totalRevenue } = data;
  const prerequisites = { met: [], missing: [], warnings: [] };
  const recommendations = [];
  let score = 100;
  let completeness = 60; // Base 60% because inventory = 0
  let consistency = 100;
  let accuracy = 70; // Base 70% because incomplete

  // Known limitation: Inventory missing
  prerequisites.missing.push("Stock non pris en compte (inventory = 0)");
  recommendations.push("Implémenter un suivi des stocks pour un BFR complet");
  score -= 20;

  if (components.receivables > 0) {
    prerequisites.met.push("Créances clients présentes");
  } else {
    prerequisites.warnings.push("Aucune créance client en cours");
    score -= 10;
  }

  if (components.payables > 0) {
    prerequisites.met.push("Dettes fournisseurs présentes");
  } else {
    prerequisites.warnings.push("Aucune dette fournisseur en cours");
    score -= 10;
  }

  if (totalRevenue > 0) {
    prerequisites.met.push("CA disponible pour ratio BFR/CA");
  } else {
    prerequisites.warnings.push("Pas de CA - ratio non calculable");
    score -= 10;
  }

  prerequisites.warnings.push("Vérifier que les factures sont synchronisées avec les paiements");
  recommendations.push("Rapprocher régulièrement les factures avec les mouvements bancaires");

  const level = score >= 70 ? "good" : score >= 50 ? "moderate" : "poor";

  return {
    score: Math.max(0, Math.round(score)),
    level,
    prerequisites,
    recommendations,
    dataQuality: {
      completeness: Math.max(0, Math.round(completeness)),
      consistency: Math.max(0, Math.round(consistency)),
      accuracy: Math.max(0, Math.round(accuracy)),
    }
  };
}

// GET /reporting/bfr - Working Capital Requirement (BFR) analysis
router.get("/bfr", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({
      from: req.query.from,
      to: req.query.to,
      daysFallback: clampHorizon(req.query.days, 1, 365, 30)
    });

    const days = Math.ceil((range.to - range.from) / (1000 * 60 * 60 * 24));

    // Calculate receivables (outstanding customer invoices)
    const receivablesData = await prisma.customerInvoice.aggregate({
      where: {
        customer: { companyId },
        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }
      },
      _sum: {
        amountRemaining: true
      }
    });

    // Calculate payables (outstanding supplier invoices)
    const payablesData = await prisma.supplierInvoice.aggregate({
      where: {
        companyId,
        status: { in: ['PENDING', 'SCHEDULED', 'OVERDUE', 'PARTIAL'] }
      },
      _sum: {
        amount: true
      }
    });

    const receivables = receivablesData._sum.amountRemaining || 0;
    const payables = payablesData._sum.amount || 0;
    const inventory = 0; // Phase 1: No inventory tracking yet

    // BFR = Receivables + Inventory - Payables
    const bfr = receivables + inventory - payables;

    // Get revenue for ratio calculation
    const accountIds = await resolveAccountIds({
      companyId,
      portfolioId: req.query.portfolioId,
      accountId: req.query.accountId
    });

    const settings = await getOrCreateVatSettings(companyId);
    const allTxs = await fetchTransactions({ companyId, accountIds });

    const txs = allTxs
      .map((t) => toDisplay(t, settings))
      .filter(t => t.status === "CONFIRMED" && within(t.occurredAt, range));

    const categories = await prisma.category.findMany({
      where: { companyId },
      select: { id: true, kind: true }
    });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    let revenue = 0;
    txs.forEach(t => {
      const category = t.categoryId ? categoryMap.get(t.categoryId) : null;
      if (t.type === "credit" && category && category.kind === "INCOME") {
        revenue += t.amount;
      }
    });

    // BFR in days and ratio
    const bfrDays = revenue > 0 ? (bfr / revenue) * days : 0;
    const ratio = revenue > 0 ? (bfr / revenue) * 100 : 0;

    // Calculate trend (compare with previous period)
    const previousRange = {
      from: new Date(range.from.getTime() - (range.to - range.from)),
      to: range.from
    };

    const previousTxs = allTxs
      .map((t) => toDisplay(t, settings))
      .filter(t => t.status === "CONFIRMED" && within(t.occurredAt, previousRange));

    let previousRevenue = 0;
    previousTxs.forEach(t => {
      const category = t.categoryId ? categoryMap.get(t.categoryId) : null;
      if (t.type === "credit" && category && category.kind === "INCOME") {
        previousRevenue += t.amount;
      }
    });

    const previousDays = Math.ceil((previousRange.to - previousRange.from) / (1000 * 60 * 60 * 24));
    const previousBfrDays = previousRevenue > 0 ? (bfr / previousRevenue) * previousDays : bfrDays;

    const trend = previousBfrDays === 0 ? "stable" : bfr < previousBfrDays ? "decreasing" : "increasing";

    // Recommendation
    let recommendation = "BFR maîtrisé";
    if (ratio > 30) {
      recommendation = "BFR élevé - Optimiser le délai d'encaissement (DSO) et négocier les délais fournisseurs (DPO)";
    } else if (ratio > 20) {
      recommendation = "BFR modéré - Surveiller l'évolution des créances et dettes";
    }

    const reliability = calculateBFRReliability({
      components: {
        receivables,
        inventory,
        payables
      },
      totalRevenue: revenue
    });

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      bfr,
      bfrDays: Math.round(bfrDays),
      components: {
        receivables,
        inventory,
        payables
      },
      ratio: Math.round(ratio * 10) / 10,
      trend,
      recommendation,
      reliability
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "BFR calculation failed" });
  }
});

// Breakeven Reliability Scoring
function calculateBreakevenReliability(data) {
  const { fixedCosts, variableCosts, revenue, categoriesBreakdown } = data;
  const prerequisites = { met: [], missing: [], warnings: [] };
  const recommendations = [];
  let score = 100;
  let completeness = 100, consistency = 100, accuracy = 100;

  // Prerequisite 1: Classification costNature
  const totalCosts = fixedCosts + variableCosts;
  const unclassified = categoriesBreakdown.unclassified.reduce((sum, c) => sum + Math.abs(c.amount), 0);
  const classificationRate = totalCosts > 0 ? ((totalCosts - unclassified) / totalCosts) * 100 : 0;

  if (classificationRate >= 80) {
    prerequisites.met.push("Coûts classifiés (≥80%)");
  } else if (classificationRate >= 50) {
    prerequisites.warnings.push(`${Math.round(classificationRate)}% des coûts classifiés`);
    score -= (80 - classificationRate) * 0.5;
    completeness -= (80 - classificationRate);
    recommendations.push("Classifier les catégories en coûts fixes/variables");
  } else {
    prerequisites.missing.push(`Seulement ${Math.round(classificationRate)}% classifiés`);
    score -= 40;
    completeness -= 60;
    accuracy -= 50;
    recommendations.push("Accéder aux paramètres des catégories pour définir fixed/variable");
  }

  // Prerequisite 2: Revenue > 0
  if (revenue > 0) {
    prerequisites.met.push("Chiffre d'affaires positif");
  } else {
    prerequisites.missing.push("Aucun CA - point mort non calculable");
    score = 0;
    accuracy = 0;
  }

  if (fixedCosts > 0) {
    prerequisites.met.push("Coûts fixes identifiés");
  } else {
    prerequisites.warnings.push("Aucun coût fixe détecté");
  }

  if (variableCosts > 0) {
    prerequisites.met.push("Coûts variables identifiés");
  } else {
    prerequisites.warnings.push("Aucun coût variable détecté");
  }

  const level = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "moderate" : "poor";

  return {
    score: Math.max(0, Math.round(score)),
    level,
    prerequisites,
    recommendations,
    dataQuality: {
      completeness: Math.max(0, Math.round(completeness)),
      consistency: Math.max(0, Math.round(consistency)),
      accuracy: Math.max(0, Math.round(accuracy)),
    }
  };
}

// GET /reporting/breakeven - Break-even point (Point mort) analysis
router.get("/breakeven", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const range = makeRange({
      from: req.query.from,
      to: req.query.to,
      daysFallback: clampHorizon(req.query.days, 1, 365, 30)
    });

    const accountIds = await resolveAccountIds({
      companyId,
      portfolioId: req.query.portfolioId,
      accountId: req.query.accountId
    });

    const settings = await getOrCreateVatSettings(companyId);
    const allTxs = await fetchTransactions({ companyId, accountIds });

    // Fetch categories
    const categories = await prisma.category.findMany({
      where: { companyId },
      select: { id: true, name: true, kind: true }
    });

    // Keywords for cost classification
    const variableCostKeywords = /achat|matière|fourniture|marchandise|sous.?traitance|commission|port|emballage|colis/i;
    const fixedCostKeywords = /loyer|salaire|assurance|abonnement|amortissement|location|licence|bail/i;

    // Add costNature based on keywords
    const categoriesWithNature = categories.map(c => ({
      ...c,
      costNature: variableCostKeywords.test(c.name) ? 'VARIABLE' :
                  fixedCostKeywords.test(c.name) ? 'FIXED' :
                  'UNCLASSIFIED'
    }));

    const categoryMap = new Map(categoriesWithNature.map(c => [c.id, c]));

    const txs = allTxs
      .map((t) => toDisplay(t, settings))
      .filter(t => t.status === "CONFIRMED" && within(t.occurredAt, range));

    let revenue = 0;
    let fixedCosts = 0;
    let variableCosts = 0;
    let unclassifiedCosts = 0;

    const categoriesBreakdown = {
      fixed: [],
      variable: [],
      unclassified: []
    };

    // Track categories with amounts
    const categoryTotals = new Map();

    txs.forEach(t => {
      const category = t.categoryId ? categoryMap.get(t.categoryId) : null;

      if (t.type === "credit") {
        if (category && category.kind === "INCOME") {
          revenue += t.amount;
        }
      } else if (t.type === "debit") {
        const costNature = category?.costNature || 'UNCLASSIFIED';

        // Track totals by category
        if (category) {
          const key = category.id;
          if (!categoryTotals.has(key)) {
            categoryTotals.set(key, {
              categoryId: category.id,
              categoryName: category.name,
              costNature: category.costNature,
              amount: 0
            });
          }
          categoryTotals.get(key).amount += t.amount;
        }

        switch (costNature) {
          case 'FIXED':
            fixedCosts += t.amount;
            break;
          case 'VARIABLE':
            variableCosts += t.amount;
            break;
          case 'MIXED':
            // For mixed costs, split 50/50 (simplified approach)
            fixedCosts += t.amount / 2;
            variableCosts += t.amount / 2;
            break;
          default:
            unclassifiedCosts += t.amount;
        }
      }
    });

    // Build breakdown arrays
    categoryTotals.forEach(cat => {
      const item = {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        amount: cat.amount
      };

      if (cat.costNature === 'FIXED') {
        categoriesBreakdown.fixed.push(item);
      } else if (cat.costNature === 'VARIABLE') {
        categoriesBreakdown.variable.push(item);
      } else {
        categoriesBreakdown.unclassified.push(item);
      }
    });

    // Sort by amount descending
    categoriesBreakdown.fixed.sort((a, b) => b.amount - a.amount);
    categoriesBreakdown.variable.sort((a, b) => b.amount - a.amount);
    categoriesBreakdown.unclassified.sort((a, b) => b.amount - a.amount);

    // Calculate break-even
    // Contribution Margin = (Revenue - Variable Costs) / Revenue
    const contributionMargin = revenue > 0 ? (revenue - variableCosts) / revenue : 0;

    // Break-even Revenue = Fixed Costs / Contribution Margin
    const breakEvenRevenue = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;

    const currentRevenue = revenue;
    const revenueGap = currentRevenue - breakEvenRevenue;
    const breakEvenReached = currentRevenue >= breakEvenRevenue;

    // Safety Margin = (Current Revenue - Break-even Revenue) / Current Revenue × 100
    const safetyMargin = currentRevenue > 0 ? (revenueGap / currentRevenue) * 100 : 0;

    const reliability = calculateBreakevenReliability({
      fixedCosts,
      variableCosts,
      revenue,
      categoriesBreakdown
    });

    res.json({
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
      currentRevenue: Math.round(currentRevenue * 100) / 100,
      revenueGap: Math.round(revenueGap * 100) / 100,
      breakEvenReached,
      fixedCosts: Math.round(fixedCosts * 100) / 100,
      variableCosts: Math.round(variableCosts * 100) / 100,
      contributionMargin: Math.round(contributionMargin * 100) / 100,
      safetyMargin: Math.round(safetyMargin * 10) / 10,
      categoriesBreakdown,
      warning: unclassifiedCosts > 0 ?
        `${Math.round(unclassifiedCosts)} € de coûts non classifiés - Classifier les catégories pour une analyse précise` : null,
      reliability
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Break-even calculation failed" });
  }
});

// ➤ DSO HISTORY - Historical trend data
router.get("/dso/history", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const months = parseInt(req.query.months) || 6; // Default 6 months

    const historyData = [];
    const now = new Date();

    // Calculate DSO for each month going back
    for (let i = months - 1; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

      // Paid invoices in this month
      const paidInvoices = await prisma.customerInvoice.findMany({
        where: {
          customer: { companyId },
          status: { in: ['PAID', 'OVERDUE'] },
          paidDate: { gte: monthStart, lte: monthEnd }
        }
      });

      // Receivables at month end
      const receivables = await prisma.customerInvoice.aggregate({
        where: {
          customer: { companyId },
          status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
          dueDate: { lte: monthEnd }
        },
        _sum: { amountRemaining: true }
      });

      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalReceivables = receivables._sum.amountRemaining || 0;
      const daysInMonth = new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 0).getDate();
      const dso = totalRevenue > 0 ? (totalReceivables / totalRevenue) * daysInMonth : 0;

      historyData.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        dso: Math.round(dso * 10) / 10,
        revenue: Math.round(totalRevenue * 100) / 100,
        receivables: Math.round(totalReceivables * 100) / 100
      });
    }

    res.json({ months, data: historyData });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "DSO history calculation failed" });
  }
});

// ➤ EBITDA HISTORY - Historical trend data
router.get("/ebitda/history", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const months = parseInt(req.query.months) || 6;

    const historyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

      // Fetch transactions for this month
      const txs = await prisma.transaction.findMany({
        where: {
          account: { companyId },
          occurredAt: { gte: monthStart, lte: monthEnd }
        },
        include: { category: { select: { id: true, name: true, kind: true } } }
      });

      const daKeywords = /amortissement|dépréciation|dotation|provision/i;
      let revenue = 0, cogs = 0, opex = 0, da = 0;

      txs.forEach(t => {
        const isDA = t.category && daKeywords.test(t.category.name);
        const isCOGS = t.category && /achat|matière|fourniture|marchandise/i.test(t.category.name);

        if (t.type === "credit" && t.category?.kind === "INCOME") {
          revenue += t.amount;
        } else if (t.type === "debit") {
          if (isDA) {
            da += t.amount;
          } else if (isCOGS) {
            cogs += t.amount;
          } else {
            opex += t.amount;
          }
        }
      });

      const operatingProfit = revenue - cogs - opex;
      const ebitda = operatingProfit + da;
      const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

      historyData.push({
        month: monthStart.toISOString().slice(0, 7),
        ebitda: Math.round(ebitda * 100) / 100,
        ebitdaMargin: Math.round(ebitdaMargin * 10) / 10,
        revenue: Math.round(revenue * 100) / 100,
        operatingProfit: Math.round(operatingProfit * 100) / 100
      });
    }

    res.json({ months, data: historyData });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "EBITDA history calculation failed" });
  }
});

// ➤ BFR HISTORY - Historical trend data
router.get("/bfr/history", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const months = parseInt(req.query.months) || 6;

    const historyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

      // Receivables at month end
      const receivables = await prisma.customerInvoice.aggregate({
        where: {
          customer: { companyId },
          status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
          createdAt: { lte: monthEnd }
        },
        _sum: { amountRemaining: true }
      });

      // Payables at month end
      const payables = await prisma.supplierInvoice.aggregate({
        where: {
          companyId,
          status: { in: ['PENDING', 'SCHEDULED', 'OVERDUE', 'PARTIAL'] },
          createdAt: { lte: monthEnd }
        },
        _sum: { amount: true }
      });

      // Revenue for the month
      const txs = await prisma.transaction.findMany({
        where: {
          account: { companyId },
          type: "credit",
          occurredAt: { gte: monthStart, lte: monthEnd }
        },
        include: { category: { select: { kind: true } } }
      });

      const revenue = txs
        .filter(t => t.category?.kind === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalReceivables = receivables._sum.amountRemaining || 0;
      const totalPayables = payables._sum.amount || 0;
      const bfr = totalReceivables - totalPayables;
      const ratio = revenue > 0 ? (bfr / revenue) * 100 : 0;

      historyData.push({
        month: monthStart.toISOString().slice(0, 7),
        bfr: Math.round(bfr * 100) / 100,
        receivables: Math.round(totalReceivables * 100) / 100,
        payables: Math.round(totalPayables * 100) / 100,
        ratio: Math.round(ratio * 10) / 10
      });
    }

    res.json({ months, data: historyData });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "BFR history calculation failed" });
  }
});

// ➤ BREAKEVEN HISTORY - Historical trend data
router.get("/breakeven/history", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const months = parseInt(req.query.months) || 6;

    const historyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

      const txs = await prisma.transaction.findMany({
        where: {
          account: { companyId },
          occurredAt: { gte: monthStart, lte: monthEnd }
        },
        include: { category: { select: { kind: true, name: true } } }
      });

      let revenue = 0, fixedCosts = 0, variableCosts = 0;

      // Keywords for cost classification
      const variableCostKeywords = /achat|matière|fourniture|marchandise|sous.?traitance|commission|port|emballage|colis/i;
      const fixedCostKeywords = /loyer|salaire|assurance|abonnement|amortissement|location|licence|bail/i;

      txs.forEach(t => {
        if (t.type === "credit" && t.category?.kind === "INCOME") {
          revenue += t.amount;
        } else if (t.type === "debit") {
          const categoryName = t.category?.name || '';

          // Classify based on keywords
          if (variableCostKeywords.test(categoryName)) {
            variableCosts += t.amount;
          } else if (fixedCostKeywords.test(categoryName)) {
            fixedCosts += t.amount;
          } else {
            // Default: treat unknown costs as fixed (more conservative for break-even)
            fixedCosts += t.amount;
          }
        }
      });

      const contributionMargin = revenue > 0 ? (revenue - variableCosts) / revenue : 0;
      const breakEvenRevenue = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
      const safetyMargin = revenue > 0 ? ((revenue - breakEvenRevenue) / revenue) * 100 : 0;

      historyData.push({
        month: monthStart.toISOString().slice(0, 7),
        revenue: Math.round(revenue * 100) / 100,
        breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
        reached: revenue >= breakEvenRevenue,
        safetyMargin: Math.round(safetyMargin * 10) / 10,
        fixedCosts: Math.round(fixedCosts * 100) / 100,
        variableCosts: Math.round(variableCosts * 100) / 100
      });
    }

    res.json({ months, data: historyData });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Breakeven history calculation failed" });
  }
});

// ➤ DSO FORECAST - ML prediction of future DSO
router.get("/dso/forecast", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const horizonDays = parseInt(req.query.horizonDays) || 90;
    const months = Math.max(12, Math.ceil(horizonDays / 30)); // At least 12 months of history

    // Fetch historical DSO data
    const historyData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

      const paidInvoices = await prisma.customerInvoice.findMany({
        where: {
          customer: { companyId },
          status: { in: ['PAID', 'OVERDUE'] },
          paidDate: { gte: monthStart, lte: monthEnd }
        }
      });

      const receivables = await prisma.customerInvoice.aggregate({
        where: {
          customer: { companyId },
          status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
          dueDate: { lte: monthEnd }
        },
        _sum: { amountRemaining: true }
      });

      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalReceivables = receivables._sum.amountRemaining || 0;
      const daysInMonth = new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 0).getDate();
      const dso = totalRevenue > 0 ? (totalReceivables / totalRevenue) * daysInMonth : 0;

      historyData.push({
        date: monthStart.toISOString().split('T')[0],
        value: Math.round(dso * 10) / 10
      });
    }

    // Call Prophet for forecasting
    if (historyData.length < 12) {
      return res.status(400).json({
        error: "Insufficient historical data for forecasting",
        required: 12,
        available: historyData.length
      });
    }

    const prophetData = historyData.map(d => ({ date: d.date, balance: d.value }));
    const forecast = await prophetClient.forecast(prophetData, horizonDays);

    // Transform Prophet response to DSO format
    const predictions = forecast.predictions.map(p => ({
      date: p.ds,
      dso: Math.round(p.yhat * 10) / 10,
      confidence80: {
        upper: Math.round(p.yhat_upper_80 * 10) / 10,
        lower: Math.max(0, Math.round(p.yhat_lower_80 * 10) / 10)
      },
      confidence95: {
        upper: Math.round(p.yhat_upper_95 * 10) / 10,
        lower: Math.max(0, Math.round(p.yhat_lower_95 * 10) / 10)
      }
    }));

    res.json({
      horizonDays,
      historical: historyData,
      forecast: predictions,
      model: {
        type: "prophet",
        trainedOn: historyData.length,
        kpiType: "DSO"
      }
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "DSO forecasting failed", details: err.message });
  }
});

// ➤ EBITDA FORECAST - ML prediction of future EBITDA margin
router.get("/ebitda/forecast", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const horizonDays = parseInt(req.query.horizonDays) || 90;
    const months = Math.max(12, Math.ceil(horizonDays / 30));

    const historyData = [];
    const daKeywords = /amortissement|dépréciation|dotation|provision/i;
    const cogsKeywords = /achat|matière|fourniture|marchandise/i;

    for (let i = months - 1; i >= 0; i--) {
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

      const txs = await prisma.transaction.findMany({
        where: {
          account: { companyId },
          occurredAt: { gte: monthStart, lte: monthEnd }
        },
        include: { category: { select: { name: true, kind: true } } }
      });

      let revenue = 0, cogs = 0, opex = 0, da = 0;

      txs.forEach(t => {
        const isDA = t.category && daKeywords.test(t.category.name);
        const isCOGS = t.category && cogsKeywords.test(t.category.name);

        if (t.type === "credit" && t.category?.kind === "INCOME") {
          revenue += t.amount;
        } else if (t.type === "debit") {
          if (isDA) {
            da += t.amount;
          } else if (isCOGS) {
            cogs += t.amount;
          } else {
            opex += t.amount;
          }
        }
      });

      const operatingProfit = revenue - cogs - opex;
      const ebitda = operatingProfit + da;
      const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

      historyData.push({
        date: monthStart.toISOString().split('T')[0],
        value: Math.round(ebitdaMargin * 10) / 10
      });
    }

    if (historyData.length < 12) {
      return res.status(400).json({
        error: "Insufficient historical data for forecasting",
        required: 12,
        available: historyData.length
      });
    }

    const prophetData = historyData.map(d => ({ date: d.date, balance: d.value }));
    const forecast = await prophetClient.forecast(prophetData, horizonDays);

    const predictions = forecast.predictions.map(p => ({
      date: p.ds,
      ebitdaMargin: Math.round(p.yhat * 10) / 10,
      confidence80: {
        upper: Math.round(p.yhat_upper_80 * 10) / 10,
        lower: Math.round(p.yhat_lower_80 * 10) / 10
      },
      confidence95: {
        upper: Math.round(p.yhat_upper_95 * 10) / 10,
        lower: Math.round(p.yhat_lower_95 * 10) / 10
      }
    }));

    res.json({
      horizonDays,
      historical: historyData,
      forecast: predictions,
      model: {
        type: "prophet",
        trainedOn: historyData.length,
        kpiType: "EBITDA_MARGIN"
      }
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "EBITDA forecasting failed", details: err.message });
  }
});

// ➤ BFR FORECAST - ML prediction of future working capital
router.get("/bfr/forecast", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const horizonDays = parseInt(req.query.horizonDays) || 90;
    const months = Math.max(12, Math.ceil(horizonDays / 30));

    const historyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
      const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);

      const receivables = await prisma.customerInvoice.aggregate({
        where: {
          customer: { companyId },
          status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
          createdAt: { lte: monthEnd }
        },
        _sum: { amountRemaining: true }
      });

      const payables = await prisma.supplierInvoice.aggregate({
        where: {
          companyId,
          status: { in: ['PENDING', 'SCHEDULED', 'OVERDUE', 'PARTIAL'] },
          createdAt: { lte: monthEnd }
        },
        _sum: { amount: true }
      });

      const totalReceivables = receivables._sum.amountRemaining || 0;
      const totalPayables = payables._sum.amount || 0;
      const bfr = totalReceivables - totalPayables;

      historyData.push({
        date: monthStart.toISOString().split('T')[0],
        value: Math.round(bfr * 100) / 100
      });
    }

    if (historyData.length < 12) {
      return res.status(400).json({
        error: "Insufficient historical data for forecasting",
        required: 12,
        available: historyData.length
      });
    }

    const prophetData = historyData.map(d => ({ date: d.date, balance: d.value }));
    const forecast = await prophetClient.forecast(prophetData, horizonDays);

    const predictions = forecast.predictions.map(p => ({
      date: p.ds,
      bfr: Math.round(p.yhat * 100) / 100,
      confidence80: {
        upper: Math.round(p.yhat_upper_80 * 100) / 100,
        lower: Math.round(p.yhat_lower_80 * 100) / 100
      },
      confidence95: {
        upper: Math.round(p.yhat_upper_95 * 100) / 100,
        lower: Math.round(p.yhat_lower_95 * 100) / 100
      }
    }));

    res.json({
      horizonDays,
      historical: historyData,
      forecast: predictions,
      model: {
        type: "prophet",
        trainedOn: historyData.length,
        kpiType: "BFR"
      }
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "BFR forecasting failed", details: err.message });
  }
});

module.exports = router;
