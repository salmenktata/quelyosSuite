const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

// ➤ GET /kpi-alerts - List all KPI alerts for the company
router.get("/", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const alerts = await prisma.kPIAlert.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        triggers: {
          orderBy: { triggeredAt: "desc" },
          take: 5,
        },
      },
    });

    res.json(alerts);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch KPI alerts" });
  }
});

// ➤ POST /kpi-alerts - Create a new KPI alert
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const companyId = req.user.companyId;

    const { name, kpiType, condition, threshold, emailEnabled, emailRecipients, cooldownHours } = req.body;

    if (!name || !kpiType || !condition || threshold === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const alert = await prisma.kPIAlert.create({
      data: {
        userId,
        companyId,
        name,
        kpiType,
        condition,
        threshold: parseFloat(threshold),
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        emailRecipients: emailRecipients || [],
        cooldownHours: cooldownHours || 24,
      },
    });

    res.json(alert);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to create KPI alert" });
  }
});

// ➤ PATCH /kpi-alerts/:id - Update KPI alert
router.patch("/:id", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const id = parseInt(req.params.id);

    // Verify ownership
    const existing = await prisma.kPIAlert.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const { name, condition, threshold, isActive, emailEnabled, emailRecipients, cooldownHours } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (condition !== undefined) updates.condition = condition;
    if (threshold !== undefined) updates.threshold = parseFloat(threshold);
    if (isActive !== undefined) updates.isActive = isActive;
    if (emailEnabled !== undefined) updates.emailEnabled = emailEnabled;
    if (emailRecipients !== undefined) updates.emailRecipients = emailRecipients;
    if (cooldownHours !== undefined) updates.cooldownHours = cooldownHours;

    const alert = await prisma.kPIAlert.update({
      where: { id },
      data: updates,
    });

    res.json(alert);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to update KPI alert" });
  }
});

// ➤ DELETE /kpi-alerts/:id - Delete KPI alert
router.delete("/:id", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const id = parseInt(req.params.id);

    // Verify ownership
    const existing = await prisma.kPIAlert.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      return res.status(404).json({ error: "Alert not found" });
    }

    await prisma.kPIAlert.delete({ where: { id } });
    res.json({ message: "Alert deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to delete KPI alert" });
  }
});

// ➤ GET /kpi-alerts/triggers - Get recent alert triggers
router.get("/triggers", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const limit = parseInt(req.query.limit) || 50;

    const triggers = await prisma.kPIAlertTrigger.findMany({
      where: {
        alert: { companyId },
      },
      orderBy: { triggeredAt: "desc" },
      take: limit,
      include: {
        alert: {
          select: {
            id: true,
            name: true,
            kpiType: true,
            condition: true,
          },
        },
      },
    });

    res.json(triggers);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch alert triggers" });
  }
});

