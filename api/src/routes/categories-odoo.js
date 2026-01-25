/**
 * Categories Routes - Odoo Integration (Double Write Strategy)
 *
 * Maps to account.analytic.account (Comptes analytiques Odoo)
 */

const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { OdooRPC } = require("@quelyos/odoo");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const { getOdooId, storeMapping, getOdooCompanyId } = require("../utils/odoo-mapping");

const odoo = new OdooRPC(process.env.ODOO_URL || 'http://localhost:8069');

// ---------- CREATE CATEGORY (DOUBLE WRITE) ----------
router.post("/", auth, async (req, res) => {
  try {
    const { name, kind } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const categoryKind = kind === 'INCOME' ? 'INCOME' : 'EXPENSE';

    // STEP 1: Create in Prisma
    const prismaCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        kind: categoryKind,
        companyId: req.user.companyId
      }
    });

    // STEP 2: Create in Odoo (account.analytic.account)
    try {
      const odooCompanyId = await getOdooCompanyId(req.user.companyId);

      // Get or create analytic plan
      let planId = await getOrCreateAnalyticPlan(odooCompanyId);

      const odooCategory = await odoo.create('account.analytic.account', {
        name: name.trim(),
        company_id: odooCompanyId,
        plan_id: planId,
        // Store category kind in custom field (requires extension)
        // x_category_kind: categoryKind.toLowerCase()
      });

      if (odooCategory && odooCategory.id) {
        await storeMapping('Category', prismaCategory.id, 'account.analytic.account', odooCategory.id);
        logger.info(`[Categories] Created: Prisma#${prismaCategory.id} <-> Odoo#${odooCategory.id}`);
      }

    } catch (odooError) {
      logger.error(`[Categories] Odoo creation failed:`, odooError);
    }

    res.json(prismaCategory);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Category creation failed" });
  }
});

// ---------- LIST CATEGORIES ----------
router.get("/", auth, async (req, res) => {
  try {
    // Read from Prisma (current behavior)
    const categories = await prisma.category.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { name: 'asc' }
    });

    res.json(categories);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch categories" });
  }
});

// ---------- UPDATE CATEGORY (DOUBLE WRITE) ----------
router.put("/:id", auth, async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    const existing = await prisma.category.findFirst({
      where: { id: categoryId, companyId: req.user.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    // STEP 1: Update Prisma
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.kind !== undefined) updateData.kind = req.body.kind;

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    });

    // STEP 2: Update Odoo
    try {
      const odooId = await getOdooId('Category', categoryId);
      if (odooId) {
        const odooUpdateData = {};
        if (req.body.name) odooUpdateData.name = req.body.name.trim();

        await odoo.write('account.analytic.account', odooId, odooUpdateData);
        logger.info(`[Categories] Updated in Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Categories] Odoo update failed:`, odooError);
    }

    res.json(updated);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Category update failed" });
  }
});

// ---------- DELETE CATEGORY (DOUBLE DELETE) ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    const category = await prisma.category.findFirst({
      where: { id: categoryId, companyId: req.user.companyId }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete from Odoo first
    try {
      const odooId = await getOdooId('Category', categoryId);
      if (odooId) {
        await odoo.unlink('account.analytic.account', [odooId]);
        logger.info(`[Categories] Deleted from Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[Categories] Odoo deletion failed:`, odooError);
    }

    // Delete from Prisma
    await prisma.category.delete({ where: { id: categoryId } });

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Category deletion failed" });
  }
});

/**
 * Helper: Get or create default analytic plan for company
 * Odoo 17+ requires analytic plan for analytic accounts
 */
async function getOrCreateAnalyticPlan(odooCompanyId) {
  try {
    // Search existing plan
    const plans = await odoo.search('account.analytic.plan', [
      ['company_id', '=', odooCompanyId]
    ], { limit: 1 });

    if (plans && plans[0]) {
      return plans[0].id;
    }

    // Create default plan if not exists
    const plan = await odoo.create('account.analytic.plan', {
      name: 'Default Plan',
      company_id: odooCompanyId
    });

    return plan.id;

  } catch (error) {
    logger.warn(`[Categories] Could not get/create analytic plan:`, error);
    return 1; // Fallback to default plan ID
  }
}

module.exports = router;
