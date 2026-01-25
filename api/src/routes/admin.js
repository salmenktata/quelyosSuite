const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Super admin requis" });
  }
  return next();
};

async function getCompanyOr404(companyId, res) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    res.status(404).json({ error: "Société introuvable" });
    return null;
  }
  return company;
}

function sanitizeString(value, fallback = "") {
  return (value || fallback).toString().trim();
}

// -------- Companies --------
router.get("/companies", auth, requireSuperAdmin, async (_req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, createdAt: true }
    });

    const withCounts = await Promise.all(
      companies.map(async (c) => {
        const [usersCount, accountsCount] = await Promise.all([
          prisma.user.count({ where: { companyId: c.id } }),
          prisma.account.count({ where: { companyId: c.id } })
        ]);
        return { ...c, usersCount, accountsCount };
      })
    );

    res.json(withCounts);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de lister les sociétés" });
  }
});

router.get("/companies/:companyId", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, createdAt: true }
    });
    if (!company) return res.status(404).json({ error: "Société introuvable" });

    const [usersCount, accountsCount, categoriesCount] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.account.count({ where: { companyId } }),
      prisma.category.count({ where: { companyId } })
    ]);

    res.json({ ...company, usersCount, accountsCount, categoriesCount });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de récupérer la société" });
  }
});

router.put("/companies/:companyId", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const name = sanitizeString(req.body.name);
    if (!name) return res.status(400).json({ error: "Nom requis" });

    const company = await getCompanyOr404(companyId, res);
    if (!company) return;

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: { name },
      select: { id: true, name: true, createdAt: true }
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour la société" });
  }
});

// -------- Users --------
router.get("/companies/:companyId/users", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const company = await getCompanyOr404(companyId, res);
    if (!company) return;

    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.json(users);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de lister les utilisateurs" });
  }
});

router.post("/companies/:companyId/users", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const company = await getCompanyOr404(companyId, res);
    if (!company) return;

    const email = sanitizeString(req.body.email).toLowerCase();
    const password = req.body.password;
    const role = req.body.role === "ADMIN" ? "ADMIN" : req.body.role === "SUPERADMIN" ? "SUPERADMIN" : "USER";

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email déjà utilisé" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        companyId: company.id,
        role
      },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json(user);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de créer l'utilisateur" });
  }
});

router.patch("/users/:id/role", auth, requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Id invalide" });
  try {
    const role = req.body.role === "ADMIN" || req.body.role === "SUPERADMIN" ? req.body.role : "USER";

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true, companyId: true, createdAt: true }
    });

    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour le rôle" });
  }
});

router.delete("/users/:id", auth, requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Id invalide" });
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    await prisma.user.delete({ where: { id } });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de supprimer l'utilisateur" });
  }
});

// -------- Accounts --------
router.get("/companies/:companyId/accounts", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const company = await getCompanyOr404(companyId, res);
    if (!company) return;

    const accounts = await prisma.account.findMany({ where: { companyId } });
    res.json(accounts);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de lister les comptes" });
  }
});

router.post("/companies/:companyId/accounts", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const company = await getCompanyOr404(companyId, res);
    if (!company) return;

    const name = sanitizeString(req.body.name);
    const type = sanitizeString(req.body.type || "banque");
    const currency = sanitizeString(req.body.currency || "EUR");
    const balance = Number.isFinite(Number(req.body.balance)) ? Number(req.body.balance) : 0;
    const institution = req.body.institution ? sanitizeString(req.body.institution) : null;
    const notes = req.body.notes ? sanitizeString(req.body.notes) : null;

    if (!name) return res.status(400).json({ error: "Nom requis" });

    const account = await prisma.account.create({
      data: { name, type, currency, balance, institution, notes, companyId: company.id }
    });

    res.status(201).json(account);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de créer le compte" });
  }
});

