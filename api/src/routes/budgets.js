const logger = require("../../logger");

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createBudgetSchema } = require("../schemas/validation");

// CREATE
router.post("/", auth, validate(createBudgetSchema), async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Missing name" });

    const { amount, categoryId, period, startDate, endDate } = req.body;

    // Validate period
    const validPeriods = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"];
    const budgetPeriod = validPeriods.includes(period) ? period : "MONTHLY";

    // For CUSTOM period, endDate is required
    if (budgetPeriod === "CUSTOM" && !endDate) {
      return res.status(400).json({ error: "End date required for custom period" });
    }

    const item = await prisma.budgets.create({
      data: { 
        name, 
        companyId: req.user.companyId,
        amount: amount ? parseFloat(amount) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        period: budgetPeriod,
        startDate: startDate ? new Date(startDate) : null,
        endDate: budgetPeriod === "CUSTOM" && endDate ? new Date(endDate) : null,
      }
    });
    res.json(item);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Creation failed" });
  }
});

// LIST
router.get("/", auth, async (req, res) => {
  try {
    const budgets = await prisma.budgets.findMany({
      where: { companyId: req.user.companyId },
      include: req.query.includeSpending === 'true' ? { category: true } : undefined
    });

    // If includeSpending is requested, calculate spending for each budget
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
    res.status(500).json({ error: "Fetch failed" });
  }
});

// Helper function to calculate budget period
function calculateBudgetPeriod(budget) {
  const start = budget.startDate ? new Date(budget.startDate) : new Date();
  let end = new Date(start);

  switch(budget.period) {
    case 'WEEKLY':
      end.setDate(start.getDate() + 7);
      break;
    case 'MONTHLY':
      end.setMonth(start.getMonth() + 1);
      break;
    case 'QUARTERLY':
      end.setMonth(start.getMonth() + 3);
      break;
    case 'YEARLY':
      end.setFullYear(start.getFullYear() + 1);
      break;
    case 'CUSTOM':
      end = budget.endDate ? new Date(budget.endDate) : end;
      break;
    default:
      end.setMonth(start.getMonth() + 1); // Default to monthly
  }

  return { periodStart: start, periodEnd: end };
}

// GET ONE
router.get("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const item = await prisma.budgets.findFirst({
      where: { id, companyId: req.user.companyId }
    });

    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// GET ONE WITH DETAIL (spending calculation)
router.get("/:id/detail", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

    const budget = await prisma.budgets.findFirst({
      where: { id, companyId: req.user.companyId },
      include: { category: true }
    });

    if (!budget) return res.status(404).json({ error: "Not found" });

    // Calculate current period
    const { periodStart, periodEnd } = calculateBudgetPeriod(budget);

    // Fetch transactions in current period
    const where = {
      account: { companyId: req.user.companyId },
      type: "debit",
      status: "CONFIRMED",
      occurredAt: {
        gte: periodStart,
        lte: periodEnd
      }
    };

    // Filter by category if budget has one
    if (budget.categoryId) {
      where.categoryId = budget.categoryId;
    }

    const transactions = await prisma.transaction.findMany({ where });

    // Calculate spending
    const currentSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
    const percentageUsed = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

    // Determine status
    let status = "ON_TRACK";
    if (percentageUsed >= 100) {
      status = "EXCEEDED";
    } else if (percentageUsed >= 80) {
      status = "WARNING";
    }

    const remainingAmount = budget.amount - currentSpending;

    res.json({
      ...budget,
      currentSpending,
      percentageUsed,
      status,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      remainingAmount,
      transactionCount: transactions.length
    });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetch detail failed" });
  }
});

// UPDATE
router.put("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    
    const name = req.body.name ? String(req.body.name).trim() : null;
    if (name === "") return res.status(400).json({ error: "Missing name" });

    const owned = await prisma.budgets.findFirst({
      where: { id, companyId: req.user.companyId }
    });

    if (!owned) return res.status(404).json({ error: "Not found" });

    const { amount, categoryId, period, startDate, endDate } = req.body;
    
    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount ? parseFloat(amount) : null;
    if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null;
    
    // Validate and set period
    const validPeriods = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"];
    if (period && validPeriods.includes(period)) {
      updateData.period = period;
      
      // For CUSTOM period, endDate is required
      if (period === "CUSTOM" && !endDate) {
        return res.status(400).json({ error: "End date required for custom period" });
      }
    }
    
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const updated = await prisma.budgets.update({
      where: { id },
      data: updateData
    });
    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

    const owned = await prisma.budgets.findFirst({
      where: { id, companyId: req.user.companyId }
    });

    if (!owned) return res.status(404).json({ error: "Not found" });

    await prisma.budgets.delete({
      where: { id }
    });
    res.json({ message: "Budgets deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
