/**
 * Transactions Routes - Odoo Integration (Double Write Strategy)
 *
 * Maps to account.move + account.move.line (Journal Entries)
 * COMPLEX: Odoo requires balanced entries (debit = credit)
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { OdooRPC } = require("@quelyos/odoo");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createTransactionSchema, updateTransactionSchema } = require("../schemas/validation");
const { getOrCreateVatSettings, computeAmounts, toDisplay } = require("../utils/vat");
const { checkBudgetAlerts } = require("./notifications");
const { checkTransactionLimit } = require("../middleware/paywall");
const redisClient = require("../services/redis-client");
const { getOdooId, storeMapping, getOdooCompanyId } = require("../utils/odoo-mapping");

const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

// Helper: Invalidate cache
async function invalidateDashboardCache(companyId) {
  try {
    const pattern = `dashboard:overview:${companyId}:*`;
    await redisClient.delPattern(pattern);
    logger.info(`Invalidated dashboard cache for company ${companyId}`);
  } catch (error) {
    logger.error(`Failed to invalidate cache:`, error);
  }
}

// ---------- CREATE TRANSACTION (DOUBLE WRITE) ----------
router.post("/", auth, checkTransactionLimit, validate(createTransactionSchema), async (req, res) => {
  try {
    const {
      amount,
      type,
      description,
      accountId,
      categoryId,
      paymentFlowId,
      occurredAt,
      scheduledFor,
      status
    } = req.body;

    // Validate account ownership
    const account = await prisma.account.findFirst({
      where: { id: Number(accountId), companyId: req.user.companyId }
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // STEP 1: Create in Prisma (existing behavior)
    const settings = await getOrCreateVatSettings(req.user.companyId);
    const { amountHT, amountTTC, vatRate, vatMode } = computeAmounts(req.body, settings);

    const prismaTransaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        amountHT,
        amountTTC,
        vatRate,
        vatMode,
        type: type || 'debit',
        description: description || null,
        accountId: Number(accountId),
        categoryId: categoryId ? Number(categoryId) : null,
        paymentFlowId: paymentFlowId ? Number(paymentFlowId) : null,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: status || 'CONFIRMED'
      },
      include: {
        account: true,
        category: true,
        paymentFlow: true
      }
    });

    // Update account balance
    const balanceChange = type === 'credit' ? parseFloat(amount) : -parseFloat(amount);
    await prisma.account.update({
      where: { id: Number(accountId) },
      data: { balance: { increment: balanceChange } }
    });

    // STEP 2: Create in Odoo (account.move + account.move.line)
    try {
      const odooCompanyId = await getOdooCompanyId(req.user.companyId);
      const odooAccountId = await getOdooId('Account', accountId);
      const odooCategoryId = categoryId ? await getOdooId('Category', categoryId) : false;

      // Get general journal
      const journalId = await getGeneralJournalId(odooCompanyId);

      // Create account.move (journal entry)
      const move = await odoo.create('account.move', {
        move_type: 'entry',
        date: occurredAt || new Date().toISOString().split('T')[0],
        ref: description || 'Transaction',
        journal_id: journalId,
        company_id: odooCompanyId
      });

      if (move && move.id) {
        // Create move lines (balanced entry required)
        const transactionAmount = parseFloat(amount);

        // Line 1: Main transaction line
        const line1Data = {
          move_id: move.id,
          account_id: odooAccountId,
          name: description || '/',
          date: occurredAt || new Date().toISOString().split('T')[0],
          analytic_account_id: odooCategoryId || false,
          debit: type === 'debit' ? transactionAmount : 0,
          credit: type === 'credit' ? transactionAmount : 0
        };

        const moveLine = await odoo.create('account.move.line', line1Data);

        // Line 2: Balancing counterpart line
        const counterpartAccountId = await getCounterpartAccount(odooCompanyId);

        const line2Data = {
          move_id: move.id,
          account_id: counterpartAccountId,
          name: description || '/',
          date: occurredAt || new Date().toISOString().split('T')[0],
          debit: type === 'credit' ? transactionAmount : 0,  // Opposite of line1
          credit: type === 'debit' ? transactionAmount : 0
        };

        await odoo.create('account.move.line', line2Data);

        // Post the move (validate)
        if (status === 'CONFIRMED') {
          await odoo.call('account.move', 'action_post', [move.id]);
        }

        // Store mapping Transaction → account.move.line
        if (moveLine && moveLine.id) {
          await storeMapping('Transaction', prismaTransaction.id, 'account.move.line', moveLine.id);
          logger.info(`[Transactions] Created: Prisma#${prismaTransaction.id} <-> Odoo#${moveLine.id}`);
        }
      }

    } catch (odooError) {
      logger.error(`[Transactions] Odoo creation failed:`, odooError);
      logger.warn(`[Transactions] Transaction created in Prisma only (ID: ${prismaTransaction.id})`);
    }

    // Check budget alerts
    await checkBudgetAlerts(req.user.companyId);

    // Invalidate cache
    await invalidateDashboardCache(req.user.companyId);

    res.json(toDisplay(prismaTransaction, settings));

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transaction creation failed" });
  }
});

// ---------- LIST TRANSACTIONS ----------
router.get("/", auth, async (req, res) => {
  try {
    const archived = req.query.archived === "true";
    const settings = await getOrCreateVatSettings(req.user.companyId);

    // Read from Prisma (current behavior)
    const rawTransactions = await prisma.transaction.findMany({
      where: {
        archived,
        account: { companyId: req.user.companyId }
      },
      include: {
        account: true,
        category: true,
        paymentFlow: true
      },
      orderBy: { occurredAt: "desc" }
    });

    const transactions = rawTransactions.map((t) => toDisplay(t, settings));

    res.json(transactions);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch transactions" });
  }
});

// ---------- UPDATE TRANSACTION (DOUBLE WRITE) ----------
router.put("/:id", auth, validate(updateTransactionSchema), async (req, res) => {
  try {
    const transactionId = Number(req.params.id);

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { companyId: req.user.companyId }
      },
      include: { account: true }
    });

    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // STEP 1: Update Prisma
    const settings = await getOrCreateVatSettings(req.user.companyId);
    const { amountHT, amountTTC, vatRate, vatMode } = computeAmounts(req.body, settings);

    const updateData = {};
    if (req.body.amount !== undefined) {
      updateData.amount = parseFloat(req.body.amount);
      updateData.amountHT = amountHT;
      updateData.amountTTC = amountTTC;
      updateData.vatRate = vatRate;
      updateData.vatMode = vatMode;
    }
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.categoryId !== undefined) updateData.categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
    if (req.body.occurredAt !== undefined) updateData.occurredAt = new Date(req.body.occurredAt);
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        account: true,
        category: true,
        paymentFlow: true
      }
    });

    // Update account balance if amount changed
    if (req.body.amount !== undefined) {
      const oldAmount = existing.amount;
      const newAmount = parseFloat(req.body.amount);
      const balanceDiff = existing.type === 'credit'
        ? (newAmount - oldAmount)
        : (oldAmount - newAmount);

      await prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: balanceDiff } }
      });
    }

    // STEP 2: Update Odoo
    // NOTE: Updating posted journal entries is complex in Odoo
    // Typically requires creating reverse entry + new entry
    // For now, we log warning
    try {
      const odooId = await getOdooId('Transaction', transactionId);
      if (odooId) {
        logger.warn(`[Transactions] Odoo update skipped for posted entry Odoo#${odooId} - requires reverse + new entry`);
        // TODO: Implement reverse + new entry logic if needed
      }
    } catch (odooError) {
      logger.error(`[Transactions] Odoo update check failed:`, odooError);
    }

    await invalidateDashboardCache(req.user.companyId);

    res.json(toDisplay(updated, settings));

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transaction update failed" });
  }
});

// ---------- DELETE TRANSACTION (DOUBLE DELETE) ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    const transactionId = Number(req.params.id);

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { companyId: req.user.companyId }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Delete from Odoo first
    // NOTE: Must cancel move before deleting
    try {
      const odooId = await getOdooId('Transaction', transactionId);
      if (odooId) {
        // Get move_id from move.line
        const moveLine = await odoo.read('account.move.line', [odooId], ['move_id']);
        if (moveLine && moveLine[0] && moveLine[0].move_id) {
          const moveId = moveLine[0].move_id[0];

          // Cancel move first (back to draft)
          await odoo.call('account.move', 'button_draft', [moveId]);

          // Then delete
          await odoo.unlink('account.move', [moveId]);

          logger.info(`[Transactions] Deleted move from Odoo: ${moveId}`);
        }
      }
    } catch (odooError) {
      logger.error(`[Transactions] Odoo deletion failed:`, odooError);
    }

    // Update account balance before deleting
    const balanceChange = transaction.type === 'credit'
      ? -transaction.amount
      : transaction.amount;

    await prisma.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: balanceChange } }
    });

    // Delete from Prisma
    await prisma.transaction.delete({ where: { id: transactionId } });

    await invalidateDashboardCache(req.user.companyId);

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Transaction deletion failed" });
  }
});

/**
 * Helper: Get general journal for company
 */
