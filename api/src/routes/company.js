const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  return next();
};

// Get company profile with basic stats
router.get("/", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, createdAt: true }
    });

    if (!company) return res.status(404).json({ error: "Company not found" });

    const [usersCount, accountsCount, categoriesCount] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.account.count({ where: { companyId } }),
      prisma.category.count({ where: { companyId } })
    ]);

    res.json({ ...company, usersCount, accountsCount, categoriesCount });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch company" });
  }
});

// Update company name (admin only)
router.put("/", auth, requireAdmin, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Missing name" });

    const updated = await prisma.company.update({
      where: { id: req.user.companyId },
      data: { name },
      select: { id: true, name: true, createdAt: true }
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to update company" });
  }
});

// Get company settings including demo status
router.get("/settings", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, isDemo: true, createdAt: true }
    });

    if (!company) return res.status(404).json({ error: "Company not found" });

    const settings = await prisma.companySettings.findUnique({
      where: { companyId }
    });

    res.json({ 
      ...company, 
      vatActive: settings?.vatActive || false,
      vatMode: settings?.vatMode || "HT",
      vatDefaultRate: settings?.vatDefaultRate || 0,
      vatRates: settings?.vatRates || []
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch company settings" });
  }
});

module.exports = router;
