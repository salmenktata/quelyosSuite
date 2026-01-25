const { PrismaClient } = require("@prisma/client");
const logger = require("../../logger");
const StripeService = require("../services/StripeService");

const prisma = new PrismaClient();

/**
 * Freemium Plan Limits
 */
const PLAN_LIMITS = {
  FREE: {
    accounts: 2,
    transactionsPerMonth: 100,
    users: 1,
    forecastMonths: 1, // Only 1 month forecasting for FREE
  },
  PRO: {
    accounts: -1, // unlimited
    transactionsPerMonth: -1,
    users: 1,
    forecastMonths: 12,
  },
  EXPERT: {
    accounts: -1,
    transactionsPerMonth: -1,
    users: 10,
    forecastMonths: 24,
  },
};

/**
 * Check if company has reached account limit
 */
async function checkAccountLimit(req, res, next) {
  try {
    const companyId = req.user.companyId;

    // Get company's plan
    const plan = await StripeService.getCompanyPlan(companyId);
    const limits = PLAN_LIMITS[plan];

    // If unlimited accounts, skip check
    if (limits.accounts === -1) {
      return next();
    }

    // Count existing accounts
    const accountCount = await prisma.account.count({
      where: { companyId },
    });

    if (accountCount >= limits.accounts) {
      logger.warn(
        `[Paywall] Company ${companyId} (${plan}) reached account limit: ${accountCount}/${limits.accounts}`
      );

      return res.status(403).json({
        error: "Limite d'abonnement atteinte",
        message: `Votre plan ${plan} est limité à ${limits.accounts} compte(s). Passez au plan Pro pour des comptes illimités.`,
        limit: {
          current: accountCount,
          max: limits.accounts,
          feature: "accounts",
        },
        upgrade: {
          plan: "PRO",
          url: "/dashboard/settings/billing",
        },
      });
    }

    next();
  } catch (error) {
    logger.error("[Paywall] Error checking account limit:", error);
    // Don't block on error, just log
    next();
  }
}

/**
 * Check if company has reached transaction limit (for current month)
 */
async function checkTransactionLimit(req, res, next) {
  try {
    const companyId = req.user.companyId;

    // Get company's plan
    const plan = await StripeService.getCompanyPlan(companyId);
    const limits = PLAN_LIMITS[plan];

    // If unlimited transactions, skip check
    if (limits.transactionsPerMonth === -1) {
      return next();
    }

    // Count transactions for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactionCount = await prisma.transaction.count({
      where: {
        account: {
          companyId,
        },
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    if (transactionCount >= limits.transactionsPerMonth) {
      logger.warn(
        `[Paywall] Company ${companyId} (${plan}) reached transaction limit: ${transactionCount}/${limits.transactionsPerMonth}`
      );

      return res.status(403).json({
        error: "Limite d'abonnement atteinte",
        message: `Votre plan ${plan} est limité à ${limits.transactionsPerMonth} transactions/mois. Passez au plan Pro pour des transactions illimitées.`,
        limit: {
          current: transactionCount,
          max: limits.transactionsPerMonth,
          feature: "transactions",
          period: "month",
        },
        upgrade: {
          plan: "PRO",
          url: "/dashboard/settings/billing",
        },
      });
    }

    next();
  } catch (error) {
    logger.error("[Paywall] Error checking transaction limit:", error);
    // Don't block on error, just log
    next();
  }
}

/**
 * Get current usage stats for company
 */
async function getUsageStats(companyId) {
  try {
    const plan = await StripeService.getCompanyPlan(companyId);
    const limits = PLAN_LIMITS[plan];

    // Count accounts
    const accountCount = await prisma.account.count({
      where: { companyId },
    });

    // Count transactions for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactionCount = await prisma.transaction.count({
      where: {
        account: {
          companyId,
        },
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Count users
    const userCount = await prisma.user.count({
      where: { companyId },
    });

    return {
      plan,
      usage: {
        accounts: {
          current: accountCount,
          max: limits.accounts,
          percentage:
            limits.accounts === -1
              ? 0
              : Math.round((accountCount / limits.accounts) * 100),
        },
        transactions: {
          current: transactionCount,
          max: limits.transactionsPerMonth,
          percentage:
            limits.transactionsPerMonth === -1
              ? 0
              : Math.round(
                  (transactionCount / limits.transactionsPerMonth) * 100
                ),
          period: "month",
        },
        users: {
          current: userCount,
          max: limits.users,
          percentage:
            limits.users === -1
              ? 0
              : Math.round((userCount / limits.users) * 100),
        },
      },
      limits,
    };
  } catch (error) {
    logger.error("[Paywall] Error getting usage stats:", error);
    throw error;
  }
}

module.exports = {
  checkAccountLimit,
  checkTransactionLimit,
  getUsageStats,
  PLAN_LIMITS,
};
