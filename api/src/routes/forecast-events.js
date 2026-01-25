const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

/**
 * GET /forecast-events
 * List all forecast events for the company
 */
router.get("/", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const events = await prisma.forecastEvent.findMany({
      where: { companyId },
      orderBy: { date: 'asc' }
    });

    logger.info(`[ForecastEvents] Retrieved ${events.length} events for company ${companyId}`);

    res.json(events);
  } catch (err) {
    logger.error("[ForecastEvents] GET error:", err);
    res.status(500).json({ error: "Failed to retrieve forecast events" });
  }
});

/**
 * GET /forecast-events/:id
 * Get a single forecast event
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const eventId = parseInt(req.params.id);

    const event = await prisma.forecastEvent.findFirst({
      where: {
        id: eventId,
        companyId // Security: ensure event belongs to company
      }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (err) {
    logger.error("[ForecastEvents] GET by ID error:", err);
    res.status(500).json({ error: "Failed to retrieve forecast event" });
  }
});

/**
 * POST /forecast-events
 * Create a new manual forecast event annotation
 */
router.post("/", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { date, label, description } = req.body;

    // Validation
    if (!date || !label) {
      return res.status(400).json({ error: "Date and label are required" });
    }

    const event = await prisma.forecastEvent.create({
      data: {
        companyId,
        date: new Date(date),
        label,
        description: description || null,
        type: "manual",
        source: "user"
      }
    });

    logger.info(`[ForecastEvents] Created manual event: ${label} on ${date}`);

    res.status(201).json(event);
  } catch (err) {
    logger.error("[ForecastEvents] POST error:", err);
    res.status(500).json({ error: "Failed to create forecast event" });
  }
});

/**
 * PUT /forecast-events/:id
 * Update an existing forecast event
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const eventId = parseInt(req.params.id);
    const { date, label, description } = req.body;

    // Check ownership
    const existing = await prisma.forecastEvent.findFirst({
      where: {
        id: eventId,
        companyId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only allow updating manual events
    if (existing.type !== "manual") {
      return res.status(403).json({ error: "Can only update manual events" });
    }

    const updated = await prisma.forecastEvent.update({
      where: { id: eventId },
      data: {
        date: date ? new Date(date) : undefined,
        label: label || undefined,
        description: description !== undefined ? description : undefined
      }
    });

    logger.info(`[ForecastEvents] Updated event ${eventId}`);

    res.json(updated);
  } catch (err) {
    logger.error("[ForecastEvents] PUT error:", err);
    res.status(500).json({ error: "Failed to update forecast event" });
  }
});

/**
 * DELETE /forecast-events/:id
 * Delete a forecast event
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const eventId = parseInt(req.params.id);

    // Check ownership before deleting
    const event = await prisma.forecastEvent.findFirst({
      where: {
        id: eventId,
        companyId
      }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only allow deleting manual events (auto-detected events are regenerated)
    if (event.type === "auto") {
      return res.status(403).json({ error: "Cannot delete auto-detected events. They will be regenerated." });
    }

    await prisma.forecastEvent.delete({
      where: { id: eventId }
    });

    logger.info(`[ForecastEvents] Deleted event ${eventId}`);

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    logger.error("[ForecastEvents] DELETE error:", err);
    res.status(500).json({ error: "Failed to delete forecast event" });
  }
});

/**
 * POST /forecast-events/import
 * Import multiple events from calendar (CSV or ICS format)
 */
router.post("/import", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { events } = req.body; // Array of {date, label, description?}

    // Validation
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "Events array is required" });
    }

    // Validate each event
    const validEvents = events.filter(e => e.date && e.label);

    if (validEvents.length === 0) {
      return res.status(400).json({ error: "No valid events to import" });
    }

    // Create events in batch
    const created = await prisma.forecastEvent.createMany({
      data: validEvents.map(e => ({
        companyId,
        date: new Date(e.date),
        label: e.label,
        description: e.description || null,
        type: "imported",
        source: "calendar_import"
      }))
    });

    logger.info(`[ForecastEvents] Imported ${created.count} events for company ${companyId}`);

    res.status(201).json({
      success: true,
      count: created.count,
      message: `Successfully imported ${created.count} events`
    });
  } catch (err) {
    logger.error("[ForecastEvents] IMPORT error:", err);
    res.status(500).json({ error: "Failed to import events" });
  }
});

/**
 * DELETE /forecast-events/bulk
 * Delete multiple events (bulk delete)
 */
router.delete("/bulk", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { ids } = req.body; // Array of event IDs

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs array is required" });
    }

    // Delete only events belonging to this company
    const deleted = await prisma.forecastEvent.deleteMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) },
        companyId,
        type: { not: "auto" } // Don't delete auto-detected events
      }
    });

    logger.info(`[ForecastEvents] Bulk deleted ${deleted.count} events`);

    res.json({
      success: true,
      count: deleted.count,
      message: `Deleted ${deleted.count} events`
    });
  } catch (err) {
    logger.error("[ForecastEvents] BULK DELETE error:", err);
    res.status(500).json({ error: "Failed to delete events" });
  }
});

module.exports = router;
