const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { getOrCreateVatSettings, toDisplay } = require("../utils/vat");
const redisClient = require("../services/redis-client");

// Helpers
function normalizeDate(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function dateKey(d) {
  return normalizeDate(d).toISOString().slice(0, 10);
}

function isWithin(date, from, to) {
  const d = normalizeDate(date).getTime();
  return d >= normalizeDate(from).getTime() && d <= normalizeDate(to).getTime();
}

// Dashboard global (réel synthétique pour compat)
router.get("/", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const settings = await getOrCreateVatSettings(companyId);

    const accounts = await prisma.account.findMany({
      where: { companyId, status: "ACTIVE" },
      include: { transactions: true }
    });

    const accountsWithVat = accounts.map((acc) => ({
      ...acc,
      transactions: acc.transactions.map((t) => toDisplay(t, settings)),
    }));

    let totalCredit = 0;
    let totalDebit = 0;

    accountsWithVat.forEach((acc) => {
      acc.transactions.forEach((t) => {
        if (t.status !== "CONFIRMED" || t.archived) return;
        if (t.type === "credit") totalCredit += t.amount;
        else totalDebit += t.amount;
      });
    });

    const balance = totalCredit - totalDebit;

    res.json({
      balance,
      totalCredit,
      totalDebit,
      accounts: accountsWithVat.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: acc.transactions.reduce((sum, t) => {
          if (t.status !== "CONFIRMED" || t.archived) return sum;
          return sum + (t.type === "credit" ? t.amount : -t.amount);
        }, 0)
      }))
    });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

// Forecast 30/60/90j : solde projeté basé sur transactions confirmées (passées) + prévues/futures
router.get("/forecast", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
    const from = normalizeDate(new Date());
    const to = new Date(from);
    to.setDate(to.getDate() + days);

    const settings = await getOrCreateVatSettings(companyId);
    const txsRaw = await prisma.transaction.findMany({
      where: {
        archived: false,
        account: { companyId, status: "ACTIVE" }
      },
      include: {
        account: { select: { id: true, name: true } },
      },
    });

    const txs = txsRaw.map((t) => toDisplay(t, settings));

    const baseBalance = txs.reduce((sum, t) => {
      if (t.status !== "CONFIRMED") return sum;
      if (normalizeDate(t.occurredAt) < from) {
        return sum + (t.type === "credit" ? t.amount : -t.amount);
      }
      return sum;
    }, 0);

    const perAccountMap = new Map();
    txs.forEach((t) => {
      const accId = t.accountId;
      if (!perAccountMap.has(accId)) {
        perAccountMap.set(accId, {
          accountId: accId,
          accountName: t.account?.name || `Compte #${accId}`,
          baseBalance: 0,
          projectedBalance: 0,
          daily: {},
        });
      }
      const entry = perAccountMap.get(accId);
      if (t.status === "CONFIRMED" && normalizeDate(t.occurredAt) < from) {
        entry.baseBalance += t.type === "credit" ? t.amount : -t.amount;
      }
    });

    // Préparer timeline globale
    const daily = {};
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      daily[dateKey(d)] = {
        date: dateKey(d),
        credit: 0,
        debit: 0,
        plannedCredit: 0,
        plannedDebit: 0,
      };
      perAccountMap.forEach((entry) => {
        entry.daily[dateKey(d)] = {
          date: dateKey(d),
          credit: 0,
          debit: 0,
          plannedCredit: 0,
          plannedDebit: 0,
        };
      });
    }

    txs.forEach((t) => {
      const isPlanned = t.status === "PLANNED" || t.status === "SCHEDULED";
      const effectiveDate = isPlanned ? t.scheduledFor : t.occurredAt;
      if (!effectiveDate) return;
      if (!isWithin(effectiveDate, from, to)) return;
      const key = dateKey(effectiveDate);
      const delta = t.type === "credit" ? t.amount : -t.amount;
      const bucket = daily[key];
      if (t.type === "credit") {
        if (isPlanned) bucket.plannedCredit += t.amount; else bucket.credit += t.amount;
      } else {
        if (isPlanned) bucket.plannedDebit += t.amount; else bucket.debit += t.amount;
      }

      const entry = perAccountMap.get(t.accountId);
      const accBucket = entry?.daily?.[key];
      if (entry && accBucket) {
        if (t.type === "credit") {
          if (isPlanned) accBucket.plannedCredit += t.amount; else accBucket.credit += t.amount;
        } else {
          if (isPlanned) accBucket.plannedDebit += t.amount; else accBucket.debit += t.amount;
        }
      }
    });

    let running = baseBalance;
    const dailyList = Object.values(daily).map((row) => {
      const net = row.credit - row.debit + row.plannedCredit - row.plannedDebit;
      running += net;
      return { ...row, balance: running };
    });

    perAccountMap.forEach((entry) => {
      let r = entry.baseBalance;
      entry.daily = Object.values(entry.daily).map((row) => {
        const net = row.credit - row.debit + row.plannedCredit - row.plannedDebit;
        r += net;
        return { ...row, balance: r };
      });
      entry.projectedBalance = r;
    });

    const futureImpact = dailyList[dailyList.length - 1]?.balance - baseBalance;

    res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      days,
      baseBalance,
      projectedBalance: baseBalance + futureImpact,
      futureImpact,
      daily: dailyList,
      perAccount: Array.from(perAccountMap.values()),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Forecast failed" });
  }
});

