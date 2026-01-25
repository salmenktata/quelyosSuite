const logger = require("../../logger");
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const requireAuth = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté (CSV/XLSX uniquement)'));
    }
  },
});

const transactionSchema = z.object({
  date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Date invalide (format YYYY-MM-DD)',
  }),
  amount: z.preprocess((val) => parseFloat(String(val).replace(',', '.')), z.number()),
  description: z.string().max(255).optional(),
  account: z.string().min(1),
  category: z.string().optional(),
  currency: z.string().length(3).optional(),
  note: z.string().max(500).optional(),
});

function normalizeHeaders(headers) {
  return headers.map((h) => h.trim().toLowerCase());
}

async function parseCSV(buffer) {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // On force la conversion des dates au format YYYY-MM-DD si possible
  return XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });
}

router.post('/company/import/transactions', requireAuth, upload.single('file'), async (req, res) => {
  const { companyId } = req.user;
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

  let rows;
  const errors = [];
  try {
    if (req.file.mimetype === 'text/csv') {
      rows = await parseCSV(req.file.buffer);
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      rows = parseXLSX(req.file.buffer);
    } else {
      return res.status(415).json({ error: 'Type de fichier non supporté.' });
    }
    logger.debug('Résultat parsing:', Array.isArray(rows) ? rows.length : 'non-array', rows);
  } catch (e) {
    logger.error('Erreur parsing:', e);
    return res.status(400).json({ error: 'Erreur de parsing du fichier.', details: e && (e.stack || e.message || e.toString()) });
  }

  // Vérification des en-têtes obligatoires (tolérance sur la casse et les espaces)
  const headers = rows.length > 0 ? Object.keys(rows[0]).map((h) => h.trim().toLowerCase()) : [];
  const requiredHeaders = ['date', 'amount', 'description', 'account'];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return res.status(400).json({ error: `En-tête(s) obligatoire(s) manquante(s) : ${missingHeaders.join(', ')}` });
  }

  let imported = 0;
  let failed = 0;
  let duplicates = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      logger.debug(`Traitement ligne ${i + 2}:`, row);
      // Validation schéma
      const parseResult = transactionSchema.safeParse(row);
      if (!parseResult.success) {
        logger.warn(`Validation échouée ligne ${i + 2}:`, parseResult.error.errors.map((e) => e.message));
        failed++;
        errors.push({ line: i + 2, message: parseResult.error.errors.map((e) => e.message).join(', ') });
        continue;
      }
      const tx = parseResult.data;
      // Vérif compte
      const account = await prisma.account.findFirst({ where: { name: tx.account, companyId } });
      if (!account) {
        logger.warn(`Compte inconnu ligne ${i + 2}:`, tx.account);
        failed++;
        errors.push({ line: i + 2, message: 'Compte inconnu' });
        continue;
      }
      // Vérif catégorie si présente
      if (tx.category) {
        const category = await prisma.category.findFirst({ where: { name: tx.category, companyId } });
        if (!category) {
          logger.warn(`Catégorie inconnue ligne ${i + 2}:`, tx.category);
          failed++;
          errors.push({ line: i + 2, message: 'Catégorie inconnue' });
          continue;
        }
      }
      // Vérif devise si présente
      if (tx.currency && !/^[A-Z]{3}$/.test(tx.currency)) {
        logger.warn(`Devise invalide ligne ${i + 2}:`, tx.currency);
        failed++;
        errors.push({ line: i + 2, message: 'Devise invalide' });
        continue;
      }
      // Déduplication
      const duplicate = await prisma.transaction.findFirst({
        where: {
          accountId: account.id,
          occurredAt: new Date(tx.date),
          amount: tx.amount,
          description: tx.description,
          currency: tx.currency || 'EUR',
        },
      });
      if (duplicate) {
        logger.info(`Doublon détecté ligne ${i + 2}`);
        duplicates++;
        errors.push({ line: i + 2, message: 'Doublon détecté' });
        continue;
      }
      try {
        await prisma.transaction.create({
          data: {
            accountId: account.id,
            occurredAt: new Date(tx.date),
            amount: tx.amount,
            description: tx.description || '',
            categoryId: tx.category
              ? (await prisma.category.findFirst({ where: { name: tx.category, companyId } }))?.id
              : undefined,
            currency: tx.currency || 'EUR',
            note: tx.note || '',
            type: 'debit', // valeur par défaut pour l'import, à adapter selon la logique métier
          },
        });
        imported++;
      } catch (err) {
        logger.error('Erreur Prisma ligne', i + 2, err.message, tx);
        failed++;
        errors.push({ line: i + 2, message: 'Erreur Prisma: ' + err.message });
        continue;
      }
    }
    logger.info('Erreurs import:', errors);

  res.json({ imported, failed, errors, duplicates });
});

module.exports = router;
