/**
 * Portfolios Routes - Odoo Integration (Double Write Strategy)
 *
 * Maps to quelyos.portfolio model
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { OdooRPC } = require("@quelyos/odoo");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { getOdooId, getPrismaId, storeMapping, getOdooCompanyId } = require("../utils/odoo-mapping");

const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

// ---------- CREATE PORTFOLIO (DOUBLE WRITE) ----------
router.post("/", auth, async (req, res) => {
  try {
    const { name, status, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Portfolio name is required" });
    }

    // STEP 1: Create in Prisma
    const prismaPortfolio = await prisma.portfolio.create({
      data: {
        name: name.trim(),
        status: status || 'ACTIVE',
        description: description || null,
        companyId: req.user.companyId
      }
    });

    // STEP 2: Create in Odoo
    try {
      const odooCompanyId = await getOdooCompanyId(req.user.companyId);

      const odooPortfolio = await odoo.create('quelyos.portfolio', {
        name: name.trim(),
        company_id: odooCompanyId,
        status: (status || 'ACTIVE').toLowerCase(),
        description: description || false
      });

      if (odooPortfolio && odooPortfolio.id) {
        await storeMapping('Portfolio', prismaPortfolio.id, 'quelyos.portfolio', odooPortfolio.id);
        logger.info(`[Portfolios] Created: Prisma#${prismaPortfolio.id} <-> Odoo#${odooPortfolio.id}`);
      }

    } catch (odooError) {
      logger.error(`[Portfolios] Odoo creation failed:`, odooError);
    }

    res.json(prismaPortfolio);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Portfolio creation failed" });
  }
});

// ---------- LIST PORTFOLIOS ----------
router.get("/", auth, async (req, res) => {
  try {
    // Read from Prisma
    const portfolios = await prisma.portfolio.findMany({
      where: { companyId: req.user.companyId },
      include: {
        accounts: {
          include: {
            account: true
          }
        }
      }
    });

    // Calculate balances
    const portfoliosWithBalances = portfolios.map(portfolio => {
      const totalBalance = portfolio.accounts.reduce((sum, ap) => {
        return sum + (ap.account?.balance || 0);
      }, 0);

      return {
        ...portfolio,
        balance: totalBalance,
        accountCount: portfolio.accounts.length
      };
    });

    res.json(portfoliosWithBalances);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch portfolios" });
  }
});

// ---------- GET PORTFOLIO BY ID ----------
router.get("/:id", auth, async (req, res) => {
  try {
    const portfolioId = Number(req.params.id);

    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        companyId: req.user.companyId
      },
      include: {
        accounts: {
          include: {
            account: {
              include: {
                transactions: {
                  take: 10,
                  orderBy: { occurredAt: 'desc' }
                }
              }
            }
          }
        }
      }
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Calculate total balance
    const totalBalance = portfolio.accounts.reduce((sum, ap) => {
      return sum + (ap.account?.balance || 0);
    }, 0);

    // Optionally fetch from Odoo for computed balance
    try {
      const odooId = await getOdooId('Portfolio', portfolioId);
      if (odooId) {
        const odooPortfolio = await odoo.read('quelyos.portfolio', [odooId], ['balance', 'account_count']);
        if (odooPortfolio && odooPortfolio[0]) {
          portfolio.odooBalance = odooPortfolio[0].balance;
          portfolio.odooAccountCount = odooPortfolio[0].account_count;
        }
      }
    } catch (odooError) {
      logger.warn(`[Portfolios] Could not fetch Odoo data:`, odooError);
    }

    res.json({
      ...portfolio,
      balance: totalBalance,
      accountCount: portfolio.accounts.length
    });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch portfolio" });
  }
});

// ---------- UPDATE PORTFOLIO (DOUBLE WRITE) ----------
router.put("/:id", auth, async (req, res) => {
  try {
    const portfolioId = Number(req.params.id);

    const existing = await prisma.portfolio.findFirst({
      where: { id: portfolioId, companyId: req.user.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // STEP 1: Update Prisma
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.description !== undefined) updateData.description = req.body.description;

    const updated = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: updateData
    });

    // STEP 2: Update Odoo
    try {
      const odooId = await getOdooId('Portfolio', portfolioId);
      if (odooId) {
        const odooUpdateData = {};
        if (req.body.name) odooUpdateData.name = req.body.name.trim();
        if (req.body.status) odooUpdateData.status = req.body.status.toLowerCase();
        if (req.body.description !== undefined) odooUpdateData.description = req.body.description || false;

        await odoo.write('quelyos.portfolio', odooId, odooUpdateData);
        logger.info(`[Portfolios] Updated in Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Portfolios] Odoo update failed:`, odooError);
    }

    res.json(updated);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Portfolio update failed" });
  }
});

// ---------- DELETE PORTFOLIO (DOUBLE DELETE) ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    const portfolioId = Number(req.params.id);

    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, companyId: req.user.companyId }
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Delete from Odoo first
    try {
      const odooId = await getOdooId('Portfolio', portfolioId);
      if (odooId) {
        await odoo.unlink('quelyos.portfolio', [odooId]);
        logger.info(`[Portfolios] Deleted from Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Portfolios] Odoo deletion failed:`, odooError);
    }

    // Delete from Prisma
    await prisma.portfolio.delete({ where: { id: portfolioId } });

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Portfolio deletion failed" });
  }
});

// ---------- ADD ACCOUNT TO PORTFOLIO ----------
router.post("/:id/accounts", auth, async (req, res) => {
  try {
    const portfolioId = Number(req.params.id);
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: "Account ID required" });
    }

    // Verify ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, companyId: req.user.companyId }
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // STEP 1: Add to Prisma
    await prisma.accountPortfolio.create({
      data: {
        accountId: Number(accountId),
        portfolioId: portfolioId
      }
    });

    // STEP 2: Add to Odoo
    try {
      const odooPortfolioId = await getOdooId('Portfolio', portfolioId);
      const odooAccountId = await getOdooId('Account', accountId);

      if (odooPortfolioId && odooAccountId) {
        await odoo.write('quelyos.portfolio', odooPortfolioId, {
          account_ids: [[4, odooAccountId]] // Many2many add command
        });
        logger.info(`[Portfolios] Added account Odoo#${odooAccountId} to portfolio Odoo#${odooPortfolioId}`);
      }
    } catch (odooError) {
      logger.error(`[Portfolios] Odoo link failed:`, odooError);
    }

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to add account to portfolio" });
  }
});

// ---------- REMOVE ACCOUNT FROM PORTFOLIO ----------
router.delete("/:id/accounts/:accountId", auth, async (req, res) => {
  try {
    const portfolioId = Number(req.params.id);
    const accountId = Number(req.params.accountId);

    // Verify ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, companyId: req.user.companyId }
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // STEP 1: Remove from Prisma
    await prisma.accountPortfolio.deleteMany({
      where: {
        portfolioId: portfolioId,
        accountId: accountId
      }
    });

    // STEP 2: Remove from Odoo
    try {
      const odooPortfolioId = await getOdooId('Portfolio', portfolioId);
      const odooAccountId = await getOdooId('Account', accountId);

      if (odooPortfolioId && odooAccountId) {
        await odoo.write('quelyos.portfolio', odooPortfolioId, {
          account_ids: [[3, odooAccountId]] // Many2many remove command
        });
        logger.info(`[Portfolios] Removed account from Odoo portfolio`);
      }
    } catch (odooError) {
      logger.error(`[Portfolios] Odoo unlink failed:`, odooError);
    }

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to remove account from portfolio" });
  }
});

module.exports = router;
