const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../../../middleware/auth');
const logger = require('../../../../logger');
const { z } = require('zod');
const storageService = require('../../../services/storage.service');

const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  },
});

/**
 * Document Management Routes
 * Upload, download, and manage RH documents with S3/MinIO storage
 */

// Schema validation
const documentMetadataSchema = z.object({
  employeeId: z.number().int().positive(),
  type: z.enum(['CONTRACT', 'PAYSTUB', 'JUSTIFICATION', 'ID_CARD', 'OTHER']),
  visibility: z.enum(['EMPLOYEE', 'RH_ONLY', 'ADMIN_ONLY']),
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
});

/**
 * POST /api/v1/rh/documents/upload
 * Upload un document RH vers S3/MinIO
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Parse et valider les métadonnées
    const metadata = {
      employeeId: parseInt(req.body.employeeId),
      type: req.body.type,
      visibility: req.body.visibility,
      name: req.body.name,
      description: req.body.description,
    };

    const validatedMetadata = documentMetadataSchema.parse(metadata);

    // Vérifier que l'employé appartient à la company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedMetadata.employeeId,
        companyId,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Déterminer le dossier S3 selon le type de document
    const folderMap = {
      CONTRACT: 'contracts',
      PAYSTUB: 'paystubs',
      JUSTIFICATION: 'justifications',
      ID_CARD: 'profiles',
      OTHER: 'documents',
    };

    const folder = folderMap[validatedMetadata.type] || 'documents';

    // Upload vers S3/MinIO avec scan antivirus
    const uploadResult = await storageService.uploadFile({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      companyId,
      folder,
      bucket: 'documents',
      metadata: {
        employeeId: String(validatedMetadata.employeeId),
        type: validatedMetadata.type,
        uploadedBy: String(req.user.id),
      },
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        error: 'Upload failed',
        details: uploadResult.error,
      });
    }

    // Créer l'entrée dans la base de données
    const document = await prisma.document.create({
      data: {
        ...validatedMetadata,
        companyId,
        uploadedById: req.user.id,
        s3Key: uploadResult.key,
        s3Bucket: uploadResult.bucket,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info('[RH/Documents] Document uploaded:', {
      documentId: document.id,
      employeeId: document.employeeId,
      type: document.type,
    });

    res.status(201).json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('[RH/Documents] Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

/**
 * GET /api/v1/rh/documents
 * Liste les documents RH
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { employeeId, type, visibility } = req.query;

    const where = { companyId };

    if (employeeId) where.employeeId = parseInt(employeeId);
    if (type) where.type = type;
    if (visibility) where.visibility = visibility;

    // TODO: Filtrer selon le rôle et les permissions

    const documents = await prisma.document.findMany({
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
        uploadedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    logger.error('[RH/Documents] Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * GET /api/v1/rh/documents/:id
 * Détails d'un document
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const documentId = parseInt(req.params.id);

    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
      include: {
        employee: true,
        uploadedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // TODO: Vérifier les permissions de visibilité

    res.json(document);
  } catch (error) {
    logger.error('[RH/Documents] Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

/**
 * GET /api/v1/rh/documents/:id/download
 * Générer une URL signée pour télécharger un document
 */
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const documentId = parseInt(req.params.id);

    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // TODO: Vérifier les permissions de visibilité

    // Valider l'accès multi-tenant
    if (!storageService.validateFileAccess(document.s3Key, companyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Générer une URL signée avec expiration 1h
    const urlResult = await storageService.getSignedDownloadUrl(
      document.s3Key,
      'documents',
      3600 // 1 hour
    );

    if (!urlResult.success) {
      return res.status(500).json({
        error: 'Failed to generate download URL',
        details: urlResult.error,
      });
    }

    logger.info('[RH/Documents] Download URL generated:', { documentId });

    res.json({
      url: urlResult.url,
      expiresAt: urlResult.expiresAt,
      fileName: document.fileName,
    });
  } catch (error) {
    logger.error('[RH/Documents] Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

/**
 * DELETE /api/v1/rh/documents/:id
 * Supprimer un document
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const documentId = parseInt(req.params.id);

    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // TODO: Vérifier les permissions

    // Supprimer de S3/MinIO
    const deleteResult = await storageService.deleteFile(document.s3Key, 'documents');

    if (!deleteResult.success) {
      logger.warn('[RH/Documents] Failed to delete from S3, continuing with DB delete:', {
        error: deleteResult.error,
      });
    }

    // Supprimer de la base de données
    await prisma.document.delete({
      where: { id: documentId },
    });

    logger.info('[RH/Documents] Document deleted:', { documentId });
    res.json({ success: true });
  } catch (error) {
    logger.error('[RH/Documents] Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