// Réel (historique) sur fenêtre glissante
router.get("/actuals", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
    const to = normalizeDate(new Date());
    const from = new Date(to);
    from.setDate(from.getDate() - days + 1);

    const settings = await getOrCreateVatSettings(companyId);
    const txsRaw = await prisma.transaction.findMany({
      where: {
        archived: false,
        account: { companyId, status: "ACTIVE" },
        status: "CONFIRMED",
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, kind: true } },
      },
    });
    const txs = txsRaw.map((t) => toDisplay(t, settings));

    const baseBalance = txs.reduce((sum, t) => {
      if (normalizeDate(t.occurredAt) < from) {
        return sum + (t.type === "credit" ? t.amount : -t.amount);
      }
      return sum;
    }, 0);

    const daily = {};
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      daily[dateKey(d)] = { date: dateKey(d), credit: 0, debit: 0 };
    }

    const perAccountMap = new Map();

    txs.forEach((t) => {
      const accId = t.accountId;
      if (!perAccountMap.has(accId)) {
        perAccountMap.set(accId, {
          accountId: accId,
          accountName: t.account?.name || `Compte #${accId}`,
          baseBalance: 0,
          daily: {},
        });
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          perAccountMap.get(accId).daily[dateKey(d)] = {
            date: dateKey(d),
            credit: 0,
            debit: 0,
          };
        }
      }
      if (normalizeDate(t.occurredAt) < from) {
        perAccountMap.get(accId).baseBalance += t.type === "credit" ? t.amount : -t.amount;
      }
    });

    txs.forEach((t) => {
      const key = dateKey(t.occurredAt);
      if (!isWithin(t.occurredAt, from, to)) return;
      const bucket = daily[key];
      if (!bucket) return;
      if (t.type === "credit") bucket.credit += t.amount; else bucket.debit += t.amount;

      const entry = perAccountMap.get(t.accountId);
      const accBucket = entry?.daily?.[key];
      if (entry && accBucket) {
        if (t.type === "credit") accBucket.credit += t.amount; else accBucket.debit += t.amount;
      }
    });

    let running = baseBalance;
    const dailyList = Object.values(daily).map((row) => {
      running += row.credit - row.debit;
      return { ...row, balance: running };
    });

    perAccountMap.forEach((entry) => {
      let r = entry.baseBalance;
      entry.daily = Object.values(entry.daily).map((row) => {
        r += row.credit - row.debit;
        return { ...row, balance: r };
      });
      entry.endBalance = r;
      entry.totalCredit = entry.daily.reduce((s, x) => s + x.credit, 0);
      entry.totalDebit = entry.daily.reduce((s, x) => s + x.debit, 0);
    });

    const totalCredit = dailyList.reduce((s, x) => s + x.credit, 0);
    const totalDebit = dailyList.reduce((s, x) => s + x.debit, 0);
    const endBalance = running;

    // Totaux par catégorie (revenus/dépenses) sur la période
    const incomeMap = new Map();
    const expenseMap = new Map();
    txs.forEach((t) => {
      if (!isWithin(t.occurredAt, from, to)) return;
      const isIncome = t.type === "credit";
      const map = isIncome ? incomeMap : expenseMap;
      const key = t.categoryId || 0;
      if (!map.has(key)) {
        map.set(key, {
          categoryId: t.categoryId,
          name: t.category?.name || "Non catégorisé",
          total: 0,
        });
      }
      const entry = map.get(key);
      entry.total += t.amount;
    });

    const categoryTotals = {
      income: Array.from(incomeMap.values()).sort((a, b) => b.total - a.total),
      expense: Array.from(expenseMap.values()).sort((a, b) => b.total - a.total),
    };

    res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      days,
      baseBalance,
      endBalance,
      totalCredit,
      totalDebit,
      net: totalCredit - totalDebit,
      daily: dailyList,
      perAccount: Array.from(perAccountMap.values()),
      categoryTotals,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Actuals failed" });
  }
});

