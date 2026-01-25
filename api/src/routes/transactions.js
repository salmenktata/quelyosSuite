const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createTransactionSchema, updateTransactionSchema } = require("../schemas/validation");
const { getOrCreateVatSettings, computeAmounts, toDisplay } = require("../utils/vat");
const { checkBudgetAlerts } = require("./notifications");
const { checkTransactionLimit } = require("../middleware/paywall");
const redisClient = require("../services/redis-client");

// Helper function to invalidate dashboard cache for a company
async function invalidateDashboardCache(companyId) {
  try {
    // Clear all dashboard cache entries for this company
    const pattern = `dashboard:overview:${companyId}:*`;
    await redisClient.delPattern(pattern);
    logger.info(`Invalidated dashboard cache for company ${companyId}`);
  } catch (error) {
    logger.error(`Failed to invalidate cache for company ${companyId}:`, error);
    // Non-blocking - don't throw error
  }
}

// GET all transactions of the authenticated user's company
// Query params: archived=true|false (par défaut: false)
router.get("/", auth, async (req, res) => {
  try {
    const archivedParam = req.query.archived;
    const archived = archivedParam === "true" ? true : false;

    const settings = await getOrCreateVatSettings(req.user.companyId);

    const rawTransactions = await prisma.transaction.findMany({
      where: {
        archived,
        account: {
          companyId: req.user.companyId
        }
      },
      include: { account: true, category: true, paymentFlow: true },
      orderBy: { occurredAt: "desc" }
    });

    const transactions = rawTransactions.map((t) => toDisplay(t, settings));

    res.json(transactions);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// CREATE a transaction
router.post("/", auth, checkTransactionLimit, validate(createTransactionSchema), async (req, res) => {
  try {
    const rawAmount = Number(req.body.amount);
    const type = req.body.type;
    const accountId = Number(req.body.accountId);
    const status = req.body.status || "CONFIRMED";
    const categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
    const paymentFlowId = req.body.paymentFlowId ? Number(req.body.paymentFlowId) : null;
    const occurredAt = req.body.occurredAt ? new Date(req.body.occurredAt) : new Date();
    const scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : null;
    const description = req.body.description || null;
    const vatRateInput = req.body.vatRate !== undefined ? Number(req.body.vatRate) : undefined;
    const vatModeInput = req.body.vatMode;

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    if (!type || !accountId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!["credit", "debit"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const allowedStatuses = ["CONFIRMED", "PLANNED", "SCHEDULED", "CANCELED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const plannedStatus = status === "PLANNED" || status === "SCHEDULED";
    if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ error: "Invalid scheduledFor" });
    }

    if (plannedStatus && !scheduledFor) {
      return res.status(400).json({ error: "scheduledFor is required when status is PLANNED or SCHEDULED" });
    }

    // Verify account belongs to the same company
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId: req.user.companyId
      }
    });

    if (!account) {
      return res.status(403).json({ error: "Account does not belong to your company" });
    }

    // Validate paymentFlow if provided
    let paymentFlowIdValue = null;
    if (paymentFlowId) {
      const flow = await prisma.paymentFlow.findFirst({
        where: { id: paymentFlowId, accountId, isActive: true }
      });
      if (!flow) {
        return res.status(400).json({ error: "Flux de paiement invalide ou inactif" });
      }
      paymentFlowIdValue = flow.id;
    }

    // Validate category ownership & coherence with transaction type
    let categoryConnect = undefined;
    if (categoryId !== null) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, companyId: req.user.companyId },
        select: { id: true, kind: true }
      });
      if (!category) {
        return res.status(400).json({ error: "Invalid category" });
      }
      if (category.kind === "INCOME" && type !== "credit") {
        return res.status(400).json({ error: "Cette catégorie est réservée aux revenus" });
      }
      if (category.kind === "EXPENSE" && type !== "debit") {
        return res.status(400).json({ error: "Cette catégorie est réservée aux dépenses" });
      }
      categoryConnect = { connect: { id: category.id } };
    }

    const categoryIdValue = categoryConnect?.connect?.id ?? null;

    const settings = await getOrCreateVatSettings(req.user.companyId);
    const amounts = computeAmounts({
      inputAmount: rawAmount,
      settings,
      providedRate: vatRateInput,
      modeOverride: vatModeInput,
    });

    const transaction = await prisma.transaction.create({
      data: {
        amount: amounts.amount,
        amountHT: amounts.amountHT,
        amountTTC: amounts.amountTTC,
        vatRate: amounts.vatRate,
        vatMode: amounts.vatMode,
        type,
        accountId,
        paymentFlowId: paymentFlowIdValue,
        status,
        occurredAt,
        scheduledFor,
        description,
        archived: false,
        categoryId: categoryIdValue
      },
      include: { category: true, paymentFlow: true }
    });

    // Check budget alerts for debit transactions with categories
    if (transaction.type === 'debit' && transaction.status === 'CONFIRMED' && transaction.categoryId) {
      // Fire and forget - don't block the response
      checkBudgetAlerts(req.user.companyId, req.user.id).catch(err =>
        logger.error('Budget alert check failed:', err)
      );
    }

    // F93: Check cash alerts for confirmed debit transactions (real-time evaluation)
    if (transaction.type === 'debit' && transaction.status === 'CONFIRMED') {
      const alertEvaluator = require('../../../services/alert-evaluator.service');
      const alertNotifier = require('../../../services/alert-notifier.service');

      // Fire and forget - don't block the response
      alertEvaluator.evaluateAll(req.user.companyId)
        .then(results => {
          results.forEach(result => {
            if (result.shouldTrigger) {
              alertNotifier.notify(result).catch(err =>
                logger.error('Cash alert notification failed:', err)
              );
            }
          });
        })
        .catch(err => logger.error('Cash alert evaluation failed:', err));
    }

    // Invalidate dashboard cache after transaction creation
    await invalidateDashboardCache(req.user.companyId);

    res.status(201).json(toDisplay(transaction, settings));
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// PATCH a transaction (status / description / occurredAt)
router.patch("/:id", auth, validate(updateTransactionSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status;
    const occurredAt = req.body.occurredAt ? new Date(req.body.occurredAt) : undefined;
    const scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined;
    const description = req.body.description;
    const categoryId = req.body.categoryId !== undefined ? Number(req.body.categoryId) : undefined;
    const paymentFlowId = req.body.paymentFlowId !== undefined ? (req.body.paymentFlowId ? Number(req.body.paymentFlowId) : null) : undefined;
    const rawAmount = req.body.amount !== undefined ? Number(req.body.amount) : undefined;
    const vatRateInput = req.body.vatRate !== undefined ? Number(req.body.vatRate) : undefined;
    const vatModeInput = req.body.vatMode;

    // Verify ownership via account -> company
    const existing = await prisma.transaction.findFirst({
      where: { id, account: { companyId: req.user.companyId } },
      include: { account: true }
    });

    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const settings = await getOrCreateVatSettings(req.user.companyId);

    const data = {};
    const allowedStatuses = ["CONFIRMED", "PLANNED", "SCHEDULED", "CANCELED"];
    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      data.status = status;
    }
    const nextStatus = data.status || existing.status;
    if (occurredAt) data.occurredAt = occurredAt;
    if (scheduledFor) data.scheduledFor = scheduledFor;
    if (description !== undefined) data.description = description;

    if ((nextStatus === "PLANNED" || nextStatus === "SCHEDULED") && !(data.scheduledFor || existing.scheduledFor)) {
      return res.status(400).json({ error: "scheduledFor is required when status is PLANNED or SCHEDULED" });
    }

    // Validate paymentFlowId if provided
    if (paymentFlowId !== undefined) {
      if (paymentFlowId === null) {
        data.paymentFlowId = null;
      } else {
        const flow = await prisma.paymentFlow.findFirst({
          where: { id: paymentFlowId, accountId: existing.accountId, isActive: true }
        });
        if (!flow) {
          return res.status(400).json({ error: "Flux de paiement invalide ou inactif" });
        }
        data.paymentFlowId = flow.id;
      }
    }

    if (categoryId !== undefined) {
      if (categoryId === null || Number.isNaN(categoryId)) {
        data.categoryId = null;
      } else {
        const category = await prisma.category.findFirst({
          where: { id: categoryId, companyId: req.user.companyId },
          select: { id: true, kind: true }
        });
        if (!category) {
          return res.status(400).json({ error: "Invalid category" });
        }
        const nextType = data.type || existing.type;
        if (category.kind === "INCOME" && nextType !== "credit") {
          return res.status(400).json({ error: "Cette catégorie est réservée aux revenus" });
        }
        if (category.kind === "EXPENSE" && nextType !== "debit") {
          return res.status(400).json({ error: "Cette catégorie est réservée aux dépenses" });
        }
        data.categoryId = category.id;
      }
    }

    if (rawAmount !== undefined) {
      if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }
      const computed = computeAmounts({
        inputAmount: rawAmount,
        settings,
        providedRate: vatRateInput,
        modeOverride: vatModeInput || existing.vatMode,
      });
      data.amount = computed.amount;
      data.amountHT = computed.amountHT;
      data.amountTTC = computed.amountTTC;
      data.vatRate = computed.vatRate;
      data.vatMode = computed.vatMode;
    } else if (vatRateInput !== undefined || vatModeInput) {
      // Recalcule avec le montant existant si seul le taux ou le mode change
      const baseAmount = (vatModeInput || existing.vatMode) === "TTC"
        ? existing.amountTTC || existing.amount
        : existing.amountHT || existing.amount;
      const computed = computeAmounts({
        inputAmount: Number(baseAmount),
        settings,
        providedRate: vatRateInput !== undefined ? vatRateInput : existing.vatRate,
        modeOverride: vatModeInput || existing.vatMode,
      });
      data.amount = computed.amount;
      data.amountHT = computed.amountHT;
      data.amountTTC = computed.amountTTC;
      data.vatRate = computed.vatRate;
      data.vatMode = computed.vatMode;
    }

    const updated = await prisma.transaction.update({ where: { id }, data, include: { category: true, paymentFlow: true } });

    // F93: Check cash alerts if status changed to CONFIRMED for debit transactions
    const statusChanged = data.status && data.status !== existing.status;
    const nowConfirmed = updated.status === 'CONFIRMED';
    if (statusChanged && nowConfirmed && updated.type === 'debit') {
      const alertEvaluator = require('../../../services/alert-evaluator.service');
      const alertNotifier = require('../../../services/alert-notifier.service');

      // Fire and forget - don't block the response
      alertEvaluator.evaluateAll(req.user.companyId)
        .then(results => {
          results.forEach(result => {
            if (result.shouldTrigger) {
              alertNotifier.notify(result).catch(err =>
                logger.error('Cash alert notification failed:', err)
              );
            }
          });
        })
        .catch(err => logger.error('Cash alert evaluation failed:', err));
    }

    // Invalidate dashboard cache after transaction update
    await invalidateDashboardCache(req.user.companyId);

    res.json(toDisplay(updated, settings));
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// DELETE a transaction
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid transaction id" });
    }

    // ownership check
    const existing = await prisma.transaction.findFirst({
      where: { id, account: { companyId: req.user.companyId } },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await prisma.transaction.delete({ where: { id: existing.id } });

    // Invalidate dashboard cache after transaction deletion
    await invalidateDashboardCache(req.user.companyId);

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// BULK archive
router.post("/archive", auth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Number.isFinite) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: "No transaction ids provided" });
    }

    // Vérification d'appartenance
    const owned = await prisma.transaction.findMany({
      where: { id: { in: ids }, account: { companyId: req.user.companyId } },
      select: { id: true }
    });
    const ownedIds = owned.map((t) => t.id);
    if (ownedIds.length === 0) {
      return res.status(404).json({ error: "Transactions not found" });
    }

    await prisma.transaction.updateMany({ where: { id: { in: ownedIds } }, data: { archived: true } });

    // Invalidate dashboard cache after bulk archive
    await invalidateDashboardCache(req.user.companyId);

    res.json({ message: "Transactions archivées", count: ownedIds.length });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to archive transactions" });
  }
});

