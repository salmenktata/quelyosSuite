const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * Planning Routes
 * Shift management and scheduling
 */

// Schema validation
const shiftSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  storeId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * GET /api/v1/rh/planning
 * Liste les shifts (planning)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { employeeId, storeId, startDate, endDate } = req.query;

    const where = { companyId };

    if (employeeId) where.employeeId = parseInt(employeeId);
    if (storeId) where.storeId = parseInt(storeId);

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json(shifts);
  } catch (error) {
    logger.error('[RH/Planning] Error fetching shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

/**
 * POST /api/v1/rh/planning
 * Créer un shift
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Validation
    const validatedData = shiftSchema.parse(req.body);

    // TODO: Vérifier les conflits d'horaires

    const shift = await prisma.shift.create({
      data: {
        ...validatedData,
        companyId,
        createdById: req.user.id,
        status: 'SCHEDULED',
      },
      include: {
        employee: true,
        store: true,
      },
    });

    logger.info('[RH/Planning] Shift created:', { shiftId: shift.id });
    res.status(201).json(shift);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Planning] Error creating shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

/**
 * PUT /api/v1/rh/planning/:id
 * Mettre à jour un shift
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const shiftId = parseInt(req.params.id);

    const existingShift = await prisma.shift.findFirst({
      where: { id: shiftId, companyId },
    });

    if (!existingShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const validatedData = shiftSchema.partial().parse(req.body);

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: validatedData,
      include: {
        employee: true,
        store: true,
      },
    });

    logger.info('[RH/Planning] Shift updated:', { shiftId });
    res.json(shift);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Planning] Error updating shift:', error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

/**
 * DELETE /api/v1/rh/planning/:id
 * Supprimer un shift
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const shiftId = parseInt(req.params.id);

    const existingShift = await prisma.shift.findFirst({
      where: { id: shiftId, companyId },
    });

    if (!existingShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    await prisma.shift.delete({
      where: { id: shiftId },
    });

    logger.info('[RH/Planning] Shift deleted:', { shiftId });
    res.json({ success: true });
  } catch (error) {
    logger.error('[RH/Planning] Error deleting shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

module.exports = router;