// Helper function to resolve account IDs based on filters
async function resolveAccountIds({ companyId, portfolioId, accountId }) {
  const accountWhere = { companyId, status: "ACTIVE" };
  if (accountId) {
    accountWhere.id = Number(accountId);
  }

  let accountIds = [];
  if (portfolioId) {
    const pid = Number(portfolioId);
    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        OR: [
          { portfolioId: pid },
          { portfolios: { some: { portfolioId: pid } } },
        ],
      },
      select: { id: true },
    });
    accountIds = accounts.map((a) => a.id);
    if (accountId && !accountIds.includes(Number(accountId))) {
      accountIds = [];
    }
  } else {
    const accounts = await prisma.account.findMany({ where: accountWhere, select: { id: true } });
    accountIds = accounts.map((a) => a.id);
  }
  return accountIds;
}

// Calculate DSO (Days Sales Outstanding)
async function calculateDSO(companyId, accountIds, days) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days);

  // Get revenue transactions (credits)
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
      occurredAt: { gte: fromDate, lte: toDate },
      type: "credit",
    },
    select: { amount: true },
  });

  const revenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Get accounts receivable (outstanding customer balances)
  const customers = await prisma.customer.findMany({
    where: { companyId },
    select: { outstandingBalance: true },
  });

  const receivables = customers.reduce((sum, c) => sum + parseFloat(c.outstandingBalance || 0), 0);

  const dso = revenue > 0 ? (receivables / revenue) * days : 0;

  return {
    value: Math.round(dso),
    trend: dso > 45 ? "down" : dso > 30 ? "stable" : "up",
    reliability: dso > 0 && revenue > 1000 ? "high" : "medium",
    data: { revenue, receivables },
  };
}

// Calculate EBITDA
async function calculateEBITDA(accountIds, days) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days);

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
      occurredAt: { gte: fromDate, lte: toDate },
    },
    select: { amount: true, type: true },
  });

  const revenue = transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const ebitda = revenue - expenses;
  const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

  return {
    value: Math.round(ebitda),
    margin: Math.round(margin * 10) / 10,
    trend: margin > 20 ? "up" : margin > 10 ? "stable" : "down",
    reliability: revenue > 1000 ? "high" : "medium",
    data: { revenue, expenses },
  };
}

// Calculate BFR (Working Capital Requirement)
async function calculateBFR(companyId, accountIds, days) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days);

  // Get accounts receivable (from customer invoices)
  const receivablesData = await prisma.customerInvoice.aggregate({
    where: {
      customer: { companyId },
      status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }
    },
    _sum: { amountRemaining: true }
  });
  const receivables = receivablesData._sum.amountRemaining || 0;

  // Get accounts payable (from supplier invoices)
  const payablesData = await prisma.supplierInvoice.aggregate({
    where: {
      companyId,
      status: { in: ['PENDING', 'SCHEDULED', 'OVERDUE', 'PARTIAL'] }
    },
    _sum: { amount: true }
  });
  const payables = payablesData._sum.amount || 0;

  // Inventory (estimate as 30 days of expenses)
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
      occurredAt: { gte: fromDate, lte: toDate },
      type: "debit",
    },
    select: { amount: true },
  });
  const expenses = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const inventory = (expenses / days) * 30;

  const bfr = receivables + inventory - payables;

  return {
    value: Math.round(bfr),
    trend: bfr < 0 ? "up" : bfr < 50000 ? "stable" : "down",
    reliability: "medium",
    data: { receivables, inventory: Math.round(inventory), payables },
  };
}

