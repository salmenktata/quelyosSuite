const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * Team Management Routes
 * Manage teams and assign managers
 */

// Schema validation
const teamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  storeId: z.number().int().positive().optional(),
});

/**
 * GET /api/v1/rh/teams
 * Liste toutes les équipes de l'entreprise
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { storeId } = req.query;

    const where = { companyId };
    if (storeId) {
      where.storeId = parseInt(storeId);
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        managers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(teams);
  } catch (error) {
    logger.error('[RH/Teams] Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * GET /api/v1/rh/teams/:id
 * Détails d'une équipe
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const teamId = parseInt(req.params.id);

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        companyId,
      },
      include: {
        store: true,
        managers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            status: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    logger.error('[RH/Teams] Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

/**
 * POST /api/v1/rh/teams
 * Créer une nouvelle équipe
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Validation
    const validatedData = teamSchema.parse(req.body);

    const team = await prisma.team.create({
      data: {
        ...validatedData,
        companyId,
      },
      include: {
        store: true,
      },
    });

    logger.info('[RH/Teams] Team created:', { teamId: team.id, name: team.name });
    res.status(201).json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Teams] Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

/**
 * PUT /api/v1/rh/teams/:id
 * Mettre à jour une équipe
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const teamId = parseInt(req.params.id);

    // Vérifier l'existence et l'appartenance
    const existingTeam = await prisma.team.findFirst({
      where: { id: teamId, companyId },
    });

    if (!existingTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Validation
    const validatedData = teamSchema.partial().parse(req.body);

    const team = await prisma.team.update({
      where: { id: teamId },
      data: validatedData,
      include: {
        store: true,
      },
    });

    logger.info('[RH/Teams] Team updated:', { teamId: team.id });
    res.json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Teams] Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

/**
 * DELETE /api/v1/rh/teams/:id
 * Supprimer une équipe
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const teamId = parseInt(req.params.id);

    // Vérifier l'existence et l'appartenance
    const existingTeam = await prisma.team.findFirst({
      where: { id: teamId, companyId },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!existingTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Empêcher la suppression si des employés sont assignés
    if (existingTeam._count.employees > 0) {
      return res.status(400).json({
        error: 'Cannot delete team with assigned employees',
        employeeCount: existingTeam._count.employees,
      });
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    logger.info('[RH/Teams] Team deleted:', { teamId });
    res.json({ success: true });
  } catch (error) {
    logger.error('[RH/Teams] Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

/**
 * POST /api/v1/rh/teams/:id/managers
 * Assigner un manager à une équipe
 */
router.post('/:id/managers', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const teamId = parseInt(req.params.id);
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    // Vérifier que l'équipe et l'employé appartiennent à la même company
    const team = await prisma.team.findFirst({
      where: { id: teamId, companyId },
    });

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!team || !employee) {
      return res.status(404).json({ error: 'Team or employee not found' });
    }

    // Assigner le manager
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        managers: {
          connect: { id: employeeId },
        },
      },
      include: {
        managers: true,
      },
    });

    logger.info('[RH/Teams] Manager assigned:', { teamId, employeeId });
    res.json(updatedTeam);
  } catch (error) {
    logger.error('[RH/Teams] Error assigning manager:', error);
    res.status(500).json({ error: 'Failed to assign manager' });
  }
});

/**
 * DELETE /api/v1/rh/teams/:id/managers/:employeeId
 * Retirer un manager d'une équipe
 */
router.delete('/:id/managers/:employeeId', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const teamId = parseInt(req.params.id);
    const employeeId = parseInt(req.params.employeeId);

    // Vérifier l'appartenance
    const team = await prisma.team.findFirst({
      where: { id: teamId, companyId },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Retirer le manager
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        managers: {
          disconnect: { id: employeeId },
        },
      },
      include: {
        managers: true,
      },
    });

    logger.info('[RH/Teams] Manager removed:', { teamId, employeeId });
    res.json(updatedTeam);
  } catch (error) {
    logger.error('[RH/Teams] Error removing manager:', error);
    res.status(500).json({ error: 'Failed to remove manager' });
  }
});

module.exports = router;
