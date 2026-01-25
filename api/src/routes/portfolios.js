const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

// ➤ CREATE PORTFOLIO
router.post("/", auth, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const description = req.body.description?.trim() || null;
    const status = req.body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    if (!name) return res.status(400).json({ error: "Missing name" });

    const portfolio = await prisma.portfolio.create({
      data: {
        name,
        description,
        status,
        companyId: req.user.companyId,
      },
    });

    res.json(portfolio);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Portfolio creation failed" });
  }
});

// ➤ LIST PORTFOLIOS
router.get("/", auth, async (req, res) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { companyId: req.user.companyId },
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
            balance: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json(portfolios);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetching portfolios failed" });
  }
});

// ➤ GET PORTFOLIO BY ID
router.get("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
            balance: true,
            institution: true,
            notes: true,
          },
        },
      },
    });

    if (!portfolio || portfolio.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.json(portfolio);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetching portfolio failed" });
  }
});

// ➤ UPDATE PORTFOLIO
router.patch("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });

    // Verify ownership
    const existing = await prisma.portfolio.findUnique({ where: { id } });
    if (!existing || existing.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.description !== undefined) {
      updates.description = req.body.description?.trim() || null;
    }
    if (req.body.status !== undefined) {
      updates.status = req.body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: updates,
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
            balance: true,
            status: true,
          },
        },
      },
    });

    res.json(portfolio);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Portfolio update failed" });
  }
});

// ➤ DELETE PORTFOLIO
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });

    // Verify ownership
    const existing = await prisma.portfolio.findUnique({ where: { id } });
    if (!existing || existing.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Remove portfolio reference from accounts (set portfolioId to null)
    await prisma.account.updateMany({
      where: { portfolioId: id },
      data: { portfolioId: null },
    });

    await prisma.portfolio.delete({ where: { id } });
    res.json({ message: "Portfolio deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Portfolio deletion failed" });
  }
});

// ➤ ADD ACCOUNT TO PORTFOLIO
router.post("/:id/accounts/:accountId", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const accountId = Number(req.params.accountId);

    if (!Number.isFinite(id) || !Number.isFinite(accountId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio || portfolio.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Verify account ownership
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account || account.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Add account to portfolio
    await prisma.account.update({
      where: { id: accountId },
      data: { portfolioId: id },
    });

    res.json({ message: "Account added to portfolio" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Adding account to portfolio failed" });
  }
});

// ➤ REMOVE ACCOUNT FROM PORTFOLIO
router.delete("/:id/accounts/:accountId", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const accountId = Number(req.params.accountId);

    if (!Number.isFinite(id) || !Number.isFinite(accountId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio || portfolio.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Verify account ownership
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account || account.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Remove account from portfolio
    await prisma.account.update({
      where: { id: accountId },
      data: { portfolioId: null },
    });

    res.json({ message: "Account removed from portfolio" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Removing account from portfolio failed" });
  }
});

module.exports = router;
