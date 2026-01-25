const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Employee Management Routes
 * CRUD operations for employees
 */

// Schema validation
const employeeSchema = z.object({
  employeeNumber: z.string().min(1).max(50),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  storeId: z.number().int().positive().optional().nullable(),
  teamId: z.number().int().positive().optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  hireDate: z.coerce.date(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED']).optional(),
  leaveBalance: z.number().optional(),
  userId: z.number().int().positive().optional().nullable(),
});

/**
 * GET /api/v1/rh/employees
 * Liste tous les employés de l'entreprise
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { storeId, teamId, status, search } = req.query;

    const where = { companyId };

    // Filtres
    if (storeId) where.storeId = parseInt(storeId);
    if (teamId) where.teamId = parseInt(teamId);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            pointages: true,
            demandes: true,
            shifts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(employees);
  } catch (error) {
    logger.error('[RH/Employees] Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/**
 * GET /api/v1/rh/employees/me
 * Profil de l'employé connecté (pour mobile app)
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await prisma.employee.findFirst({
      where: { userId },
      include: {
        store: true,
        team: {
          include: {
            managers: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        contracts: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    res.json(employee);
  } catch (error) {
    logger.error('[RH/Employees] Error fetching employee profile:', error);
    res.status(500).json({ error: 'Failed to fetch employee profile' });
  }
});

/**
 * GET /api/v1/rh/employees/:id/stats
 * Statistiques d'un employé (pointages, congés, etc.)
 * IMPORTANT: Cette route doit venir AVANT /:id pour éviter les conflits
 */
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = parseInt(req.params.id);

    // Vérifier l'existence et l'appartenance
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Calculer les stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalPointages,
      pointagesThisMonth,
      anomaliesCount,
      demandesCount,
      demandesPending,
      shiftsThisMonth,
    ] = await Promise.all([
      prisma.pointage.count({ where: { employeeId } }),
      prisma.pointage.count({
        where: {
          employeeId,
          timestamp: { gte: startOfMonth },
        },
      }),
      prisma.pointage.count({
        where: {
          employeeId,
          isAnomaly: true,
        },
      }),
      prisma.demande.count({ where: { employeeId } }),
      prisma.demande.count({
        where: {
          employeeId,
          status: 'PENDING',
        },
      }),
      prisma.shift.count({
        where: {
          employeeId,
          date: { gte: startOfMonth },
        },
      }),
    ]);

    res.json({
      employeeId,
      stats: {
        totalPointages,
        pointagesThisMonth,
        anomaliesCount,
        demandesCount,
        demandesPending,
        shiftsThisMonth,
        leaveBalance: employee.leaveBalance,
        leaveTaken: employee.leaveTaken,
      },
    });
  } catch (error) {
    logger.error('[RH/Employees] Error fetching employee stats:', error);
    res.status(500).json({ error: 'Failed to fetch employee stats' });
  }
});

/**
 * GET /api/v1/rh/employees/:id
 * Détails d'un employé
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = parseInt(req.params.id);

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
      include: {
        store: true,
        team: {
          include: {
            managers: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        contracts: {
          orderBy: { startDate: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        managedTeams: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    logger.error('[RH/Employees] Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

/**
 * POST /api/v1/rh/employees
 * Créer un nouvel employé
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Validation
    const validatedData = employeeSchema.parse(req.body);

    // Vérifier l'unicité du employeeNumber
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        companyId,
        employeeNumber: validatedData.employeeNumber,
      },
    });

    if (existingEmployee) {
      return res.status(400).json({
        error: 'Employee number already exists',
        field: 'employeeNumber',
      });
    }

    // Générer un QR code unique pour l'employé
    const qrCode = `EMP-${companyId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        qrCode,
        companyId,
      },
      include: {
        store: true,
        team: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    logger.info('[RH/Employees] Employee created:', {
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
    });
    res.status(201).json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Employees] Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

/**
 * PUT /api/v1/rh/employees/:id
 * Mettre à jour un employé
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = parseInt(req.params.id);

    // Vérifier l'existence et l'appartenance
    const existingEmployee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validation
    const validatedData = employeeSchema.partial().parse(req.body);

    // Vérifier l'unicité du employeeNumber si modifié
    if (validatedData.employeeNumber && validatedData.employeeNumber !== existingEmployee.employeeNumber) {
      const duplicate = await prisma.employee.findFirst({
        where: {
          companyId,
          employeeNumber: validatedData.employeeNumber,
          id: { not: employeeId },
        },
      });

      if (duplicate) {
        return res.status(400).json({
          error: 'Employee number already exists',
          field: 'employeeNumber',
        });
      }
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: validatedData,
      include: {
        store: true,
        team: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    logger.info('[RH/Employees] Employee updated:', { employeeId });
    res.json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Employees] Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

/**
 * DELETE /api/v1/rh/employees/:id
 * Supprimer un employé (soft delete via status)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = parseInt(req.params.id);

    // Vérifier l'existence et l'appartenance
    const existingEmployee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Soft delete : changer le statut à TERMINATED
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'TERMINATED' },
    });

    logger.info('[RH/Employees] Employee terminated:', { employeeId });
    res.json({ success: true, employee });
  } catch (error) {
    logger.error('[RH/Employees] Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