// Calculate Break-Even Point
async function calculateBreakEven(accountIds, days) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days);

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
      occurredAt: { gte: fromDate, lte: toDate },
    },
    select: { amount: true, type: true },
  });

  const revenue = transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Estimate fixed vs variable costs (simple heuristic: 60% fixed, 40% variable)
  const fixedCosts = expenses * 0.6;
  const variableCosts = expenses * 0.4;

  const variableCostRatio = revenue > 0 ? variableCosts / revenue : 0.4;
  const contributionMargin = 1 - variableCostRatio;

  const breakEven = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
  const reachedPercent = breakEven > 0 ? (revenue / breakEven) * 100 : 0;

  return {
    value: Math.round(breakEven),
    reachedPercent: Math.round(reachedPercent * 10) / 10,
    trend: reachedPercent > 100 ? "up" : reachedPercent > 80 ? "stable" : "down",
    reliability: revenue > 1000 ? "medium" : "low",
    data: { revenue, fixedCosts: Math.round(fixedCosts), variableCosts: Math.round(variableCosts), contributionMargin },
  };
}

// Generate AI insights based on real data
async function generateInsights(companyId, accountIds, kpis, days) {
  const insights = [];

  // Insight 1: DSO Alert
  if (kpis.dso.value > 45) {
    insights.push({
      type: "warning",
      priority: "high",
      title: "DSO Exceeds Target",
      description: `Your Days Sales Outstanding is ${kpis.dso.value} days, above the healthy 45-day threshold. Consider following up on overdue invoices.`,
      action: "View Overdue Invoices",
      actionUrl: "/dashboard/reporting/dso",
    });
  }

  // Insight 2: EBITDA Performance
  if (kpis.ebitda.margin > 20) {
    insights.push({
      type: "success",
      priority: "medium",
      title: "Strong Profitability",
      description: `Your EBITDA margin is ${kpis.ebitda.margin}%, indicating healthy profitability. Keep up the excellent work!`,
      action: "View Details",
      actionUrl: "/dashboard/reporting/ebitda",
    });
  } else if (kpis.ebitda.margin < 10) {
    insights.push({
      type: "warning",
      priority: "high",
      title: "Low Profitability",
      description: `Your EBITDA margin is ${kpis.ebitda.margin}%, below the healthy 10% threshold. Review your cost structure.`,
      action: "Analyze Costs",
      actionUrl: "/dashboard/reporting/ebitda",
    });
  }

  // Insight 3: Working Capital
  if (kpis.bfr.value < 0) {
    insights.push({
      type: "success",
      priority: "medium",
      title: "Negative Working Capital",
      description: "Your suppliers are effectively financing your operations - a strong position!",
      action: "View BFR Details",
      actionUrl: "/dashboard/reporting/bfr",
    });
  } else if (kpis.bfr.value > 100000) {
    insights.push({
      type: "info",
      priority: "medium",
      title: "High Working Capital Need",
      description: `Your BFR is €${(kpis.bfr.value / 1000).toFixed(0)}K. Consider optimizing payment terms or inventory levels.`,
      action: "Optimize BFR",
      actionUrl: "/dashboard/reporting/bfr",
    });
  }

  // Insight 4: Break-Even Status
  if (kpis.breakEven.reachedPercent > 100) {
    insights.push({
      type: "success",
      priority: "medium",
      title: "Above Break-Even",
      description: `You've reached ${kpis.breakEven.reachedPercent}% of your break-even point - generating profit!`,
      action: "View Analysis",
      actionUrl: "/dashboard/reporting/breakeven",
    });
  } else if (kpis.breakEven.reachedPercent < 80 && kpis.breakEven.value > 0) {
    insights.push({
      type: "warning",
      priority: "high",
      title: "Below Break-Even Target",
      description: `You're at ${kpis.breakEven.reachedPercent}% of break-even. Focus on increasing revenue or reducing fixed costs.`,
      action: "View Strategy",
      actionUrl: "/dashboard/reporting/breakeven",
    });
  }

  // Insight 5: Category spending analysis
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const categorySpending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
      occurredAt: { gte: fromDate, lte: new Date() },
      type: "debit",
      categoryId: { not: null },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 1,
  });

  if (categorySpending.length > 0 && categorySpending[0].categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categorySpending[0].categoryId },
      select: { name: true },
    });

    if (category) {
      insights.push({
        type: "info",
        priority: "low",
        title: "Top Spending Category",
        description: `${category.name} is your highest expense category at €${(parseFloat(categorySpending[0]._sum.amount) / 1000).toFixed(1)}K.`,
        action: "View Categories",
        actionUrl: "/dashboard/transactions",
      });
    }
  }

  // Sort by priority and return top 3
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  return insights
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}

