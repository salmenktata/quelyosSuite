const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

const ALLOWED_KINDS = ["INCOME", "EXPENSE"];
const ALLOWED_COST_NATURES = ["FIXED", "VARIABLE", "MIXED", "UNCLASSIFIED"];

// ➤ CREATE CATEGORY
router.post("/", auth, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const kind = (req.body.kind || "").toUpperCase();

    if (!name) return res.status(400).json({ error: "Missing name" });
    if (!ALLOWED_KINDS.includes(kind)) return res.status(400).json({ error: "Invalid kind" });

    const category = await prisma.category.create({
      data: {
        name,
        kind,
        companyId: req.user.companyId
      }
    });

    res.json(category);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Category creation failed" });
  }
});

// ➤ LIST CATEGORIES
router.get("/", auth, async (req, res) => {
  try {
    const kind = req.query.kind ? String(req.query.kind).toUpperCase() : null;
    const kindFilter = kind && ALLOWED_KINDS.includes(kind) ? { kind } : {};
    const categories = await prisma.category.findMany({
      where: { companyId: req.user.companyId, ...kindFilter },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });

    res.json(categories);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Fetching categories failed" });
  }
});

// ➤ UPDATE CATEGORY
router.patch("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });

    // Verify ownership
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Category not found" });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.description !== undefined) updates.description = req.body.description?.trim() || null;
    if (req.body.kind && ALLOWED_KINDS.includes(req.body.kind.toUpperCase())) {
      updates.kind = req.body.kind.toUpperCase();
    }
    if (req.body.costNature && ALLOWED_COST_NATURES.includes(req.body.costNature.toUpperCase())) {
      updates.costNature = req.body.costNature.toUpperCase();
    }

    const category = await prisma.category.update({
      where: { id },
      data: updates,
    });

    res.json(category);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Category update failed" });
  }
});

// ➤ DELETE CATEGORY
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });

    // Verify ownership
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.companyId !== req.user.companyId) {
      return res.status(404).json({ error: "Category not found" });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: "Category deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Category deletion failed" });
  }
});

module.exports = router;
