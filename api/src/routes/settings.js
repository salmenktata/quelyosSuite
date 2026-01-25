const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const {
  getOrCreateVatSettings,
  normalizeSettings,
  DEFAULT_VAT_RATES,
} = require("../utils/vat");

function resolveCompanyId(req) {
  if (req.user?.role === "SUPERADMIN" && req.query.companyId) {
    const cid = Number(req.query.companyId);
    if (Number.isFinite(cid)) return cid;
  }
  return req.user.companyId;
}

function validateRates(rates) {
  if (!Array.isArray(rates)) return DEFAULT_VAT_RATES;
  const safe = rates
    .map((r) => ({
      id: String(r.id || "").trim() || `rate-${Math.random().toString(16).slice(2)}`,
      label: String(r.label || "Taux TVA").trim() || "Taux TVA",
      rate: Number(r.rate),
    }))
    .filter((r) => Number.isFinite(r.rate) && r.rate >= 0 && r.rate <= 1);
  return safe.length > 0 ? safe : DEFAULT_VAT_RATES;
}

router.get("/", auth, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const settings = await getOrCreateVatSettings(companyId);
    res.json(settings);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de charger les paramètres TVA" });
  }
});

router.get("/vat", auth, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const settings = await getOrCreateVatSettings(companyId);
    res.json(settings);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de charger les paramètres TVA" });
  }
});

router.put("/", auth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN")) {
      return res.status(403).json({ error: "Accès restreint aux administrateurs" });
    }

    const companyId = resolveCompanyId(req);
    const vatActive = Boolean(req.body.vatActive);
    const vatMode = req.body.vatMode === "TTC" ? "TTC" : "HT";
    const vatDefaultRate = Number.isFinite(Number(req.body.vatDefaultRate))
      ? Number(req.body.vatDefaultRate)
      : 0;
    const vatRates = validateRates(req.body.vatRates);

    const selectedExists = vatRates.some((r) => r.rate === vatDefaultRate);
    if (vatActive && !selectedExists) {
      return res.status(400).json({ error: "Le taux par défaut doit appartenir à la liste des taux disponibles." });
    }

    const updated = await prisma.companySettings.upsert({
      where: { companyId },
      update: { vatActive, vatMode, vatDefaultRate, vatRates },
      create: { companyId, vatActive, vatMode, vatDefaultRate, vatRates },
    });

    res.json(normalizeSettings(updated));
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour les paramètres TVA" });
  }
});

router.put("/vat", auth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN")) {
      return res.status(403).json({ error: "Accès restreint aux administrateurs" });
    }

    const companyId = resolveCompanyId(req);
    const vatActive = Boolean(req.body.vatActive);
    const vatMode = req.body.vatMode === "TTC" ? "TTC" : "HT";
    const vatDefaultRate = Number.isFinite(Number(req.body.vatDefaultRate))
      ? Number(req.body.vatDefaultRate)
      : 0;
    const vatRates = validateRates(req.body.vatRates);

    const selectedExists = vatRates.some((r) => r.rate === vatDefaultRate);
    if (vatActive && !selectedExists) {
      return res.status(400).json({ error: "Le taux par défaut doit appartenir à la liste des taux disponibles." });
    }

    const updated = await prisma.companySettings.upsert({
      where: { companyId },
      update: { vatActive, vatMode, vatDefaultRate, vatRates },
      create: { companyId, vatActive, vatMode, vatDefaultRate, vatRates },
    });

    res.json(normalizeSettings(updated));
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour les paramètres TVA" });
  }
});

module.exports = router;
