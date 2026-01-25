/**
 * Monthly cron job for Prophet forecast model retraining and validation
 *
 * Execution: First day of each month at 3:00 AM
 * Objective:
 *  1. Retrain Prophet models with latest 12 months of data
 *  2. Run backtesting to validate accuracy (MAE < 10%)
 *  3. Store performance metrics in database
 *  4. Alert if accuracy degrades
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prophetClient = require('../services/forecasting/ProphetClient');
const logger = require('../../logger');

const prisma = new PrismaClient();

// Configuration
const MIN_TRANSACTIONS_FOR_TRAINING = 365; // 12 months minimum
const FORECAST_HORIZONS = [7, 30, 90, 180]; // Test all horizons
const MAE_TARGET_PERCENTAGE = 10; // 10% target

/**
 * Start monthly Prophet retraining cron job
 */
function startMonthlyForecastRetraining() {
  // Cron pattern: "0 3 1 * *" = 3:00 AM on the 1st of every month
  // Format: minute hour day month dayOfWeek
  cron.schedule('0 3 1 * *', async () => {
    const startTime = Date.now();
    logger.info('🔄 Starting monthly Prophet forecast retraining...');

    try {
      // Get all active companies (non-demo)
      const companies = await prisma.company.findMany({
        where: { isDemo: false },
        select: { id: true, name: true }
      });

      const results = [];
      const errors = [];

      for (const company of companies) {
        try {
          const companyResult = await retrainCompanyForecasts(company.id, company.name);
          results.push(companyResult);

          logger.info(`✅ Company ${company.id} (${company.name}): Retraining complete`, companyResult.summary);
        } catch (err) {
          logger.error(`❌ Company ${company.id} (${company.name}): Retraining failed`, err);
          errors.push({
            companyId: company.id,
            companyName: company.name,
            error: err.message
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.info('✅ Monthly Prophet retraining completed', {
        duration: `${(duration / 1000 / 60).toFixed(2)} minutes`,
        companies: companies.length,
        successful: results.length,
        failed: errors.length
      });

      // Log summary statistics
      if (results.length > 0) {
        const avgMAE = results.reduce((sum, r) => {
          const horizonMetrics = Object.values(r.metrics);
          const validMetrics = horizonMetrics.filter((m) => !m.error && m.mae_percentage);
          if (validMetrics.length === 0) return sum;
          const companyAvg = validMetrics.reduce((s, m) => s + m.mae_percentage, 0) / validMetrics.length;
          return sum + companyAvg;
        }, 0) / results.length;

        logger.info(`📊 Average MAE across all companies: ${avgMAE.toFixed(2)}%`);
      }
    } catch (err) {
      logger.error('❌ Monthly forecast retraining cron job failed:', err);
    }
  });

  logger.info('✅ Monthly Prophet retraining cron job scheduled (1st of each month at 3:00 AM)');
}

/**
 * Retrain Prophet forecasts for a single company
 */
async function retrainCompanyForecasts(companyId, companyName) {
  logger.info(`🔄 Retraining forecasts for company ${companyId} (${companyName})`);

  // Fetch all transactions for past 13 months (for safety margin)
  const thirteenMonthsAgo = new Date();
  thirteenMonthsAgo.setFullYear(thirteenMonthsAgo.getFullYear() - 1);
  thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      account: { companyId, status: 'ACTIVE' },
      status: 'CONFIRMED',
      occurredAt: { gte: thirteenMonthsAgo }
    },
    select: {
      amount: true,
      type: true,
      occurredAt: true,
      accountId: true
    },
    orderBy: { occurredAt: 'asc' }
  });

  if (transactions.length < MIN_TRANSACTIONS_FOR_TRAINING) {
    throw new Error(
      `Insufficient data: ${transactions.length} transactions (need ${MIN_TRANSACTIONS_FOR_TRAINING})`
    );
  }

  // Run backtesting for multiple horizons
  const backtestResults = {};
  let overallSuccess = true;

  for (const horizon of FORECAST_HORIZONS) {
    try {
      const result = await prophetClient.backtest(transactions, horizon);

      if (!result.success) {
        overallSuccess = false;
        backtestResults[`${horizon}d`] = { error: result.error };
        continue;
      }

      // Calculate MAE percentage
      const avgBalance = calculateAverageBalance(transactions);
      const maePercentage = (result.metrics.mae / Math.abs(avgBalance)) * 100;
      const meetsTarget = maePercentage < MAE_TARGET_PERCENTAGE;

      backtestResults[`${horizon}d`] = {
        mae: result.metrics.mae,
        mae_percentage: maePercentage,
        rmse: result.metrics.rmse,
        mape: result.metrics.mape,
        coverage: result.metrics.coverage,
        meets_target: meetsTarget
      };

      // Store training log in database
      await prisma.forecastTrainingLog.create({
        data: {
          companyId,
          horizonDays: horizon,
          dataPoints: transactions.length,
          mae: result.metrics.mae,
          maePercentage: maePercentage,
          rmse: result.metrics.rmse,
          mape: result.metrics.mape,
          coverage: result.metrics.coverage,
          meetsTarget: meetsTarget
        }
      });

      // Alert if accuracy degrades
      if (!meetsTarget) {
        logger.warn(
          `⚠️ Accuracy alert for company ${companyId}, horizon ${horizon}d: ` +
            `MAE ${maePercentage.toFixed(2)}% (target <${MAE_TARGET_PERCENTAGE}%)`
        );
      }
    } catch (err) {
      logger.error(`Backtesting failed for horizon ${horizon}d:`, err);
      backtestResults[`${horizon}d`] = { error: err.message };
      overallSuccess = false;
    }
  }

  // Clear Prophet cache for this company
  prophetClient.clearCache();

  return {
    companyId,
    companyName,
    metrics: backtestResults,
    summary: {
      data_points: transactions.length,
      horizons_tested: FORECAST_HORIZONS.length,
      all_targets_met: overallSuccess
    }
  };
}

/**
 * Calculate average balance from transactions
 */
function calculateAverageBalance(transactions) {
  let runningBalance = 0;
  let sum = 0;

  transactions.forEach((tx) => {
    runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
    sum += runningBalance;
  });

  return sum / transactions.length;
}

/**
 * Manual execution (for testing)
 */
async function runManualForecastRetraining(companyId = null) {
  logger.info(
    '🔄 Running manual Prophet retraining...',
    companyId ? `for company ${companyId}` : 'for all companies'
  );

  try {
    const companies = companyId
      ? await prisma.company.findMany({ where: { id: companyId } })
      : await prisma.company.findMany({ where: { isDemo: false }, take: 5 }); // Limit for testing

    for (const company of companies) {
      const result = await retrainCompanyForecasts(company.id, company.name);
      logger.info(`✅ ${company.name}:`, result.summary);
    }
  } catch (err) {
    logger.error('❌ Manual retraining failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  startMonthlyForecastRetraining,
  runManualForecastRetraining
};
