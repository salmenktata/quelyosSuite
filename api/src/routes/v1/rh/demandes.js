const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * Demandes Routes
 * Manage leave requests, absence justifications, and salary advances
 */

// Schema validation
const demandeSchema = z.object({
  type: z.enum(['CONGES', 'ABSENCE', 'AVANCE']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  amount: z.number().positive().optional(), // Pour les avances
  reason: z.string().max(500).optional(),
  justificationUrl: z.string().optional(), // URL du document S3
});

/**
 * POST /api/v1/rh/demandes
 * Créer une nouvelle demande
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Récupérer l'employé
    const employee = await prisma.employee.findFirst({
      where: { userId: req.user.id, companyId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    // Validation
    const validatedData = demandeSchema.parse(req.body);

    // TODO: Validation métier
    // - Vérifier le solde de congés pour type CONGES
    // - Vérifier les chevauchements de dates

    const demande = await prisma.demande.create({
      data: {
        ...validatedData,
        employeeId: employee.id,
        companyId,
        status: 'PENDING',
      },
    });

    logger.info('[RH/Demandes] Demande created:', {
      demandeId: demande.id,
      type: demande.type,
      employeeId: employee.id,
    });

    res.status(201).json(demande);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Demandes] Error creating demande:', error);
    res.status(500).json({ error: 'Failed to create demande' });
  }
});

/**
 * GET /api/v1/rh/demandes
 * Liste des demandes (filtrées selon le rôle)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { type, status, employeeId } = req.query;

    const where = { companyId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (employeeId) where.employeeId = parseInt(employeeId);

    // TODO: Filtrer selon le rôle
    // - RH_AGENT: seulement ses propres demandes
    // - RH_MANAGER: demandes de son équipe
    // - RH_ADMIN: toutes les demandes

    const demandes = await prisma.demande.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(demandes);
  } catch (error) {
    logger.error('[RH/Demandes] Error fetching demandes:', error);
    res.status(500).json({ error: 'Failed to fetch demandes' });
  }
});

/**
 * GET /api/v1/rh/demandes/:id
 * Détails d'une demande
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const demandeId = parseInt(req.params.id);

    const demande = await prisma.demande.findFirst({
      where: {
        id: demandeId,
        companyId,
      },
      include: {
        employee: {
          include: {
            team: true,
            store: true,
          },
        },
        approvedByTeamUser: {
          select: {
            id: true,
            email: true,
          },
        },
        approvedByRHUser: {
          select: {
            id: true,
            email: true,
          },
        },
        rejectedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande not found' });
    }

    res.json(demande);
  } catch (error) {
    logger.error('[RH/Demandes] Error fetching demande:', error);
    res.status(500).json({ error: 'Failed to fetch demande' });
  }
});

/**
 * POST /api/v1/rh/demandes/:id/approve
 * Approuver une demande (niveau équipe ou RH)
 */
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const demandeId = parseInt(req.params.id);
    const { level } = req.body; // 'TEAM' or 'RH'

    // Vérifier la demande
    const demande = await prisma.demande.findFirst({
      where: { id: demandeId, companyId },
      include: { employee: true },
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande not found' });
    }

    // TODO: Vérifier les permissions selon le rôle

    let updatedDemande;

    if (level === 'TEAM') {
      updatedDemande = await prisma.demande.update({
        where: { id: demandeId },
        data: {
          status: 'APPROVED_TEAM',
          approvedByTeamId: req.user.id,
          approvedByTeamAt: new Date(),
        },
      });
    } else if (level === 'RH') {
      updatedDemande = await prisma.demande.update({
        where: { id: demandeId },
        data: {
          status: 'APPROVED_RH',
          approvedByRHId: req.user.id,
          approvedByRHAt: new Date(),
        },
      });

      // TODO: Si type CONGES, déduire du solde
      if (demande.type === 'CONGES') {
        const days = Math.ceil(
          (new Date(demande.endDate) - new Date(demande.startDate)) / (1000 * 60 * 60 * 24)
        );
        await prisma.employee.update({
          where: { id: demande.employeeId },
          data: {
            leaveTaken: { increment: days },
          },
        });
      }
    }

    logger.info('[RH/Demandes] Demande approved:', { demandeId, level });
    res.json(updatedDemande);
  } catch (error) {
    logger.error('[RH/Demandes] Error approving demande:', error);
    res.status(500).json({ error: 'Failed to approve demande' });
  }
});

/**
 * POST /api/v1/rh/demandes/:id/reject
 * Rejeter une demande
 */
router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const demandeId = parseInt(req.params.id);
    const { reason } = req.body;

    const demande = await prisma.demande.findFirst({
      where: { id: demandeId, companyId },
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande not found' });
    }

    // TODO: Vérifier les permissions selon le rôle

    const updatedDemande = await prisma.demande.update({
      where: { id: demandeId },
      data: {
        status: 'REJECTED',
        rejectedById: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    logger.info('[RH/Demandes] Demande rejected:', { demandeId });
    res.json(updatedDemande);
  } catch (error) {
    logger.error('[RH/Demandes] Error rejecting demande:', error);
    res.status(500).json({ error: 'Failed to reject demande' });
  }
});

module.exports = router;
