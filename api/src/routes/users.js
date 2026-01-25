const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  return next();
};

const countCompanyAdmins = async (companyId) => {
  return prisma.user.count({
    where: { companyId, role: "ADMIN" }
  });
};

// List users in the current company (admin only)
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.json(users);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a user in the current company (admin only)
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role === "ADMIN" ? "ADMIN" : "USER";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        companyId: req.user.companyId,
        role
      },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json(user);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update a user's role (admin only, same company)
router.patch("/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user id" });

    const newRole = req.body.role === "ADMIN" ? "ADMIN" : "USER";

    const target = await prisma.user.findFirst({
      where: { id, companyId: req.user.companyId },
      select: { id: true, role: true }
    });

    if (!target) return res.status(404).json({ error: "User not found" });

    if (id === req.user.userId && newRole !== "ADMIN") {
      return res.status(400).json({ error: "Cannot downgrade yourself from admin" });
    }

    if (target.role === "ADMIN" && newRole === "USER") {
      const adminCount = await countCompanyAdmins(req.user.companyId);
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot remove the last admin" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// Delete a user in the current company (admin only)
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (id === req.user.userId) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    const user = await prisma.user.findFirst({
      where: { id, companyId: req.user.companyId },
      select: { id: true, role: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.role === "ADMIN") {
      const adminCount = await countCompanyAdmins(req.user.companyId);
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last admin" });
      }
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User deleted" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