async function getGeneralJournalId(odooCompanyId) {
  try {
    const journals = await odoo.search('account.journal', [
      ['type', '=', 'general'],
      ['company_id', '=', odooCompanyId]
    ], { limit: 1 });

    if (journals && journals[0]) {
      return journals[0].id;
    }

    // Fallback: any journal
    const anyJournal = await odoo.search('account.journal', [
      ['company_id', '=', odooCompanyId]
    ], { limit: 1 });

    return anyJournal && anyJournal[0] ? anyJournal[0].id : 1;

  } catch (error) {
    logger.warn(`[Transactions] Could not get journal:`, error);
    return 1;
  }
}

/**
 * Helper: Get counterpart account for balancing entries
 * Typically: 471000 "Compte d'attente" or 580000 "Virements internes"
 */
async function getCounterpartAccount(odooCompanyId) {
  try {
    // Search suspense/waiting account
    const accounts = await odoo.search('account.account', [
      ['code', '=', '471000'],
      ['company_id', '=', odooCompanyId]
    ], { limit: 1 });

    if (accounts && accounts[0]) {
      return accounts[0].id;
    }

    // Fallback: any current asset account
    const fallback = await odoo.search('account.account', [
      ['account_type', '=', 'asset_current'],
      ['company_id', '=', odooCompanyId]
    ], { limit: 1 });

    return fallback && fallback[0] ? fallback[0].id : 1;

  } catch (error) {
    logger.warn(`[Transactions] Could not get counterpart account:`, error);
    return 1;
  }
}

module.exports = router;
