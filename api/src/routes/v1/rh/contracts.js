const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * Contract Management Routes
 * Employee contracts (CDI, CDD, Stage, etc.)
 */

// Schema validation
const contractSchema = z.object({
  employeeId: z.number().int().positive(),
  type: z.enum(['CDI', 'CDD', 'STAGE', 'INTERIM']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  salary: z.number().positive(),
  position: z.string().max(255),
  documentUrl: z.string().optional(), // URL S3 du contrat scanné
  isActive: z.boolean().optional(),
});

/**
 * GET /api/v1/rh/contracts
 * Liste les contrats
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { employeeId, type, isActive } = req.query;

    const where = { companyId };

    if (employeeId) where.employeeId = parseInt(employeeId);
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const contracts = await prisma.contract.findMany({
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
      orderBy: { startDate: 'desc' },
    });

    res.json(contracts);
  } catch (error) {
    logger.error('[RH/Contracts] Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

/**
 * GET /api/v1/rh/contracts/:id
 * Détails d'un contrat
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const contractId = parseInt(req.params.id);

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, companyId },
      include: {
        employee: true,
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    logger.error('[RH/Contracts] Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

/**
 * POST /api/v1/rh/contracts
 * Créer un nouveau contrat
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Validation
    const validatedData = contractSchema.parse(req.body);

    // Vérifier que l'employé appartient à la company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        companyId,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const contract = await prisma.contract.create({
      data: {
        ...validatedData,
        companyId,
      },
      include: {
        employee: true,
      },
    });

    logger.info('[RH/Contracts] Contract created:', {
      contractId: contract.id,
      employeeId: contract.employeeId,
    });
    res.status(201).json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Contracts] Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

/**
 * PUT /api/v1/rh/contracts/:id
 * Mettre à jour un contrat
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const contractId = parseInt(req.params.id);

    const existingContract = await prisma.contract.findFirst({
      where: { id: contractId, companyId },
    });

    if (!existingContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const validatedData = contractSchema.partial().parse(req.body);

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: validatedData,
      include: {
        employee: true,
      },
    });

    logger.info('[RH/Contracts] Contract updated:', { contractId });
    res.json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Contracts] Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

/**
 * DELETE /api/v1/rh/contracts/:id
 * Supprimer un contrat
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const contractId = parseInt(req.params.id);

    const existingContract = await prisma.contract.findFirst({
      where: { id: contractId, companyId },
    });

    if (!existingContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    await prisma.contract.delete({
      where: { id: contractId },
    });

    logger.info('[RH/Contracts] Contract deleted:', { contractId });
    res.json({ success: true });
  } catch (error) {
    logger.error('[RH/Contracts] Error deleting contract:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

module.exports = router;
