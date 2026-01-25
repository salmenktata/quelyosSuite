const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const requireAuth = require('../middleware/auth');
const { authedLimiter } = require('../middleware/rateLimiters');
const logger = require('../../logger');

// Services
const { scanBuffer } = require('../services/smartImport/virusScanner');
const { detectColumns, validateRequiredFields } = require('../services/smartImport/columnDetector');
const { detectBank } = require('../services/smartImport/bankDetector');
const { transformRow } = require('../services/smartImport/transformers');
const { validateMagicBytes, parseFile } = require('../utils/fileValidation');
const sessionCache = require('../utils/sessionCache');
const { validateRows, validateMappings } = require('../services/smartImport/validator');
const { importTransactions } = require('../services/smartImport/importer');

const router = express.Router();

// Configuration multer pour upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté (CSV/XLSX uniquement)'));
    }
  },
});

/**
 * ENDPOINT 1: Analyse du fichier
 * POST /company/import/smart/analyze
 */
router.post('/analyze', requireAuth, authedLimiter, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const { companyId, id: userId } = req.user;

  try {
    // Validation fichier
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    logger.info(`[SmartImport] Analyzing file: ${req.file.originalname} (${req.file.size} bytes) for company ${companyId}`);

    // 1. Validation magic bytes
    const { valid: magicBytesValid, detectedType } = await validateMagicBytes(
      req.file.buffer,
      req.file.mimetype
    );

    if (!magicBytesValid) {
      return res.status(400).json({
        error: 'Fichier corrompu ou type invalide',
        details: `Type détecté: ${detectedType}`,
      });
    }

    // 2. Scan antivirus
    logger.debug('[SmartImport] Running virus scan...');
    const scanResult = await scanBuffer(req.file.buffer, req.file.originalname);

    if (scanResult.isInfected) {
      logger.warn(`[SmartImport] Virus detected in "${req.file.originalname}":`, scanResult.viruses);
      return res.status(400).json({
        error: 'Fichier potentiellement dangereux détecté',
        details: 'Le fichier a été rejeté pour des raisons de sécurité',
      });
    }

    // 3. Parsing du fichier
    logger.debug('[SmartImport] Parsing file...');
    const { headers, rows } = await parseFile(req.file.buffer, req.file.mimetype);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Le fichier ne contient aucune donnée' });
    }

    if (rows.length > 10000) {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        details: 'Maximum 10 000 lignes par import',
      });
    }

    // 4. Détection de la banque
    logger.debug('[SmartImport] Detecting bank...');
    const bankDetection = detectBank(headers);

    // 5. Détection des colonnes
    logger.debug('[SmartImport] Detecting columns...');
    const columnDetection = detectColumns(headers, rows);

    // Validation des champs requis
    const requiredValidation = validateRequiredFields(columnDetection.mappings);

    // 6. Créer session
    const sessionId = sessionCache.createSession({
      companyId,
      userId,
      filename: req.file.originalname,
      filesize: req.file.size,
      headers,
      rows,
      bankDetection,
      columnDetection,
      uploadedAt: new Date().toISOString(),
    });

    const processingTime = Date.now() - startTime;

    logger.info(`[SmartImport] Analysis complete in ${processingTime}ms, session: ${sessionId}`);

    // 7. Retourner résultats
    res.json({
      success: true,
      sessionId,
      filename: req.file.originalname,
      rowCount: rows.length,
      detectedBank: bankDetection.bank ? {
        id: bankDetection.bank.id,
        name: bankDetection.bank.name,
        confidence: Math.round(bankDetection.confidence * 100),
      } : null,
      detectedColumns: {
        mappings: Object.fromEntries(
          Object.entries(columnDetection.mappings).map(([field, mapping]) => [
            field,
            {
              columnIndex: mapping.columnIndex,
              headerName: mapping.headerName,
              confidence: Math.round(mapping.confidence * 100),
            },
          ])
        ),
        overallConfidence: Math.round(columnDetection.overallConfidence * 100),
        requiredFieldsValid: requiredValidation.valid,
        missingFields: requiredValidation.missing,
      },
      preview: rows.slice(0, 5), // 5 premières lignes pour aperçu rapide
      processingTime,
    });

  } catch (err) {
    logger.error('[SmartImport] Analysis error:', err);

    if (err.message.includes('ClamAV') || err.message.includes('sécurité')) {
      return res.status(503).json({
        error: 'Service de sécurité temporairement indisponible',
        details: 'Veuillez réessayer dans quelques instants',
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'analyse du fichier',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/**
 * ENDPOINT 2: Prévisualisation avec transformation
 * GET /company/import/smart/preview/:sessionId
 */
router.get('/preview/:sessionId', requireAuth, authedLimiter, async (req, res) => {
  const { companyId } = req.user;
  const { sessionId } = req.params;

  try {
    // Récupérer session
    const session = sessionCache.getSession(sessionId, companyId);

    if (!session) {
      return res.status(404).json({
        error: 'Session expirée ou invalide',
        details: 'Veuillez réimporter le fichier (sessions expirent après 15 minutes)',
      });
    }

    logger.info(`[SmartImport] Generating preview for session ${sessionId}`);

    // Transformer preview (20 premières lignes)
    const previewCount = Math.min(20, session.rows.length);
    const previewRows = session.rows.slice(0, previewCount).map((row, index) => {
      try {
        return {
          lineNumber: index + 2, // +1 header, +1 index-0
          original: row,
          transformed: transformRow(
            row,
            session.columnDetection.mappings,
            session.bankDetection.bank
          ),
        };
      } catch (err) {
        return {
          lineNumber: index + 2,
          original: row,
          error: err.message,
        };
      }
    });

    res.json({
      success: true,
      sessionId,
      filename: session.filename,
      totalRows: session.rows.length,
      previewRows,
      detectedBank: session.bankDetection.bank ? {
        id: session.bankDetection.bank.id,
        name: session.bankDetection.bank.name,
      } : null,
      detectedColumns: session.columnDetection.mappings,
    });

  } catch (err) {
    logger.error('[SmartImport] Preview error:', err);
    res.status(500).json({
      error: 'Erreur lors de la génération de l\'aperçu',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

/**
 * ENDPOINT 3: Confirmation et import
 * POST /company/import/smart/confirm/:sessionId
 */
router.post('/confirm/:sessionId', requireAuth, authedLimiter, async (req, res) => {
  const startTime = Date.now();
  const { companyId } = req.user;
  const { sessionId } = req.params;

  try {
    // Récupérer session
    const session = sessionCache.getSession(sessionId, companyId);

    if (!session) {
      return res.status(404).json({
        error: 'Session expirée ou invalide',
        details: 'Veuillez réimporter le fichier',
      });
    }

    // Valider body
    const confirmSchema = z.object({
      accountId: z.number().int().positive(),
      columnMappings: z.record(z.object({
        columnIndex: z.number(),
        headerName: z.string(),
      })).optional(),
    });

    const { accountId, columnMappings } = confirmSchema.parse(req.body);

    logger.info(`[SmartImport] Confirming import for session ${sessionId}, ${session.rows.length} rows, account ${accountId}`);

    // Vérifier ownership du compte
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const account = await prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      return res.status(403).json({ error: 'Compte invalide ou non autorisé' });
    }

    // Utiliser mappings custom ou détectés
    const finalMappings = columnMappings || session.columnDetection.mappings;

    // Valider mappings
    const mappingsValidation = validateMappings(finalMappings);
    if (!mappingsValidation.valid) {
      return res.status(400).json({
        error: 'Mappings invalides',
        details: mappingsValidation.errors,
      });
    }

    // Transformer toutes les lignes
    logger.debug('[SmartImport] Transforming rows...');
    const transformedRows = session.rows.map(row =>
      transformRow(row, finalMappings, session.bankDetection.bank)
    );

    // Valider
    logger.debug('[SmartImport] Validating rows...');
    const validationResults = await validateRows(transformedRows, companyId, accountId);

    // Importer lignes valides
    logger.debug(`[SmartImport] Importing ${validationResults.valid.length} valid rows...`);
    const importResults = await importTransactions(validationResults.valid, companyId);

    // Nettoyer session
    sessionCache.deleteSession(sessionId);

    const processingTime = Date.now() - startTime;

    logger.info(`[SmartImport] Import complete in ${processingTime}ms: ${importResults.imported} imported, ${importResults.duplicates} duplicates, ${importResults.failed} failed`);

    res.json({
      success: true,
      imported: importResults.imported,
      duplicates: importResults.duplicates,
      failed: importResults.failed,
      totalRows: session.rows.length,
      errors: [
        ...validationResults.errors,
        ...importResults.errors,
      ],
      processingTime,
    });

  } catch (err) {
    logger.error('[SmartImport] Confirm error:', err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Données invalides',
        details: err.errors,
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'import',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