// Generate priority actions/alerts
async function generatePriorityActions(companyId, accountIds, kpis, days) {
  const actions = [];

  // Action 1: Overdue invoices (if DSO is high)
  if (kpis.dso.value > 45) {
    const overdueCustomers = await prisma.customer.findMany({
      where: {
        companyId,
        outstandingBalance: { gt: 0 },
      },
      orderBy: { outstandingBalance: 'desc' },
      take: 3,
      select: { name: true, outstandingBalance: true, email: true },
    });

    if (overdueCustomers.length > 0) {
      actions.push({
        id: `overdue-${Date.now()}`,
        type: "invoice-reminder",
        priority: "high",
        title: "Follow Up on Overdue Invoices",
        description: `${overdueCustomers.length} customer(s) have outstanding balances totaling €${overdueCustomers.reduce((sum, c) => sum + parseFloat(c.outstandingBalance), 0).toFixed(2)}`,
        dueDate: new Date().toISOString(),
        customers: overdueCustomers,
      });
    }
  }

  // Action 2: Cash flow optimization
  if (kpis.bfr.value > 50000) {
    actions.push({
      id: `cash-opt-${Date.now()}`,
      type: "cash-optimization",
      priority: "medium",
      title: "Optimize Cash Flow",
      description: "Your working capital requirement is high. Review payment terms with suppliers and customers.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Action 3: Low profitability alert
  if (kpis.ebitda.margin < 10 && kpis.ebitda.data.revenue > 1000) {
    actions.push({
      id: `profit-${Date.now()}`,
      type: "cost-review",
      priority: "high",
      title: "Review Cost Structure",
      description: `EBITDA margin is ${kpis.ebitda.margin}%. Analyze expenses and identify cost-cutting opportunities.`,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Action 4: Data quality check
  const transactionCount = await prisma.transaction.count({
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
    },
  });

  if (transactionCount < 10) {
    actions.push({
      id: `data-quality-${Date.now()}`,
      type: "data-quality",
      priority: "medium",
      title: "Import More Transactions",
      description: "Limited transaction data may affect accuracy. Import bank statements for better insights.",
      dueDate: new Date().toISOString(),
    });
  }

  return actions;
}

// Get recent transactions
async function getRecentTransactions(companyId, accountIds, limit = 5) {
  const settings = await getOrCreateVatSettings(companyId);
  const txsRaw = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
    },
    orderBy: { occurredAt: 'desc' },
    take: limit,
    include: {
      category: {
        select: { id: true, name: true },
      },
      account: {
        select: { id: true, name: true },
      },
    },
  });

  return txsRaw.map(t => ({
    id: t.id,
    amount: parseFloat(t.amount),
    type: t.type,
    description: t.description,
    date: t.occurredAt,
    category: t.category,
    account: t.account,
  }));
}

// Get account balances for hero KPIs
async function getAccountBalances(accountIds) {
  const accounts = await prisma.account.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, name: true, balance: true, currency: true },
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  return {
    total: totalBalance,
    accounts: accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      balance: parseFloat(acc.balance || 0),
      currency: acc.currency || "EUR",
    })),
  };
}

