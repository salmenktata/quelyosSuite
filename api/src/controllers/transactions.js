const logger = require("../../logger");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// CREATE TRANSACTION
exports.createTransaction = async (req, res) => {
  try {
    const { type } = req.body;
    const amount = Number(req.body.amount);
    const accountId = Number(req.body.accountId);
    const status = req.body.status || "CONFIRMED";
    const occurredAt = req.body.occurredAt ? new Date(req.body.occurredAt) : new Date();
    const scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : null;
    const description = req.body.description ?? null;
    const companyId = req.user.companyId;

    if (!Number.isFinite(amount) || amount <= 0 || !type || !accountId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!["credit", "debit"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    // Vérifier que le compte appartient à la société du user
    const account = await prisma.account.findFirst({
      where: { id: accountId, companyId }
    });

    if (!account) {
      return res.status(403).json({ error: "Forbidden: Account not found" });
    }

    const allowedStatuses = ["CONFIRMED", "PLANNED", "SCHEDULED", "CANCELED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (occurredAt && Number.isNaN(occurredAt.getTime())) {
      return res.status(400).json({ error: "Invalid occurredAt" });
    }

    if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ error: "Invalid scheduledFor" });
    }

    const tx = await prisma.transaction.create({
      data: {
        amount,
        type,
        accountId,
        status,
        occurredAt,
        scheduledFor,
        description
      }
    });

    res.json({ message: "Transaction created", transaction });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

// GET ALL TRANSACTIONS FOR COMPANY
exports.getAll = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const txs = await prisma.transaction.findMany({
      where: { account: { companyId } },
      orderBy: { occurredAt: "desc" }
    });

    res.json(txs);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// GET TRANSACTIONS FOR ONE ACCOUNT
exports.getByAccount = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const accountId = Number(req.params.accountId);

    const txs = await prisma.transaction.findMany({
      where: {
        accountId,
        account: { companyId }
      },
      orderBy: { occurredAt: "desc" }
    });

    res.json(txs);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