// ➤ POST /kpi-alerts/check - Check all KPI alerts and trigger if needed
router.post("/check", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Fetch all active alerts
    const alerts = await prisma.kPIAlert.findMany({
      where: {
        companyId,
        isActive: true,
      },
    });

    const triggered = [];

    // For each alert, fetch the current KPI value and check threshold
    for (const alert of alerts) {
      let currentValue = null;

      // Fetch KPI data based on alert type
      switch (alert.kpiType) {
        case "DSO": {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const receivables = await prisma.customerInvoice.aggregate({
            where: {
              customer: { companyId },
              status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
            },
            _sum: { amountRemaining: true },
          });

          const paidInvoices = await prisma.customerInvoice.findMany({
            where: {
              customer: { companyId },
              status: { in: ["PAID", "OVERDUE"] },
              paidDate: { gte: thirtyDaysAgo, lte: now },
            },
          });

          const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
          const totalReceivables = receivables._sum.amountRemaining || 0;
          currentValue = totalRevenue > 0 ? (totalReceivables / totalRevenue) * 30 : 0;
          break;
        }

        case "EBITDA": {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const txs = await prisma.transaction.findMany({
            where: {
              account: { companyId },
              date: { gte: thirtyDaysAgo, lte: now },
            },
            include: { category: { select: { name: true, kind: true } } },
          });

          const daKeywords = /amortissement|dépréciation|dotation|provision/i;
          const cogsKeywords = /achat|matière|fourniture|marchandise/i;

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
          currentValue = revenue > 0 ? (ebitda / revenue) * 100 : 0; // EBITDA margin in %
          break;
        }

        case "BFR": {
          const receivables = await prisma.customerInvoice.aggregate({
            where: {
              customer: { companyId },
              status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
            },
            _sum: { amountRemaining: true },
          });

          const payables = await prisma.supplierInvoice.aggregate({
            where: {
              companyId,
              status: { in: ["PENDING", "SCHEDULED", "OVERDUE", "PARTIAL"] },
            },
            _sum: { amount: true },
          });

          const totalReceivables = receivables._sum.amountRemaining || 0;
          const totalPayables = payables._sum.amount || 0;
          currentValue = totalReceivables - totalPayables;
          break;
        }

        case "BREAKEVEN": {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const txs = await prisma.transaction.findMany({
            where: {
              account: { companyId },
              date: { gte: thirtyDaysAgo, lte: now },
            },
            include: { category: { select: { kind: true, costNature: true } } },
          });

          let revenue = 0, fixedCosts = 0, variableCosts = 0;

          txs.forEach(t => {
            if (t.type === "credit" && t.category?.kind === "INCOME") {
              revenue += t.amount;
            } else if (t.type === "debit") {
              switch (t.category?.costNature) {
                case "FIXED":
                  fixedCosts += t.amount;
                  break;
                case "VARIABLE":
                  variableCosts += t.amount;
                  break;
                case "MIXED":
                  fixedCosts += t.amount / 2;
                  variableCosts += t.amount / 2;
                  break;
              }
            }
          });

          const contributionMargin = revenue > 0 ? (revenue - variableCosts) / revenue : 0;
          const breakEvenRevenue = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;

          // For BREAKEVEN, current value is the safety margin in %
          currentValue = revenue > 0 ? ((revenue - breakEvenRevenue) / revenue) * 100 : 0;
          break;
        }
      }

      if (currentValue === null) continue;

      // Check if threshold is met
      let thresholdMet = false;
      switch (alert.condition) {
        case "ABOVE":
          thresholdMet = currentValue > alert.threshold;
          break;
        case "BELOW":
          thresholdMet = currentValue < alert.threshold;
          break;
        case "EQUALS":
          thresholdMet = Math.abs(currentValue - alert.threshold) < 0.01;
          break;
      }

      if (thresholdMet) {
        // Check cooldown
        const now = new Date();
        if (alert.lastTriggeredAt) {
          const hoursSinceLastTrigger = (now - alert.lastTriggeredAt) / (1000 * 60 * 60);
          if (hoursSinceLastTrigger < alert.cooldownHours) {
            continue; // Skip, still in cooldown
          }
        }

        // Create trigger
        const trigger = await prisma.kPIAlertTrigger.create({
          data: {
            alertId: alert.id,
            value: currentValue,
            threshold: alert.threshold,
            context: {
              kpiType: alert.kpiType,
              condition: alert.condition,
            },
          },
        });

        // Update lastTriggeredAt
        await prisma.kPIAlert.update({
          where: { id: alert.id },
          data: { lastTriggeredAt: now },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: "CASH_ALERT", // Reusing this for KPI alerts
            title: `🚨 Alerte KPI: ${alert.name}`,
            message: `${alert.kpiType}: ${currentValue.toFixed(2)} ${alert.condition === "ABOVE" ? ">" : alert.condition === "BELOW" ? "<" : "="} ${alert.threshold}`,
            actionUrl: `/dashboard/reporting/${alert.kpiType.toLowerCase()}`,
            metadata: {
              alertId: alert.id,
              triggerId: trigger.id,
              kpiType: alert.kpiType,
              value: currentValue,
              threshold: alert.threshold,
            },
          },
        });

        triggered.push({
          alert: {
            id: alert.id,
            name: alert.name,
            kpiType: alert.kpiType,
          },
          trigger,
        });
      }
    }

    res.json({
      message: `Checked ${alerts.length} alerts, ${triggered.length} triggered`,
      triggered,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to check KPI alerts" });
  }
});

module.exports = router;
