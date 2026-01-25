const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * Pointage (Attendance) Routes
 * Check-in/check-out management with GPS validation and QR code scanning
 */

// Schema validation
const pointageSchema = z.object({
  type: z.enum(['ENTREE', 'SORTIE']),
  timestamp: z.coerce.date().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracy: z.number().optional(),
  qrCodeScanned: z.string().optional(),
  deviceId: z.string().optional(),
  deviceModel: z.string().optional(),
  appVersion: z.string().optional(),
  clientTimestamp: z.coerce.date().optional(),
});

/**
 * POST /api/v1/rh/pointage
 * Créer un nouveau pointage (check-in/check-out)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Récupérer l'employé depuis le user connecté
    const employee = await prisma.employee.findFirst({
      where: { userId: req.user.id, companyId },
      include: {
        store: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    // Validation
    const validatedData = pointageSchema.parse(req.body);

    // TODO: Implémenter la logique de détection d'anomalies
    // - Validation GPS (distance du magasin)
    // - Validation QR code
    // - Détection de duplicates
    // - Vérification du shift planifié

    const pointage = await prisma.pointage.create({
      data: {
        ...validatedData,
        timestamp: validatedData.timestamp || new Date(),
        employeeId: employee.id,
        storeId: employee.storeId,
        companyId,
        status: 'VALID', // TODO: Mettre à jour selon validation
        isAnomaly: false, // TODO: Détecter anomalies
        syncedAt: new Date(),
      },
    });

    logger.info('[RH/Pointage] Pointage created:', {
      pointageId: pointage.id,
      employeeId: employee.id,
      type: pointage.type,
    });

    res.status(201).json(pointage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Pointage] Error creating pointage:', error);
    res.status(500).json({ error: 'Failed to create pointage' });
  }
});

/**
 * POST /api/v1/rh/pointage/batch
 * Sync multiple pointages (offline → online)
 */
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { pointages } = req.body;

    if (!Array.isArray(pointages)) {
      return res.status(400).json({ error: 'pointages must be an array' });
    }

    // Récupérer l'employé
    const employee = await prisma.employee.findFirst({
      where: { userId: req.user.id, companyId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    // TODO: Implémenter la logique de batch sync avec gestion des conflits

    const results = await Promise.all(
      pointages.map(async (p) => {
        try {
          const validatedData = pointageSchema.parse(p);
          const pointage = await prisma.pointage.create({
            data: {
              ...validatedData,
              timestamp: validatedData.timestamp || new Date(),
              employeeId: employee.id,
              storeId: employee.storeId,
              companyId,
              status: 'VALID',
              isAnomaly: false,
              syncedAt: new Date(),
            },
          });
          return { success: true, pointage };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );

    res.json({
      success: true,
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    logger.error('[RH/Pointage] Error in batch sync:', error);
    res.status(500).json({ error: 'Failed to sync pointages' });
  }
});

/**
 * GET /api/v1/rh/pointage/dashboard/stats
 * Statistiques pour le dashboard RH (présents, absents, retards, anomalies)
 */
router.get('/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Aujourd'hui à minuit et à 23:59:59
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Employés présents aujourd'hui (ont pointé ENTREE)
    const presentsAujourdhui = await prisma.pointage.count({
      where: {
        companyId,
        type: 'ENTREE',
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      distinct: ['employeeId'],
    });

    // 2. Employés en retard aujourd'hui (pointages avec isLate = true ou statut LATE)
    const retardsAujourdhui = await prisma.pointage.count({
      where: {
        companyId,
        type: 'ENTREE',
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
        OR: [
          { status: 'LATE' },
          { isAnomaly: true },
        ],
      },
    });

    // 3. Anomalies en attente (tous statuts sauf VALID)
    const anomaliesEnAttente = await prisma.pointage.count({
      where: {
        companyId,
        isAnomaly: true,
        status: {
          not: 'VALID',
        },
      },
    });

    // 4. Total d'employés actifs
    const totalEmployees = await prisma.employee.count({
      where: {
        companyId,
        status: 'ACTIVE',
      },
    });

    // 5. Absents = Total actifs - Présents aujourd'hui
    const absentsAujourdhui = totalEmployees - presentsAujourdhui;

    logger.info('[RH/Pointage] Dashboard stats fetched:', {
      presentsAujourdhui,
      absentsAujourdhui,
      retardsAujourdhui,
      anomaliesEnAttente,
    });

    res.json({
      presentsAujourdhui,
      absentsAujourdhui,
      retardsAujourdhui,
      anomaliesEnAttente,
    });
  } catch (error) {
    logger.error('[RH/Pointage] Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/v1/rh/pointage/history
 * Historique des pointages de l'employé connecté
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate, limit = 50 } = req.query;

    const employee = await prisma.employee.findFirst({
      where: { userId: req.user.id, companyId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const where = {
      employeeId: employee.id,
      companyId,
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const pointages = await prisma.pointage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(pointages);
  } catch (error) {
    logger.error('[RH/Pointage] Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch pointage history' });
  }
});

/**
 * GET /api/v1/rh/pointage
 * Liste tous les pointages (admin/RH)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { employeeId, storeId, startDate, endDate, status, isAnomaly } = req.query;

    const where = { companyId };

    if (employeeId) where.employeeId = parseInt(employeeId);
    if (storeId) where.storeId = parseInt(storeId);
    if (status) where.status = status;
    if (isAnomaly !== undefined) where.isAnomaly = isAnomaly === 'true';

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const pointages = await prisma.pointage.findMany({
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
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json(pointages);
  } catch (error) {
    logger.error('[RH/Pointage] Error fetching pointages:', error);
    res.status(500).json({ error: 'Failed to fetch pointages' });
  }
});

module.exports = router;
