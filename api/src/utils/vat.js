const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_VAT_RATES = [
  { id: "tva-0", label: "TVA 0% / Exonération", rate: 0 },
  { id: "tva-10", label: "TVA 10%", rate: 0.1 },
  { id: "tva-20", label: "TVA 20%", rate: 0.2 },
];

const DEFAULT_SETTINGS = {
  vatActive: false,
  vatMode: "HT",
  vatDefaultRate: 0,
  vatRates: DEFAULT_VAT_RATES,
};

function normalizeSettings(raw) {
  if (!raw) return { ...DEFAULT_SETTINGS };
  return {
    ...raw,
    vatActive: Boolean(raw.vatActive),
    vatMode: raw.vatMode === "TTC" ? "TTC" : "HT",
    vatDefaultRate: Number.isFinite(Number(raw.vatDefaultRate))
      ? Number(raw.vatDefaultRate)
      : 0,
    vatRates: Array.isArray(raw.vatRates) && raw.vatRates.length > 0 ? raw.vatRates : DEFAULT_VAT_RATES,
  };
}

async function getOrCreateVatSettings(companyId) {
  let settings = await prisma.companySettings.findUnique({ where: { companyId } });
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        companyId,
        vatActive: DEFAULT_SETTINGS.vatActive,
        vatMode: DEFAULT_SETTINGS.vatMode,
        vatDefaultRate: DEFAULT_SETTINGS.vatDefaultRate,
        vatRates: DEFAULT_SETTINGS.vatRates,
      },
    });
  }
  return normalizeSettings(settings);
}

function computeAmounts({ inputAmount, settings, providedRate, modeOverride }) {
  const normalized = normalizeSettings(settings);
  const rate = normalized.vatActive
    ? Number.isFinite(Number(providedRate))
      ? Number(providedRate)
      : normalized.vatDefaultRate
    : 0;
  const mode = modeOverride === "TTC" || modeOverride === "HT" ? modeOverride : normalized.vatMode;

  if (!normalized.vatActive) {
    return {
      amount: inputAmount,
      amountHT: inputAmount,
      amountTTC: inputAmount,
      vatRate: 0,
      vatMode: "HT",
    };
  }

  if (mode === "TTC") {
    const amountTTC = inputAmount;
    const amountHT = amountTTC / (1 + rate);
    return { amount: amountTTC, amountHT, amountTTC, vatRate: rate, vatMode: "TTC" };
  }

  const amountHT = inputAmount;
  const amountTTC = amountHT * (1 + rate);
  return { amount: amountHT, amountHT, amountTTC, vatRate: rate, vatMode: "HT" };
}

function toDisplay(tx, settings) {
  const normalized = normalizeSettings(settings);
  const amountHT = Number(tx.amountHT ?? tx.amount ?? 0);
  const amountTTC = Number(tx.amountTTC ?? tx.amount ?? 0);
  const vatRate = Number(tx.vatRate ?? normalized.vatDefaultRate ?? 0);
  const vatModeUsed = tx.vatMode || normalized.vatMode;
  const vatAmount = amountTTC - amountHT;

  return {
    ...tx,
    amount: amountHT,
    amountHT,
    amountTTC,
    vatRate,
    vatAmount,
    vatModeUsed,
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  DEFAULT_VAT_RATES,
  normalizeSettings,
  getOrCreateVatSettings,
  computeAmounts,
  toDisplay,
};
