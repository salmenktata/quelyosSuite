const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');

const prisma = new PrismaClient();

/**
 * Store Management Routes
 * Manage company stores/locations for RH
 */

// Schema validation
const storeSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().positive().optional(), // Rayon de geofencing en mètres
  qrCode: z.string().optional(), // Généré automatiquement si non fourni
});

/**
 * GET /api/v1/rh/stores
 * Liste tous les magasins de l'entreprise
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const stores = await prisma.store.findMany({
      where: { companyId },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { employees: true },
            },
          },
        },
        _count: {
          select: {
            employees: true,
            pointages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(stores);
  } catch (error) {
    logger.error('[RH/Stores] Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

/**
 * GET /api/v1/rh/stores/:id
 * Détails d'un magasin
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const storeId = parseInt(req.params.id);

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        companyId,
      },
      include: {
        teams: {
          include: {
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

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    logger.error('[RH/Stores] Error fetching store:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

/**
 * POST /api/v1/rh/stores
 * Créer un nouveau magasin
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Validation
    const validatedData = storeSchema.parse(req.body);

    // Générer QR code si non fourni
    const qrCode = validatedData.qrCode || `STORE-${companyId}-${Date.now()}`;

    const store = await prisma.store.create({
      data: {
        ...validatedData,
        qrCode,
        companyId,
      },
    });

    logger.info('[RH/Stores] Store created:', { storeId: store.id, name: store.name });
    res.status(201).json(store);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Stores] Error creating store:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

/**
 * PUT /api/v1/rh/stores/:id
 * Mettre à jour un magasin
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const storeId = parseInt(req.params.id);

    // Vérifier l'existence et l'appartenance
    const existingStore = await prisma.store.findFirst({
      where: { id: storeId, companyId },
    });

    if (!existingStore) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Validation
    const validatedData = storeSchema.partial().parse(req.body);

    const store = await prisma.store.update({
      where: { id: storeId },
      data: validatedData,
    });

    logger.info('[RH/Stores] Store updated:', { storeId: store.id });
    res.json(store);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Stores] Error updating store:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

/**
 * DELETE /api/v1/rh/stores/:id
 * Supprimer un magasin
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const storeId = parseInt(req.params.id);

    // Vérifier l'existence et l'appartenance
    const existingStore = await prisma.store.findFirst({
      where: { id: storeId, companyId },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!existingStore) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Empêcher la suppression si des employés sont assignés
    if (existingStore._count.employees > 0) {
      return res.status(400).json({
        error: 'Cannot delete store with assigned employees',
        employeeCount: existingStore._count.employees,
      });
    }

    await prisma.store.delete({
      where: { id: storeId },
    });

    logger.info('[RH/Stores] Store deleted:', { storeId });
    res.json({ success: true });
  } catch (error) {
    logger.error('[RH/Stores] Error deleting store:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

module.exports = router;
