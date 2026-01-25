const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const prisma = require("@quelyos/database");

// ========================================
// ACTIONS ENDPOINTS
// ========================================

/**
 * POST /actions/:id/complete
 * Mark an action as completed
 */
router.post("/:id/complete", requireAuth, async (req, res) => {
  try {
    const actionId = parseInt(req.params.id);
    const { companyId } = req.user;

    // Check if action exists and belongs to user's company
    const action = await prisma.action.findFirst({
      where: {
        id: actionId,
        companyId: companyId,
      },
    });

    if (!action) {
      return res.status(404).json({ error: "Action not found" });
    }

    // Update action status to completed
    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: {
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      action: updatedAction,
    });
  } catch (error) {
    console.error("Error completing action:", error);
    res.status(500).json({ error: "Failed to complete action" });
  }
});

/**
 * POST /actions/:id/snooze
 * Snooze an action to a new due date
 */
router.post("/:id/snooze", requireAuth, async (req, res) => {
  try {
    const actionId = parseInt(req.params.id);
    const { companyId } = req.user;
    const { dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({ error: "dueDate is required" });
    }

    // Validate date format
    const newDueDate = new Date(dueDate);
    if (isNaN(newDueDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Check if action exists and belongs to user's company
    const action = await prisma.action.findFirst({
      where: {
        id: actionId,
        companyId: companyId,
      },
    });

    if (!action) {
      return res.status(404).json({ error: "Action not found" });
    }

    // Update action due date
    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: {
        dueDate: newDueDate,
        status: "snoozed",
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      action: updatedAction,
    });
  } catch (error) {
    console.error("Error snoozing action:", error);
    res.status(500).json({ error: "Failed to snooze action" });
  }
});

/**
 * GET /actions
 * Get all actions for a company
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { status, priority, limit = 50 } = req.query;

    const where = {
      companyId: companyId,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const actions = await prisma.action.findMany({
      where,
      orderBy: [
        { priority: "desc" }, // high, medium, low
        { dueDate: "asc" },
      ],
      take: parseInt(limit),
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            outstandingBalance: true,
          },
        },
      },
    });

    res.json(actions);
  } catch (error) {
    console.error("Error fetching actions:", error);
    res.status(500).json({ error: "Failed to fetch actions" });
  }
});

/**
 * POST /actions
 * Create a new action
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { title, description, type, priority, dueDate, customerIds } = req.body;

    if (!title || !type || !priority || !dueDate) {
      return res.status(400).json({
        error: "title, type, priority, and dueDate are required",
      });
    }

    const newAction = await prisma.action.create({
      data: {
        companyId,
        title,
        description,
        type,
        priority,
        dueDate: new Date(dueDate),
        status: "pending",
        customers: customerIds
          ? {
              connect: customerIds.map((id) => ({ id: parseInt(id) })),
            }
          : undefined,
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            outstandingBalance: true,
          },
        },
      },
    });

    res.status(201).json(newAction);
  } catch (error) {
    console.error("Error creating action:", error);
    res.status(500).json({ error: "Failed to create action" });
  }
});

/**
 * DELETE /actions/:id
 * Delete an action
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const actionId = parseInt(req.params.id);
    const { companyId } = req.user;

    // Check if action exists and belongs to user's company
    const action = await prisma.action.findFirst({
      where: {
        id: actionId,
        companyId: companyId,
      },
    });

    if (!action) {
      return res.status(404).json({ error: "Action not found" });
    }

    await prisma.action.delete({
      where: { id: actionId },
    });

    res.json({ success: true, message: "Action deleted" });
  } catch (error) {
    console.error("Error deleting action:", error);
    res.status(500).json({ error: "Failed to delete action" });
  }
});

module.exports = router;
