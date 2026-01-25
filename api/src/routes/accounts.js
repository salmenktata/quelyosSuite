const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createAccountSchema, updateAccountSchema } = require("../schemas/validation");
const { checkAccountLimit } = require("../middleware/paywall");

function resolveCompanyId(req) {
  if (req.user?.role === "SUPERADMIN" && req.query.companyId) {
    const cid = Number(req.query.companyId);
    if (Number.isFinite(cid)) return cid;
  }
  return req.user.companyId;
}

// ---------- CREATE ACCOUNT ----------
router.post("/", auth, checkAccountLimit, validate(createAccountSchema), async (req, res) => {
  try {
    const targetCompanyId = resolveCompanyId(req);
    const name = (req.body.name || "").trim();
    const type = (req.body.type || "banque").trim();
    const currency = (req.body.currency || "EUR").trim();
    const balance = Number.isFinite(Number(req.body.balance)) ? Number(req.body.balance) : 0;
    const status = req.body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const institution = req.body.institution ? String(req.body.institution).trim() : null;
    const notes = req.body.notes ? String(req.body.notes).trim() : null;
    const portfolioIds = Array.isArray(req.body.portfolioIds) ? req.body.portfolioIds : [];
    // Règle métier : sans association explicite, le compte est partagé à tous les portefeuilles
    const isShared = portfolioIds.length === 0;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const account = await prisma.account.create({
      data: {
        name,
        type,
        currency,
        balance,
        institution,
        notes,
        isShared,
        status,
        companyId: targetCompanyId,
        portfolios: {
          create: portfolioIds.map(pid => ({ portfolioId: Number(pid) }))
        }
      },
      include: {
        portfolios: {
          include: { portfolio: true }
        }
      }
    });

    res.json(account);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Account creation failed" });
  }
});