// Generate forecast data (simplified)
async function getForecastData(accountIds, days) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - days);

  // Get historical transactions grouped by day
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      archived: false,
      status: "CONFIRMED",
      occurredAt: { gte: fromDate, lte: toDate },
    },
    select: { amount: true, type: true, occurredAt: true },
    orderBy: { occurredAt: 'asc' },
  });

  // Group by date
  const dailyData = {};
  transactions.forEach(t => {
    const key = dateKey(t.occurredAt);
    if (!dailyData[key]) {
      dailyData[key] = { date: key, income: 0, expenses: 0 };
    }
    const amount = parseFloat(t.amount);
    if (t.type === "credit") {
      dailyData[key].income += amount;
    } else {
      dailyData[key].expenses += amount;
    }
  });

  // Convert to array and calculate net
  const timeline = Object.values(dailyData).map(d => ({
    ...d,
    net: d.income - d.expenses,
  }));

  // Simple forecast: average of last 7 days extended for next 7 days
  const last7Days = timeline.slice(-7);
  const avgIncome = last7Days.length > 0
    ? last7Days.reduce((sum, d) => sum + d.income, 0) / last7Days.length
    : 0;
  const avgExpenses = last7Days.length > 0
    ? last7Days.reduce((sum, d) => sum + d.expenses, 0) / last7Days.length
    : 0;

  const forecast = [];
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(toDate);
    futureDate.setDate(futureDate.getDate() + i);
    forecast.push({
      date: dateKey(futureDate),
      income: Math.round(avgIncome),
      expenses: Math.round(avgExpenses),
      net: Math.round(avgIncome - avgExpenses),
      isForecast: true,
    });
  }

  return {
    historical: timeline,
    forecast,
  };
}

// Optimized insights generation using pre-fetched data
async function generateInsightsOptimized(companyId, kpis, categoryData, revenue, transactionCount) {
  const insights = [];

  // Insight 1: DSO Alert
  if (kpis.dso.value > 45) {
    insights.push({
      type: "warning",
      priority: "high",
      title: "DSO Exceeds Target",
      description: `Your Days Sales Outstanding is ${kpis.dso.value} days, above the healthy 45-day threshold. Consider following up on overdue invoices.`,
      action: "View Overdue Invoices",
      actionUrl: "/dashboard/reporting/dso",
    });
  }

  // Insight 2: EBITDA Performance
  if (kpis.ebitda.margin > 20) {
    insights.push({
      type: "success",
      priority: "medium",
      title: "Strong Profitability",
      description: `Your EBITDA margin is ${kpis.ebitda.margin}%, indicating healthy profitability. Keep up the excellent work!`,
      action: "View Details",
      actionUrl: "/dashboard/reporting/ebitda",
    });
  } else if (kpis.ebitda.margin < 10) {
    insights.push({
      type: "warning",
      priority: "high",
      title: "Low Profitability",
      description: `Your EBITDA margin is ${kpis.ebitda.margin}%, below the healthy 10% threshold. Review your cost structure.`,
      action: "Analyze Costs",
      actionUrl: "/dashboard/reporting/ebitda",
    });
  }

  // Insight 3: Working Capital
  if (kpis.bfr.value < 0) {
    insights.push({
      type: "success",
      priority: "medium",
      title: "Negative Working Capital",
      description: "Your suppliers are effectively financing your operations - a strong position!",
      action: "View BFR Details",
      actionUrl: "/dashboard/reporting/bfr",
    });
  } else if (kpis.bfr.value > 100000) {
    insights.push({
      type: "info",
      priority: "medium",
      title: "High Working Capital Need",
      description: `Your BFR is €${(kpis.bfr.value / 1000).toFixed(0)}K. Consider optimizing payment terms or inventory levels.`,
      action: "Optimize BFR",
      actionUrl: "/dashboard/reporting/bfr",
    });
  }

  // Insight 4: Break-Even Status
  if (kpis.breakEven.reachedPercent > 100) {
    insights.push({
      type: "success",
      priority: "medium",
      title: "Above Break-Even",
      description: `You've reached ${kpis.breakEven.reachedPercent}% of your break-even point - generating profit!`,
      action: "View Analysis",
      actionUrl: "/dashboard/reporting/breakeven",
    });
  } else if (kpis.breakEven.reachedPercent < 80 && kpis.breakEven.value > 0) {
    insights.push({
      type: "warning",
      priority: "high",
      title: "Below Break-Even Target",
      description: `You're at ${kpis.breakEven.reachedPercent}% of break-even. Focus on increasing revenue or reducing fixed costs.`,
      action: "View Strategy",
      actionUrl: "/dashboard/reporting/breakeven",
    });
  }

  // Insight 5: Category spending analysis (use pre-fetched data)
  if (categoryData.length > 0 && categoryData[0].categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryData[0].categoryId },
      select: { name: true },
    });

    if (category) {
      insights.push({
        type: "info",
        priority: "low",
        title: "Top Spending Category",
        description: `${category.name} is your highest expense category at €${(parseFloat(categoryData[0]._sum.amount) / 1000).toFixed(1)}K.`,
        action: "View Categories",
        actionUrl: "/dashboard/transactions",
      });
    }
  }

  // Sort by priority and return top 3
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  return insights
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}

