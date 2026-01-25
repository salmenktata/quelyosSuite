const express = require('express');
const multer = require('multer');
const { parse: csvParse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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
  amount: z.preprocess((val) => parseFloat(String(val).replace(',', '.')), z.number().nonnegative()),
  description: z.string().min(1).max(255),
  account: z.string().min(1),
  category: z.string().optional(),
  currency: z.string().length(3).optional(),
  note: z.string().max(500).optional(),
});

function normalizeHeaders(headers) {
  return headers.map((h) => h.trim().toLowerCase());
}

function parseCSV(buffer) {
  return csvParse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// Mock d'auth pour le test - companyId dynamique via header X-Test-CompanyId
function mockAuth(req, res, next) {
  const testCompanyId = req.headers['x-test-companyid'];
  req.user = { userId: 1, companyId: testCompanyId ? parseInt(testCompanyId, 10) : 1, role: 'company_admin' };
  next();
}

router.post('/company/import/transactions', mockAuth, upload.single('file'), async (req, res) => {
  const { companyId } = req.user;
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

  let rows;
  try {
    if (req.file.mimetype === 'text/csv') {
      rows = parseCSV(req.file.buffer);
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      rows = parseXLSX(req.file.buffer);
    } else {
      return res.status(415).json({ error: 'Type de fichier non supporté.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Erreur de parsing du fichier.' });
  }

  // Vérification des en-têtes obligatoires
  const headers = rows.length > 0 ? Object.keys(rows[0]).map((h) => h.trim().toLowerCase()) : [];
  const requiredHeaders = ['date', 'amount', 'description', 'account'];
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) {
      return res.status(400).json({ error: `En-tête obligatoire manquante : ${h}` });
    }
  }

  let imported = 0;
  let failed = 0;
  let duplicates = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Validation schéma
    const parseResult = transactionSchema.safeParse(row);
    if (!parseResult.success) {
      const errorMessages = parseResult.error?.issues?.map((e) => e.message) || ['Validation échouée'];
      console.log('Validation échouée ligne', i + 2, row, errorMessages);
      failed++;
      errors.push({ line: i + 2, message: errorMessages.join(', ') });
      continue;
    }
    const tx = parseResult.data;
    // Vérif compte
    const account = await prisma.account.findFirst({ where: { name: tx.account, companyId } });
    if (!account) {
      console.log('Compte inconnu ligne', i + 2, tx.account);
      failed++;
      errors.push({ line: i + 2, message: 'Compte inconnu' });
      continue;
    }
    // Vérif catégorie si présente
    if (tx.category) {
      const category = await prisma.category.findFirst({ where: { name: tx.category, companyId } });
      if (!category) {
        console.log('Catégorie inconnue ligne', i + 2, tx.category);
        failed++;
        errors.push({ line: i + 2, message: 'Catégorie inconnue' });
        continue;
      }
    }
    // Vérif devise si présente
    if (tx.currency && !/^[A-Z]{3}$/.test(tx.currency)) {
      console.log('Devise invalide ligne', i + 2, tx.currency);
      failed++;
      errors.push({ line: i + 2, message: 'Devise invalide' });
      continue;
    }
    // Déduplication
    const duplicate = await prisma.transaction.findFirst({
      where: {
        accountId: account.id,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        currency: tx.currency || 'EUR',
      },
    });
    if (duplicate) {
      console.log('Doublon détecté ligne', i + 2);
      duplicates++;
      errors.push({ line: i + 2, message: 'Doublon détecté' });
      continue;
    }
    // Création transaction
    await prisma.transaction.create({
      data: {
        accountId: account.id,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        categoryId: tx.category
          ? (await prisma.category.findFirst({ where: { name: tx.category, companyId } }))?.id
          : undefined,
        currency: tx.currency || 'EUR',
        note: tx.note || '',
      },
    });
    imported++;
  }

  res.json({ imported, failed, errors, duplicates });
});

module.exports = router;