// ---------- LIST ACCOUNTS ----------
router.get("/", auth, async (req, res) => {
  try {
    const targetCompanyId = resolveCompanyId(req);
    const accounts = await prisma.account.findMany({
      where: { companyId: targetCompanyId },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
        portfolios: {
          include: {
            portfolio: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json(accounts);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch accounts" });
  }
});

// ---------- GET VARIATION 24H ----------
// Calcule la variation du solde total sur les dernières 24 heures
router.get("/variation24h", auth, async (req, res) => {
  try {
    const targetCompanyId = resolveCompanyId(req);
    
    // Date d'il y a 24h
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    // Récupérer tous les comptes
    const accounts = await prisma.account.findMany({
      where: { companyId: targetCompanyId },
      select: { id: true, balance: true }
    });
    
    const accountIds = accounts.map(a => a.id);
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
    // Récupérer les transactions des dernières 24h (champ occurredAt, pas date)
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        occurredAt: { gte: yesterday }
      },
      select: {
        type: true,
        amount: true
      }
    });
    
    // Calculer la variation nette
    const variation24h = transactions.reduce((sum, tx) => {
      const amount = tx.amount || 0;
      return sum + (tx.type === "CREDIT" ? amount : -amount);
    }, 0);
    
    // Calculer le pourcentage
    const previousBalance = totalBalance - variation24h;
    const variationPercent = previousBalance !== 0 
      ? (variation24h / Math.abs(previousBalance)) * 100 
      : 0;
    
    res.json({
      variation24h,
      variationPercent: Math.round(variationPercent * 100) / 100,
      totalBalance,
      transactionCount: transactions.length
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not calculate variation" });
  }
});

// ---------- UPDATE ACCOUNT ----------
router.put("/:id", auth, validate(updateAccountSchema), async (req, res) => {
  const accountId = Number(req.params.id);
  if (!Number.isFinite(accountId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }

  try {
    const targetCompanyId = resolveCompanyId(req);
    const existing = await prisma.account.findFirst({
      where: { id: accountId, companyId: targetCompanyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    const payload = {
      name: req.body.name ? String(req.body.name).trim() : existing.name,
      type: req.body.type ? String(req.body.type).trim() : existing.type,
      currency: req.body.currency ? String(req.body.currency).trim() : existing.currency,
      balance: Number.isFinite(Number(req.body.balance)) ? Number(req.body.balance) : existing.balance,
      institution: req.body.institution === undefined ? existing.institution : String(req.body.institution || "").trim() || null,
      notes: req.body.notes === undefined ? existing.notes : String(req.body.notes || "").trim() || null,
      // isShared est dérivé des associations : sans portefeuille associé => partagé par défaut
      isShared: existing.isShared,
      status: req.body.status === "INACTIVE" ? "INACTIVE" : existing.status,
    };

    if (!payload.name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Gérer les portfolios si fournis
    if (Array.isArray(req.body.portfolioIds)) {
      // Supprimer les liens existants
      await prisma.accountPortfolio.deleteMany({
        where: { accountId: existing.id }
      });

      // Créer les nouveaux liens
      if (req.body.portfolioIds.length > 0) {
        await prisma.accountPortfolio.createMany({
          data: req.body.portfolioIds.map(pid => ({
            accountId: existing.id,
            portfolioId: Number(pid)
          }))
        });
      }

      // Mettre à jour le flag isShared en fonction des liaisons
      payload.isShared = req.body.portfolioIds.length === 0;
    }

    const updated = await prisma.account.update({
      where: { id: existing.id },
      data: payload,
      include: {
        portfolios: {
          include: {
            portfolio: true
          }
        }
      }
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Account update failed" });
  }
});

// ---------- DELETE ACCOUNT ----------
router.delete("/:id", auth, async (req, res) => {
  const accountId = Number(req.params.id);
  if (!Number.isFinite(accountId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }

  try {
    const targetCompanyId = resolveCompanyId(req);
    const existing = await prisma.account.findFirst({
      where: { id: accountId, companyId: targetCompanyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    const txCount = await prisma.transaction.count({ where: { accountId: existing.id } });
    if (txCount > 0) {
      return res.status(400).json({ error: "Account has transactions", code: "ACCOUNT_HAS_TRANSACTIONS" });
    }

    await prisma.account.delete({ where: { id: existing.id } });

    res.json({ message: "Account deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Account deletion failed" });
  }
});

// ---------- ARCHIVE ALL TRANSACTIONS AND DISABLE ACCOUNT ----------
router.post("/:id/archive-transactions", auth, async (req, res) => {
  const accountId = Number(req.params.id);
  if (!Number.isFinite(accountId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }

  try {
    const targetCompanyId = resolveCompanyId(req);
    const existing = await prisma.account.findFirst({
      where: { id: accountId, companyId: targetCompanyId }
    });

    if (!existing) return res.status(404).json({ error: "Account not found", code: "ACCOUNT_NOT_FOUND" });

    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { accountId: existing.id },
        data: { archived: true }
      }),
      prisma.account.update({
        where: { id: existing.id },
        data: { status: "INACTIVE" }
      })
    ]);

    res.json({ message: "Account disabled and transactions archived" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Archive operation failed" });
  }
});

// ---------- REASSIGN TRANSACTIONS AND DISABLE ACCOUNT ----------
router.post("/:id/reassign-transactions", auth, async (req, res) => {
  const accountId = Number(req.params.id);
  const targetId = Number(req.body.targetAccountId);
  if (!Number.isFinite(accountId) || !Number.isFinite(targetId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }
  if (accountId === targetId) {
    return res.status(400).json({ error: "Target account must differ" });
  }

  try {
    const targetCompanyId = resolveCompanyId(req);

    const [source, target] = await Promise.all([
      prisma.account.findFirst({ where: { id: accountId, companyId: targetCompanyId } }),
      prisma.account.findFirst({ where: { id: targetId, companyId: targetCompanyId, status: "ACTIVE" } })
    ]);

    if (!source) return res.status(404).json({ error: "Account not found", code: "ACCOUNT_NOT_FOUND" });
    if (!target) return res.status(404).json({ error: "Target account not found or inactive", code: "TARGET_ACCOUNT_NOT_FOUND_OR_INACTIVE" });

    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { accountId: source.id },
        data: { accountId: target.id }
      }),
      prisma.account.update({
        where: { id: source.id },
        data: { status: "INACTIVE" }
      })
    ]);

    res.json({ message: "Transactions reassigned and account disabled" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Reassign operation failed" });
  }
});

// ---------- LINK ACCOUNT TO PORTFOLIOS ----------
router.post("/:id/portfolios", auth, async (req, res) => {
  const accountId = Number(req.params.id);
  if (!Number.isFinite(accountId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }

  try {
    const targetCompanyId = resolveCompanyId(req);
    const existing = await prisma.account.findFirst({
      where: { id: accountId, companyId: targetCompanyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    const portfolioIds = Array.isArray(req.body.portfolioIds) ? req.body.portfolioIds : [];
    
    // Supprimer les liens existants
    await prisma.accountPortfolio.deleteMany({
      where: { accountId }
    });

    // Créer les nouveaux liens
    if (portfolioIds.length > 0) {
      await prisma.accountPortfolio.createMany({
        data: portfolioIds.map(pid => ({
          accountId,
          portfolioId: Number(pid)
        })),
        skipDuplicates: true
      });
    }

    const updated = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        portfolios: {
          include: {
            portfolio: true
          }
        }
      }
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to link portfolios" });
  }
});

module.exports = router;