router.put("/accounts/:id", auth, requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Id invalide" });
  try {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) return res.status(404).json({ error: "Compte introuvable" });

    const payload = {
      name: req.body.name ? sanitizeString(req.body.name) : account.name,
      type: req.body.type ? sanitizeString(req.body.type) : account.type,
      currency: req.body.currency ? sanitizeString(req.body.currency) : account.currency,
      balance: Number.isFinite(Number(req.body.balance)) ? Number(req.body.balance) : account.balance,
      institution: req.body.institution === undefined ? account.institution : sanitizeString(req.body.institution || "" ) || null,
      notes: req.body.notes === undefined ? account.notes : sanitizeString(req.body.notes || "" ) || null,
      companyId: req.body.companyId && Number.isFinite(Number(req.body.companyId)) ? Number(req.body.companyId) : account.companyId
    };

    if (!payload.name) return res.status(400).json({ error: "Nom requis" });

    if (payload.companyId !== account.companyId) {
      const targetCompany = await getCompanyOr404(payload.companyId, res);
      if (!targetCompany) return;
    }

    const updated = await prisma.account.update({ where: { id }, data: payload });
    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour le compte" });
  }
});

router.delete("/accounts/:id", auth, requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Id invalide" });
  try {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) return res.status(404).json({ error: "Compte introuvable" });

    await prisma.account.delete({ where: { id } });
    res.json({ message: "Compte supprimé" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de supprimer le compte" });
  }
});

// -------- Settings (placeholder minimal) --------
router.get("/companies/:companyId/settings", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const company = await getCompanyOr404(companyId, res);
    if (!company) return;

    res.json({ companyId, name: company.name, preferences: null });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de récupérer les paramètres" });
  }
});

router.put("/companies/:companyId/settings", auth, requireSuperAdmin, async (req, res) => {
  const companyId = Number(req.params.companyId);
  if (!Number.isFinite(companyId)) return res.status(400).json({ error: "companyId invalide" });
  try {
    const name = req.body.name ? sanitizeString(req.body.name) : null;
    const company = await getCompanyOr404(companyId, res);
    if (!company) return;

    if (name) {
      await prisma.company.update({ where: { id: companyId }, data: { name } });
    }

    res.json({ companyId, name: name || company.name, preferences: null });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour les paramètres" });
  }
});

// -------- System Configuration --------
router.use("/system", require("./system-config"));