// Optimized actions generation using pre-computed KPIs
async function generatePriorityActionsOptimized(companyId, kpis, transactionCount) {
  const actions = [];

  // Action 1: Overdue invoices (if DSO is high)
  if (kpis.dso.value > 45) {
    const overdueCustomers = await prisma.customer.findMany({
      where: {
        companyId,
        outstandingBalance: { gt: 0 },
      },
      orderBy: { outstandingBalance: 'desc' },
      take: 3,
      select: { name: true, outstandingBalance: true, email: true },
    });

    if (overdueCustomers.length > 0) {
      actions.push({
        id: `overdue-${Date.now()}`,
        type: "invoice-reminder",
        priority: "high",
        title: "Follow Up on Overdue Invoices",
        description: `${overdueCustomers.length} customer(s) have outstanding balances totaling €${overdueCustomers.reduce((sum, c) => sum + parseFloat(c.outstandingBalance), 0).toFixed(2)}`,
        dueDate: new Date().toISOString(),
        customers: overdueCustomers,
      });
    }
  }

  // Action 2: Cash flow optimization
  if (kpis.bfr.value > 50000) {
    actions.push({
      id: `cash-opt-${Date.now()}`,
      type: "cash-optimization",
      priority: "medium",
      title: "Optimize Cash Flow",
      description: "Your working capital requirement is high. Review payment terms with suppliers and customers.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Action 3: Low profitability alert
  if (kpis.ebitda.margin < 10 && kpis.ebitda.data.revenue > 1000) {
    actions.push({
      id: `profit-${Date.now()}`,
      type: "cost-review",
      priority: "high",
      title: "Review Cost Structure",
      description: `EBITDA margin is ${kpis.ebitda.margin}%. Analyze expenses and identify cost-cutting opportunities.`,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Action 4: Data quality check (use pre-computed count)
  if (transactionCount < 10) {
    actions.push({
      id: `data-quality-${Date.now()}`,
      type: "data-quality",
      priority: "medium",
      title: "Import More Transactions",
      description: "Limited transaction data may affect accuracy. Import bank statements for better insights.",
      dueDate: new Date().toISOString(),
    });
  }

  return actions;
}

// Main dashboard overview endpoint - OPTIMIZED with batched queries and Redis caching
router.get("/overview", auth, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { portfolioId, accountId, days = 30 } = req.query;

    const daysNum = Math.min(Math.max(parseInt(days, 10) || 30, 7), 365);

    // Generate cache key based on request parameters
    const cacheKey = `dashboard:overview:${companyId}:${portfolioId || 'all'}:${accountId || 'all'}:${daysNum}`;

    // Try to get cached data (TTL: 5 minutes for dashboard data)
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache HIT for ${cacheKey}`);
      return res.json({ ...cachedData, metadata: { ...cachedData.metadata, cached: true } });
    }
    logger.info(`Cache MISS for ${cacheKey}`);

    // Resolve account IDs
    const accountIds = await resolveAccountIds({ companyId, portfolioId, accountId });

    if (accountIds.length === 0) {
      return res.json({
        balances: { total: 0, accounts: [] },
        kpis: {
          dso: { value: 0, trend: "stable", reliability: "low", data: {} },
          ebitda: { value: 0, margin: 0, trend: "stable", reliability: "low", data: {} },
          bfr: { value: 0, trend: "stable", reliability: "low", data: {} },
          breakEven: { value: 0, reachedPercent: 0, trend: "stable", reliability: "low", data: {} },
        },
        recentTransactions: [],
        insights: [],
        actions: [],
        forecast: { historical: [], forecast: [] },
        metadata: {
          days: daysNum,
          accountCount: 0,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // OPTIMIZATION: Single date range calculation
    const toDate = new Date();
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - daysNum);

    // OPTIMIZATION: Fetch all data in parallel with single transaction query
    const [balances, transactions, invoiceData, supplierData, categoryData, recentTransactions, forecast] = await Promise.all([
      // 1. Account balances
      getAccountBalances(accountIds),

      // 2. ALL transactions for KPI calculations (SINGLE QUERY instead of 4 separate ones)
      prisma.transaction.findMany({
        where: {
          accountId: { in: accountIds },
          archived: false,
          status: "CONFIRMED",
          occurredAt: { gte: fromDate, lte: toDate },
        },
        select: { amount: true, type: true, occurredAt: true, categoryId: true },
        orderBy: { occurredAt: 'desc' },
      }),

      // 3. Customer invoice aggregates for DSO and BFR
      prisma.customerInvoice.aggregate({
        where: {
          customer: { companyId },
          status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] }
        },
        _sum: { amountRemaining: true },
        _count: { id: true },
      }),

      // 4. Supplier invoice aggregates for BFR
      prisma.supplierInvoice.aggregate({
        where: {
          companyId,
          status: { in: ['PENDING', 'SCHEDULED', 'OVERDUE', 'PARTIAL'] }
        },
        _sum: { amount: true },
      }),

      // 5. Top spending category (for insights)
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          accountId: { in: accountIds },
          archived: false,
          status: "CONFIRMED",
          occurredAt: { gte: fromDate, lte: toDate },
          type: "debit",
          categoryId: { not: null },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 1,
      }),

      // 6. Recent transactions
      getRecentTransactions(companyId, accountIds, 5),

      // 7. Forecast data
      getForecastData(accountIds, daysNum),
    ]);

    // OPTIMIZATION: Calculate KPIs using shared transaction data (in-memory filtering)
    const revenue = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const receivables = invoiceData._sum.amountRemaining || 0;
    const payables = supplierData._sum.amount || 0;

    // Calculate all 4 KPIs in-memory (no additional queries)
    const dso = revenue > 0 ? Math.round((receivables / revenue) * daysNum) : 0;
    const dsoKPI = {
      value: dso,
      trend: dso > 45 ? "down" : dso > 30 ? "stable" : "up",
      reliability: dso > 0 && revenue > 1000 ? "high" : "medium",
      data: { revenue, receivables },
    };

    const ebitda = revenue - expenses;
    const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    const ebitdaKPI = {
      value: Math.round(ebitda),
      margin: Math.round(margin * 10) / 10,
      trend: margin > 20 ? "up" : margin > 10 ? "stable" : "down",
      reliability: revenue > 1000 ? "high" : "medium",
      data: { revenue, expenses },
    };

    const inventory = (expenses / daysNum) * 30;
    const bfr = receivables + inventory - payables;
    const bfrKPI = {
      value: Math.round(bfr),
      trend: bfr < 0 ? "up" : bfr < 50000 ? "stable" : "down",
      reliability: "medium",
      data: { receivables, inventory: Math.round(inventory), payables },
    };

    const fixedCosts = expenses * 0.6;
    const variableCosts = expenses * 0.4;
    const variableCostRatio = revenue > 0 ? variableCosts / revenue : 0.4;
    const contributionMargin = 1 - variableCostRatio;
    const breakEven = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
    const reachedPercent = breakEven > 0 ? (revenue / breakEven) * 100 : 0;
    const breakEvenKPI = {
      value: Math.round(breakEven),
      reachedPercent: Math.round(reachedPercent * 10) / 10,
      trend: reachedPercent > 100 ? "up" : reachedPercent > 80 ? "stable" : "down",
      reliability: revenue > 1000 ? "medium" : "low",
      data: { revenue, fixedCosts: Math.round(fixedCosts), variableCosts: Math.round(variableCosts), contributionMargin },
    };

    const kpis = { dso: dsoKPI, ebitda: ebitdaKPI, bfr: bfrKPI, breakEven: breakEvenKPI };

    // OPTIMIZATION: Use optimized functions with pre-computed data
    const transactionCount = transactions.length;
    const [insights, actions] = await Promise.all([
      generateInsightsOptimized(companyId, kpis, categoryData, revenue, transactionCount),
      generatePriorityActionsOptimized(companyId, kpis, transactionCount),
    ]);

    const responseData = {
      balances,
      kpis,
      recentTransactions,
      insights,
      actions,
      forecast,
      metadata: {
        days: daysNum,
        accountCount: accountIds.length,
        timestamp: new Date().toISOString(),
        cached: false,
      },
    };

    // Cache the response for 5 minutes (300 seconds)
    await redisClient.set(cacheKey, responseData, 300);

    res.json(responseData);

  } catch (error) {
    logger.error("Dashboard overview error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

module.exports = router;
