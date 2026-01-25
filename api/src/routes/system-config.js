const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

const configCache = require("../services/config-cache.service");
/**
 * System Configuration API Routes
 * All endpoints require SUPERADMIN role
 * Manages 150+ system parameters across 14 categories
 */

// Middleware: Require SUPERADMIN role
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Super admin requis" });
  }
  return next();
};

// Helper: Validate parameter key format
function isValidKey(key) {
  return /^[a-z_]+\.[a-z_]+(\.[a-z_]+)*$/.test(key);
}

// Helper: Parse and validate parameter value based on type
function parseValue(type, value) {
  switch (type) {
    case "NUMBER":
    case "PERCENTAGE":
    case "DURATION":
      const num = parseFloat(value);
      if (isNaN(num)) throw new Error("Invalid number");
      return num.toString();
    case "BOOLEAN":
      if (value === "true" || value === true) return "true";
      if (value === "false" || value === false) return "false";
      throw new Error("Invalid boolean");
    case "STRING":
    case "ENUM":
      return value.toString();
    case "JSON":
      if (typeof value === "string") {
        JSON.parse(value); // Validate JSON
        return value;
      }
      return JSON.stringify(value);
    default:
      return value.toString();
  }
}

// Helper: Validate value against constraints
function validateValue(param, value) {
  const val = parseValue(param.type, value);
  const validation = param.validation || {};

  if (param.type === "NUMBER" || param.type === "PERCENTAGE" || param.type === "DURATION") {
    const num = parseFloat(val);
    if (validation.min !== undefined && num < validation.min) {
      return { valid: false, error: `Value must be >= ${validation.min}` };
    }
    if (validation.max !== undefined && num > validation.max) {
      return { valid: false, error: `Value must be <= ${validation.max}` };
    }
  }

  if (param.type === "ENUM") {
    if (validation.enum && !validation.enum.includes(val)) {
      return { valid: false, error: `Value must be one of: ${validation.enum.join(", ")}` };
    }
  }

  return { valid: true, value: val };
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 1: GET /admin/system/config
// Get all parameters grouped by category
// ═══════════════════════════════════════════════════════════════════════════

router.get("/config", auth, requireSuperAdmin, async (_req, res) => {
  try {
    logger.info('[System Config] GET /config called');
    const params = await prisma.systemParameter.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });
    logger.info(`[System Config] Found ${params.length} parameters`);

    // Group by category
    const grouped = params.reduce((acc, param) => {
      if (!acc[param.category]) {
        acc[param.category] = [];
      }
      acc[param.category].push({
        id: param.id,
        key: param.key,
        value: param.value,
        defaultValue: param.defaultValue,
        type: param.type,
        scope: param.scope,
        label: param.label,
        description: param.description,
        unit: param.unit,
        validation: param.validation,
        version: param.version,
        updatedAt: param.updatedAt,
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
      meta: {
        totalParams: params.length,
        categories: Object.keys(grouped).length,
      },
    });
  } catch (err) {
    logger.error("Error fetching all config:", err);
    logger.error("Error stack:", err.stack);
    res.status(500).json({ error: "Impossible de récupérer la configuration", details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 2: GET /admin/system/config/:category
// Get parameters for specific category
// ═══════════════════════════════════════════════════════════════════════════

router.get("/config/:category", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { category } = req.params;

    const params = await prisma.systemParameter.findMany({
      where: { category },
      orderBy: { key: "asc" },
    });

    if (params.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      success: true,
      data: params.map((p) => ({
        id: p.id,
        key: p.key,
        value: p.value,
        defaultValue: p.defaultValue,
        type: p.type,
        scope: p.scope,
        label: p.label,
        description: p.description,
        unit: p.unit,
        validation: p.validation,
        version: p.version,
        updatedAt: p.updatedAt,
      })),
      meta: {
        category,
        count: params.length,
      },
    });
  } catch (err) {
    logger.error("Error fetching category config:", err);
    res.status(500).json({ error: "Impossible de récupérer la catégorie" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 3: PUT /admin/system/config/:category
// Batch update category parameters
// ═══════════════════════════════════════════════════════════════════════════

router.put("/config/:category", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const { updates, reason } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "Updates array required" });
    }

    // Validate all parameters exist and belong to category
    const keys = updates.map((u) => u.key);
    const params = await prisma.systemParameter.findMany({
      where: { key: { in: keys }, category },
    });

    if (params.length !== updates.length) {
      return res.status(400).json({ error: "Some parameters not found in category" });
    }

    // Validate all values
    const validations = updates.map((update) => {
      const param = params.find((p) => p.key === update.key);
      return { ...update, param, ...validateValue(param, update.value) };
    });

    const invalid = validations.filter((v) => !v.valid);
    if (invalid.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: invalid.map((v) => ({ key: v.key, error: v.error })),
      });
    }

    // Perform batch update with history
    const results = await Promise.all(
      validations.map(async (v) => {
        const updated = await prisma.systemParameter.update({
          where: { key: v.key },
          data: {
            value: v.value,
            version: { increment: 1 },
            updatedBy: req.user.id,
          },
        });

        // Create history record
        await prisma.parameterHistory.create({
          data: {
            parameterId: updated.id,
            oldValue: v.param.value,
            newValue: v.value,
            changedBy: req.user.id,
            changedByRole: req.user.role,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            reason: reason || null,
          },
        });

        return updated;
      })
    );

    res.json({
      success: true,
      data: {
        updated: results.length,
        parameters: results.map((r) => ({
          key: r.key,
          value: r.value,
          version: r.version,
        })),
      },
    });
  } catch (err) {
    logger.error("Error batch updating config:", err);
    res.status(500).json({ error: "Impossible de mettre à jour la configuration" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 4: PATCH /admin/system/config/:key
// Update single parameter
// ═══════════════════════════════════════════════════════════════════════════

router.patch("/config/:key", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, reason } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: "Value required" });
    }

    if (!isValidKey(key)) {
      return res.status(400).json({ error: "Invalid parameter key format" });
    }

    const param = await prisma.systemParameter.findUnique({ where: { key } });
    if (!param) {
      return res.status(404).json({ error: "Parameter not found" });
    }

    // Validate value
    const validation = validateValue(param, value);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const oldValue = param.value;

    // Update parameter
    const updated = await prisma.systemParameter.update({
      where: { key },
      data: {
        value: validation.value,
        version: { increment: 1 },
        updatedBy: req.user.id,
      },
    });

    // Create history record
    await prisma.parameterHistory.create({
      data: {
        parameterId: updated.id,
        oldValue,
        newValue: validation.value,
        changedBy: req.user.id,
        changedByRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        reason: reason || null,
      },
    });

    res.json({
      success: true,
      data: {
        key: updated.key,
        value: updated.value,
        oldValue,
        version: updated.version,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    logger.error("Error updating parameter:", err);
    res.status(500).json({ error: "Impossible de mettre à jour le paramètre" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 5: POST /admin/system/config/reset/:category
// Reset category to default values
// ═══════════════════════════════════════════════════════════════════════════

router.post("/config/reset/:category", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const { reason } = req.body;

    const params = await prisma.systemParameter.findMany({
      where: { category },
    });

    if (params.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Reset all to default values
    const results = await Promise.all(
      params.map(async (param) => {
        const updated = await prisma.systemParameter.update({
          where: { id: param.id },
          data: {
            value: param.defaultValue,
            version: { increment: 1 },
            updatedBy: req.user.id,
          },
        });

        // Create history record
        await prisma.parameterHistory.create({
          data: {
            parameterId: param.id,
            oldValue: param.value,
            newValue: param.defaultValue,
            changedBy: req.user.id,
            changedByRole: req.user.role,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            reason: reason || "Category reset to defaults",
          },
        });

        return updated;
      })
    );

    res.json({
      success: true,
      data: {
        category,
        reset: results.length,
      },
    });
  } catch (err) {
    logger.error("Error resetting category:", err);
    res.status(500).json({ error: "Impossible de réinitialiser la catégorie" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 6: GET /admin/system/config/history/:key
// Get parameter change history
// ═══════════════════════════════════════════════════════════════════════════

router.get("/config/history/:key", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const param = await prisma.systemParameter.findUnique({
      where: { key },
      select: { id: true, key: true, label: true },
    });

    if (!param) {
      return res.status(404).json({ error: "Parameter not found" });
    }

    const history = await prisma.parameterHistory.findMany({
      where: { parameterId: param.id },
      orderBy: { changedAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.parameterHistory.count({
      where: { parameterId: param.id },
    });

    res.json({
      success: true,
      data: {
        parameter: param,
        history: history.map((h) => ({
          id: h.id,
          oldValue: h.oldValue,
          newValue: h.newValue,
          changedBy: h.changedBy,
          changedByRole: h.changedByRole,
          changedAt: h.changedAt,
          reason: h.reason,
          ipAddress: h.ipAddress,
        })),
        meta: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (err) {
    logger.error("Error fetching history:", err);
    res.status(500).json({ error: "Impossible de récupérer l'historique" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 7: GET /admin/system/config/recent-changes
// Get recent changes across all parameters
// ═══════════════════════════════════════════════════════════════════════════

router.get("/config/recent-changes", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const changes = await prisma.parameterHistory.findMany({
      orderBy: { changedAt: "desc" },
      take: parseInt(limit),
      include: {
        parameter: {
          select: {
            key: true,
            label: true,
            category: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: changes.map((c) => ({
        id: c.id,
        parameter: {
          key: c.parameter.key,
          label: c.parameter.label,
          category: c.parameter.category,
        },
        oldValue: c.oldValue,
        newValue: c.newValue,
        changedBy: c.changedBy,
        changedByRole: c.changedByRole,
        changedAt: c.changedAt,
        reason: c.reason,
      })),
      meta: {
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    logger.error("Error fetching recent changes:", err);
    res.status(500).json({ error: "Impossible de récupérer les changements récents" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 8: POST /admin/system/config/snapshot
// Create configuration snapshot
// ═══════════════════════════════════════════════════════════════════════════

router.post("/config/snapshot", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Snapshot name required" });
    }

    // Get all current parameters
    const allParams = await prisma.systemParameter.findMany();

    // Create snapshot with full config
    const snapshot = await prisma.configurationSnapshot.create({
      data: {
        name,
        description: description || null,
        snapshot: allParams.map((p) => ({
          key: p.key,
          category: p.category,
          value: p.value,
          type: p.type,
          scope: p.scope,
        })),
        createdBy: req.user.id,
      },
    });

    res.json({
      success: true,
      data: {
        id: snapshot.id,
        name: snapshot.name,
        description: snapshot.description,
        createdAt: snapshot.createdAt,
        parametersCount: allParams.length,
      },
    });
  } catch (err) {
    logger.error("Error creating snapshot:", err);
    res.status(500).json({ error: "Impossible de créer le snapshot" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 9: POST /admin/system/config/rollback/:snapshotId
// Rollback to snapshot
// ═══════════════════════════════════════════════════════════════════════════

router.post("/config/rollback/:snapshotId", auth, requireSuperAdmin, async (req, res) => {
  try {
    const snapshotId = parseInt(req.params.snapshotId);
    const { reason } = req.body;

    if (!Number.isFinite(snapshotId)) {
      return res.status(400).json({ error: "Invalid snapshot ID" });
    }

    const snapshot = await prisma.configurationSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      return res.status(404).json({ error: "Snapshot not found" });
    }

    const snapshotConfig = snapshot.snapshot;
    if (!Array.isArray(snapshotConfig)) {
      return res.status(500).json({ error: "Invalid snapshot data" });
    }

    // Restore each parameter
    const restored = await Promise.all(
      snapshotConfig.map(async (snapParam) => {
        const current = await prisma.systemParameter.findUnique({
          where: { key: snapParam.key },
        });

        if (!current) {
          logger.warn(`Parameter ${snapParam.key} not found, skipping`);
          return null;
        }

        const updated = await prisma.systemParameter.update({
          where: { key: snapParam.key },
          data: {
            value: snapParam.value,
            version: { increment: 1 },
            updatedBy: req.user.id,
          },
        });

        // Create history record
        await prisma.parameterHistory.create({
          data: {
            parameterId: current.id,
            oldValue: current.value,
            newValue: snapParam.value,
            changedBy: req.user.id,
            changedByRole: req.user.role,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            reason: reason || `Rollback to snapshot: ${snapshot.name}`,
          },
        });

        return updated;
      })
    );

    // Mark snapshot as restored
    await prisma.configurationSnapshot.update({
      where: { id: snapshotId },
      data: {
        restoredAt: new Date(),
        restoredBy: req.user.id,
      },
    });

    res.json({
      success: true,
      data: {
        snapshot: {
          id: snapshot.id,
          name: snapshot.name,
        },
        restored: restored.filter((r) => r !== null).length,
      },
    });
  } catch (err) {
    logger.error("Error rolling back:", err);
    res.status(500).json({ error: "Impossible de restaurer le snapshot" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 10: GET /admin/system/config/export
// Export config as JSON
// ═══════════════════════════════════════════════════════════════════════════

router.get("/config/export", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { category } = req.query;

    const where = category ? { category } : {};
    const params = await prisma.systemParameter.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.id,
      category: category || "all",
      parametersCount: params.length,
      parameters: params.map((p) => ({
        key: p.key,
        category: p.category,
        value: p.value,
        defaultValue: p.defaultValue,
        type: p.type,
        scope: p.scope,
        label: p.label,
        description: p.description,
        unit: p.unit,
        validation: p.validation,
      })),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="system-config-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err) {
    logger.error("Error exporting config:", err);
    res.status(500).json({ error: "Impossible d'exporter la configuration" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 11: POST /admin/system/config/import
// Import config from JSON
// ═══════════════════════════════════════════════════════════════════════════

router.post("/config/import", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { parameters, dryRun = false, reason } = req.body;

    if (!Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({ error: "Parameters array required" });
    }

    // Validate all parameters
    const validations = await Promise.all(
      parameters.map(async (p) => {
        if (!p.key) {
          return { valid: false, error: "Missing key", param: p };
        }

        const existing = await prisma.systemParameter.findUnique({
          where: { key: p.key },
        });

        if (!existing) {
          return { valid: false, error: "Parameter not found", param: p };
        }

        const validation = validateValue(existing, p.value);
        if (!validation.valid) {
          return { valid: false, error: validation.error, param: p };
        }

        return { valid: true, param: p, existing, newValue: validation.value };
      })
    );

    const invalid = validations.filter((v) => !v.valid);
    if (invalid.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: invalid.map((v) => ({ key: v.param.key, error: v.error })),
      });
    }

    if (dryRun) {
      return res.json({
        success: true,
        dryRun: true,
        data: {
          valid: validations.length,
          changes: validations.map((v) => ({
            key: v.param.key,
            currentValue: v.existing.value,
            newValue: v.newValue,
            willChange: v.existing.value !== v.newValue,
          })),
        },
      });
    }

    // Perform import
    const results = await Promise.all(
      validations.map(async (v) => {
        if (v.existing.value === v.newValue) {
          return null; // No change needed
        }

        const updated = await prisma.systemParameter.update({
          where: { key: v.param.key },
          data: {
            value: v.newValue,
            version: { increment: 1 },
            updatedBy: req.user.id,
          },
        });

        await prisma.parameterHistory.create({
          data: {
            parameterId: v.existing.id,
            oldValue: v.existing.value,
            newValue: v.newValue,
            changedBy: req.user.id,
            changedByRole: req.user.role,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            reason: reason || "Config import",
          },
        });

        return updated;
      })
    );

    res.json({
      success: true,
      data: {
        imported: validations.length,
        changed: results.filter((r) => r !== null).length,
        unchanged: results.filter((r) => r === null).length,
      },
    });
  } catch (err) {
    logger.error("Error importing config:", err);
    res.status(500).json({ error: "Impossible d'importer la configuration" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 12: GET /admin/system/config/snapshots
// List all configuration snapshots
// ═══════════════════════════════════════════════════════════════════════════

router.get("/config/snapshots", auth, requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const snapshots = await prisma.configurationSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.configurationSnapshot.count();

    res.json({
      success: true,
      data: snapshots.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        createdAt: s.createdAt,
        createdBy: s.createdBy,
        restoredAt: s.restoredAt,
        restoredBy: s.restoredBy,
        parametersCount: Array.isArray(s.snapshot) ? s.snapshot.length : 0,
      })),
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (err) {
    logger.error("Error fetching snapshots:", err);
    res.status(500).json({ error: "Impossible de récupérer les snapshots" });
  }
});

module.exports = router;