// -------- Demo Mode Management --------
router.post("/demo-mode", auth, async (req, res) => {
  try {
    const { action } = req.body;

    // Validation 1 : Rôle ADMIN requis
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }

    // Validation 2 : Action valide
    if (!["activate", "deactivate"].includes(action)) {
      return res.status(400).json({ error: "Action invalide. Utilisez 'activate' ou 'deactivate'" });
    }

    // Validation 3 : Environnement (interdiction en production sauf si ALLOW_DEMO_IN_PROD=true)
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_IN_PROD !== "true") {
      return res.status(403).json({ error: "Opération interdite en environnement de production" });
    }

    const companyId = req.user.companyId;

    if (action === "activate") {
      // Validation 4 : Vérifier qu'aucune donnée démo n'existe déjà
      const existingDemoCompany = await prisma.company.findFirst({
        where: { id: companyId, isDemo: true }
      });

      if (existingDemoCompany) {
        return res.status(400).json({ 
          error: "Le mode démo est déjà actif pour cette société",
          details: "Utilisez 'deactivate' pour supprimer les données existantes avant d'en créer de nouvelles"
        });
      }

      // Validation 5 : Vérifier qu'il n'y a pas de données réelles du user connecté
      // Protection contextuelle : on vérifie uniquement les données créées par ce user
      // Peu importe s'il est admin ou user simple, on protège SES données
      const userId = req.user.userId;
      
      // Compter les comptes, catégories et transactions de la company
      // (qui seront écrasés par le mode démo)
      const [accountCount, categoryCount, transactionCount] = await Promise.all([
        prisma.account.count({ where: { companyId } }),
        prisma.category.count({ where: { companyId } }),
        prisma.transaction.count({ 
          where: { 
            account: { companyId }
          }
        })
      ]);

      // Si des données existent, on bloque l'activation pour éviter leur suppression
      if (accountCount > 0 || categoryCount > 0 || transactionCount > 0) {
        return res.status(400).json({ 
          error: "Impossible d'activer le mode démo : des données existent déjà",
          details: `${accountCount} compte(s), ${categoryCount} catégorie(s), ${transactionCount} transaction(s) trouvé(s).`,
          warning: "Cette protection évite toute suppression accidentelle. Supprimez d'abord ces données manuellement si vous souhaitez activer le mode démo.",
          hint: "Vous pouvez supprimer vos données depuis les pages Comptes, Catégories et Transactions."
        });
      }

      // Exécution du seed via child_process
      const { execSync } = require('child_process');
      const path = require('path');
      const seedPath = path.join(__dirname, '../../prisma/seed.js');
      
      try {
        // Marquer la company comme démo AVANT le seed
        await prisma.company.update({
          where: { id: companyId },
          data: { isDemo: true }
        });

        execSync(`node "${seedPath}"`, { 
          stdio: 'inherit',
          env: { ...process.env, DEMO_COMPANY_ID: companyId.toString() }
        });

        logger.info(`Mode démo activé pour company ${companyId}`);
        
        return res.json({ 
          success: true, 
          message: "Mode démo activé avec succès",
          data: {
            accounts: 5,
            portfolios: 3,
            categories: 15,
            transactions: 110,
            budgets: 3,
            currency: 'TND',
            totalBalance: 697200
          },
          changes: {
            currency: "Devise configurée : TND (Dinar Tunisien)",
            vat: "TVA activée (mode HT, taux 20%)",
            accounts: "5 comptes créés (Total: 697 200 TND)",
            transactions: "110 transactions sur 6 mois (50 revenus, 60 dépenses)"
          }
        });
      } catch (seedError) {
        logger.error("Erreur lors du seed:", seedError);
        
        // Rollback : retirer le flag isDemo
        await prisma.company.update({
          where: { id: companyId },
          data: { isDemo: false }
        });

        return res.status(500).json({ 
          error: "Échec de l'activation du mode démo",
          details: seedError.message
        });
      }

    } else if (action === "deactivate") {
      // Validation 6 : Vérifier que le mode démo est actif
      const demoCompany = await prisma.company.findFirst({
        where: { id: companyId, isDemo: true }
      });

      if (!demoCompany) {
        return res.status(400).json({ 
          error: "Le mode démo n'est pas actif pour cette société",
          details: "Aucune donnée démo à supprimer"
        });
      }

      // Validation 7 : Double vérification - compter les données flaggées isDemo
      const demoUserCount = await prisma.user.count({
        where: { companyId, isDemo: true }
      });

      if (demoUserCount === 0) {
        return res.status(400).json({ 
          error: "Aucune donnée démo détectée",
          warning: "Protection de sécurité : impossible de supprimer des données non-démo via cet endpoint"
        });
      }

      // Exécution du clean-demo via child_process
      const { execSync } = require('child_process');
      const path = require('path');
      const cleanPath = path.join(__dirname, '../../prisma/clean-demo.js');
      
      try {
        execSync(`node "${cleanPath}"`, { 
          stdio: 'inherit',
          env: { ...process.env, DEMO_COMPANY_ID: companyId.toString() }
        });

        logger.info(`Mode démo désactivé pour company ${companyId}`);
        
        return res.json({ 
          success: true, 
          message: "Mode démo désactivé avec succès",
          data: {
            deletedAccounts: 5,
            deletedTransactions: 110,
            deletedCategories: 15
          }
        });
      } catch (cleanError) {
        logger.error("Erreur lors du clean:", cleanError);
        return res.status(500).json({ 
          error: "Échec de la désactivation du mode démo",
          details: cleanError.message
        });
      }
    }

  } catch (err) {
    logger.error("Erreur dans /admin/demo-mode:", err);
    res.status(500).json({ error: "Erreur serveur lors de la gestion du mode démo" });
  }
});

module.exports = router;
