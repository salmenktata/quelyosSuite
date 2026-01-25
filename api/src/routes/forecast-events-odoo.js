/**
 * Forecast Events Routes - Odoo Integration (Double Write Strategy)
 *
 * Maps to quelyos.forecast.event (ML forecast annotations)
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

// ---------- CREATE FORECAST EVENT (DOUBLE WRITE) ----------
router.post("/", auth, async (req, res) => {
  try {
    const { date, label, description, type, confidence, source } = req.body;

    if (!date || !label?.trim()) {
      return res.status(400).json({ error: "Date and label are required" });
    }

    const eventType = type || 'manual';

    // STEP 1: Create in Prisma
    const prismaEvent = await prisma.forecastEvent.create({
      data: {
        companyId: req.user.companyId,
        date: new Date(date),
        label: label.trim(),
        description: description || null,
        type: eventType,
        confidence: confidence ? parseFloat(confidence) : null,
        source: source || null
      }
    });

    // STEP 2: Create in Odoo
    try {
      const odooCompanyId = await getOdooCompanyId(req.user.companyId);

      const odooEvent = await odoo.create('quelyos.forecast.event', {
        company_id: odooCompanyId,
        date: date,
        label: label.trim(),
        description: description || false,
        event_type: eventType,
        confidence: confidence ? parseFloat(confidence) : 0.0,
        source: source || false
      });

      if (odooEvent && odooEvent.id) {
        await storeMapping('ForecastEvent', prismaEvent.id, 'quelyos.forecast.event', odooEvent.id);
        logger.info(`[ForecastEvents] Created: Prisma#${prismaEvent.id} <-> Odoo#${odooEvent.id}`);
      }

    } catch (odooError) {
      logger.error(`[ForecastEvents] Odoo creation failed:`, odooError);
    }

    res.json(prismaEvent);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Forecast event creation failed" });
  }
});

// ---------- LIST FORECAST EVENTS ----------
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { companyId: req.user.companyId };

    // Filter by date range if provided
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    }

    const events = await prisma.forecastEvent.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json(events);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Could not fetch forecast events" });
  }
});

// ---------- UPDATE FORECAST EVENT (DOUBLE WRITE) ----------
router.put("/:id", auth, async (req, res) => {
  try {
    const eventId = Number(req.params.id);

    const existing = await prisma.forecastEvent.findFirst({
      where: { id: eventId, companyId: req.user.companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Forecast event not found" });
    }

    // STEP 1: Update Prisma
    const updateData = {};
    if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
    if (req.body.label !== undefined) updateData.label = req.body.label.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.confidence !== undefined) updateData.confidence = req.body.confidence ? parseFloat(req.body.confidence) : null;
    if (req.body.source !== undefined) updateData.source = req.body.source;

    const updated = await prisma.forecastEvent.update({
      where: { id: eventId },
      data: updateData
    });

    // STEP 2: Update Odoo
    try {
      const odooId = await getOdooId('ForecastEvent', eventId);
      if (odooId) {
        const odooUpdateData = {};
        if (req.body.date) odooUpdateData.date = req.body.date;
        if (req.body.label) odooUpdateData.label = req.body.label.trim();
        if (req.body.description !== undefined) odooUpdateData.description = req.body.description || false;
        if (req.body.type) odooUpdateData.event_type = req.body.type;
        if (req.body.confidence !== undefined) odooUpdateData.confidence = req.body.confidence ? parseFloat(req.body.confidence) : 0.0;
        if (req.body.source !== undefined) odooUpdateData.source = req.body.source || false;

        await odoo.write('quelyos.forecast.event', odooId, odooUpdateData);
        logger.info(`[ForecastEvents] Updated in Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[ForecastEvents] Odoo update failed:`, odooError);
    }

    res.json(updated);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Forecast event update failed" });
  }
});

// ---------- DELETE FORECAST EVENT (DOUBLE DELETE) ----------
router.delete("/:id", auth, async (req, res) => {
  try {
    const eventId = Number(req.params.id);

    const event = await prisma.forecastEvent.findFirst({
      where: { id: eventId, companyId: req.user.companyId }
    });

    if (!event) {
      return res.status(404).json({ error: "Forecast event not found" });
    }

    // Delete from Odoo first
    try {
      const odooId = await getOdooId('ForecastEvent', eventId);
      if (odooId) {
        await odoo.unlink('quelyos.forecast.event', [odooId]);
        logger.info(`[ForecastEvents] Deleted from Odoo: ${odooId}`);
      }
    } catch (odooError) {
      logger.error(`[ForecastEvents] Odoo deletion failed:`, odooError);
    }

    // Delete from Prisma
    await prisma.forecastEvent.delete({ where: { id: eventId } });

    res.json({ success: true });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Forecast event deletion failed" });
  }
});

module.exports = router;
