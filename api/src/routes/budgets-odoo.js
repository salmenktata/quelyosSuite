/**
 * Budgets Routes - Odoo Integration (Double Write Strategy)
 *
 * Maps to quelyos.budget + quelyos.budget.line models
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { OdooRPC } = require("@quelyos/odoo");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createBudgetSchema } = require("../schemas/validation");
const { getOdooId, getPrismaId, storeMapping, getOdooCompanyId } = require("../utils/odoo-mapping");

const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

// ---------- CREATE BUDGET (DOUBLE WRITE) ----------
router.post("/", auth, validate(createBudgetSchema), async (req, res) => {
  try {
    const { name, amount, categoryId, period, startDate, endDate } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Missing name" });
    }

    const validPeriods = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"];
    const budgetPeriod = validPeriods.includes(period) ? period : "MONTHLY";

    if (budgetPeriod === "CUSTOM" && !endDate) {
      return res.status(400).json({ error: "End date required for custom period" });
    }

    // STEP 1: Create in Prisma (existing)
    const prismaBudget = await prisma.budgets.create({
      data: {
        name: name.trim(),
        companyId: req.user.companyId,
        amount: amount ? parseFloat(amount) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        period: budgetPeriod,
        startDate: startDate ? new Date(startDate) : null,
        endDate: budgetPeriod === "CUSTOM" && endDate ? new Date(endDate) : null,
      }
    });

    // STEP 2: Create in Odoo quelyos.budget
    try {
      const odooCompanyId = await getOdooCompanyId(req.user.companyId);

      // Map period enum (uppercase → lowercase)
      const odooPeriod = budgetPeriod.toLowerCase();

      const odooBudgetData = {
        name: name.trim(),
        company_id: odooCompanyId,
        period: odooPeriod,
        start_date: startDate || new Date().toISOString().split('T')[0],
        state: 'draft',
      };

      // For custom period, set end_date manually
      if (budgetPeriod === "CUSTOM" && endDate) {
        odooBudgetData.end_date = endDate;
      }
      // Otherwise, end_date is auto-computed by Odoo

      const odooBudget = await odoo.create('quelyos.budget', odooBudgetData);

      // Store mapping
      if (odooBudget && odooBudget.id) {
        await storeMapping('Budgets', prismaBudget.id, 'quelyos.budget', odooBudget.id);

        // Create budget line if amount and category provided
        if (amount && categoryId) {
          // Get Odoo category ID (analytic account)
          const odooCategoryId = await getOdooId('Category', categoryId);
          if (odooCategoryId) {
            await odoo.create('quelyos.budget.line', {
              budget_id: odooBudget.id,
              category_id: odooCategoryId,
              amount: parseFloat(amount)
            });
          }
        }

        logger.info(`[Budgets] Created: Prisma#${prismaBudget.id} <-> Odoo#${odooBudget.id}`);
      }

    } catch (odooError) {
      logger.error(`[Budgets] Odoo creation failed:`, odooError);
    }

    res.json(prismaBudget);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Creation failed" });
  }
});

// ---------- LIST BUDGETS ----------
router.get("/", auth, async (req, res) => {
  try {
    // Read from Prisma (current behavior)
    const budgets = await prisma.budgets.findMany({
      where: { companyId: req.user.companyId },
      include: req.query.includeSpending === 'true' ? { category: true } : undefined
    });

    // Calculate spending if requested
    if (req.query.includeSpending === 'true') {
      const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
          const { periodStart, periodEnd } = calculateBudgetPeriod(budget);

          const where = {
            account: { companyId: req.user.companyId },
            type: "debit",
            status: "CONFIRMED",
            occurredAt: { gte: periodStart, lte: periodEnd }
          };

          if (budget.categoryId) {
            where.categoryId = budget.categoryId;
          }

          const transactions = await prisma.transaction.findMany({ where });
          const currentSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
          const percentageUsed = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

          let status = "ON_TRACK";
          if (percentageUsed >= 100) {
            status = "EXCEEDED";
          } else if (percentageUsed >= 80) {
            status = "WARNING";
          }

          return {
            ...budget,
            currentSpending,
            percentageUsed,
            status
          };
        })
      );

      return res.json(budgetsWithSpending);
    }

    res.json(budgets);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch budgets" });
  }
});

// ---------- GET BUDGET BY ID ----------
router.get("/:id", auth, async (req, res) => {
  try {
    const budgetId = Number(req.params.id);

    const budget = await prisma.budgets.findFirst({
      where: {
        id: budgetId,
        companyId: req.user.companyId
      },
      include: {
        category: true,
        budgets: true // budget lines
      }
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Optionally fetch from Odoo
    try {
      const odooId = await getOdooId('Budgets', budgetId);
      if (odooId) {
        const odooBudget = await odoo.read('quelyos.budget', [odooId], [
          'name', 'period', 'start_date', 'end_date', 'state',
          'total_planned', 'total_spent', 'total_remaining', 'percentage_spent'
        ]);

        if (odooBudget && odooBudget[0]) {
          budget.odooData = odooBudget[0];
        }
      }
    } catch (odooError) {
      logger.warn(`[Budgets] Could not fetch Odoo data:`, odooError);
    }

    res.json(budget);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch budget" });
  }
});

// ---------- UPDATE BUDGET (DOUBLE WRITE) ----------
router.put("/:id", auth, async (req, res) => {
  try {
    const budgetId = Number(req.params.id);

    // Check ownership
    const existing = await prisma.budgets.findFirst({
      where: { id: budgetId, companyId: req.user.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // STEP 1: Update Prisma
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.amount !== undefined) updateData.amount = parseFloat(req.body.amount);
    if (req.body.period !== undefined) updateData.period = req.body.period;
    if (req.body.startDate !== undefined) updateData.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;

    const updated = await prisma.budgets.update({
      where: { id: budgetId },
      data: updateData
    });

    // STEP 2: Update Odoo
    try {
      const odooId = await getOdooId('Budgets', budgetId);
      if (odooId) {
        const odooUpdateData = {};
        if (req.body.name) odooUpdateData.name = req.body.name.trim();
        if (req.body.period) odooUpdateData.period = req.body.period.toLowerCase();
        if (req.body.startDate) odooUpdateData.start_date = req.body.startDate;
        if (req.body.endDate) odooUpdateData.end_date = req.body.endDate;

        await odoo.write('quelyos.budget', odooId, odooUpdateData);
        logger.info(`[Budgets] Updated in Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Budgets] Odoo update failed:`, odooError);
    }

    res.json(updated);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ---------- DELETE BUDGET (DOUBLE DELETE) ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    const budgetId = Number(req.params.id);

    const budget = await prisma.budgets.findFirst({
      where: { id: budgetId, companyId: req.user.companyId }
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Delete from Odoo first
    try {
      const odooId = await getOdooId('Budgets', budgetId);
      if (odooId) {
        await odoo.unlink('quelyos.budget', [odooId]);
        logger.info(`[Budgets] Deleted from Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Budgets] Odoo deletion failed:`, odooError);
    }

    // Delete from Prisma
    await prisma.budgets.delete({ where: { id: budgetId } });

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Deletion failed" });
  }
});

/**
 * Helper: Calculate budget period start/end dates
 */
function calculateBudgetPeriod(budget) {
  const start = budget.startDate || new Date();
  let end = budget.endDate;

  if (!end) {
    const periodDays = {
      WEEKLY: 7,
      MONTHLY: 30,
      QUARTERLY: 90,
      YEARLY: 365
    };

    const days = periodDays[budget.period] || 30;
    end = new Date(start);
    end.setDate(end.getDate() + days);
  }

  return {
    periodStart: start,
    periodEnd: end
  };
}

module.exports = router;