// BULK unarchive
router.post("/unarchive", auth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Number.isFinite) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: "No transaction ids provided" });
    }

    const owned = await prisma.transaction.findMany({
      where: { id: { in: ids }, account: { companyId: req.user.companyId } },
      select: { id: true }
    });
    const ownedIds = owned.map((t) => t.id);
    if (ownedIds.length === 0) {
      return res.status(404).json({ error: "Transactions not found" });
    }

    await prisma.transaction.updateMany({ where: { id: { in: ownedIds } }, data: { archived: false } });

    // Invalidate dashboard cache after bulk unarchive
    await invalidateDashboardCache(req.user.companyId);

    res.json({ message: "Transactions désarchivées", count: ownedIds.length });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to unarchive transactions" });
  }
});

// BULK delete
router.post("/bulk-delete", auth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Number.isFinite) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: "No transaction ids provided" });
    }

    const owned = await prisma.transaction.findMany({
      where: { id: { in: ids }, account: { companyId: req.user.companyId } },
      select: { id: true }
    });
    const ownedIds = owned.map((t) => t.id);
    if (ownedIds.length === 0) {
      return res.status(404).json({ error: "Transactions not found" });
    }

    await prisma.transaction.deleteMany({ where: { id: { in: ownedIds } } });

    // Invalidate dashboard cache after bulk delete
    await invalidateDashboardCache(req.user.companyId);

    res.json({ message: "Transactions supprimées", count: ownedIds.length });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to delete transactions" });
  }
});

module.exports = router;
