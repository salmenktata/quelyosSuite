const logger = require("../../logger");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");
const PDFDocument = require("pdfkit");
const { stringify } = require("csv-stringify/sync");

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT TRANSACTIONS (CSV/PDF)
// ═══════════════════════════════════════════════════════════════════════════

router.get("/export", auth, async (req, res) => {
  try {
    const { format = "csv", from, to, accountId } = req.query;

    // Build filters
    const where = {
      account: {
        companyId: req.user.companyId
      }
    };

    if (from || to) {
      where.occurredAt = {};
      if (from) where.occurredAt.gte = new Date(from);
      if (to) where.occurredAt.lte = new Date(to);
    }

    if (accountId) {
      where.accountId = parseInt(accountId);
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: { select: { name: true, currency: true } },
        category: { select: { name: true, kind: true } },
        paymentFlow: { select: { name: true, type: true } }
      },
      orderBy: { occurredAt: "desc" }
    });

    if (format === "pdf") {
      return generatePDF(res, transactions, req.user);
    } else {
      return generateCSV(res, transactions);
    }
  } catch (err) {
    logger.error("Export error:", err);
    res.status(500).json({ error: "Erreur lors de l'export" });
  }
});

function generateCSV(res, transactions) {
  const data = transactions.map(tx => ({
    Date: new Date(tx.occurredAt).toLocaleDateString("fr-FR"),
    Description: tx.description || "",
    Type: tx.type === "credit" ? "Revenu" : "Dépense",
    Montant: tx.amount.toFixed(2),
    "Montant HT": tx.amountHT?.toFixed(2) || "",
    "Montant TTC": tx.amountTTC?.toFixed(2) || "",
    "Taux TVA": tx.vatRate ? `${tx.vatRate}%` : "",
    Compte: tx.account?.name || "",
    Devise: tx.account?.currency || "EUR",
    Catégorie: tx.category?.name || "",
    "Type catégorie": tx.category?.kind === "INCOME" ? "Revenu" : "Dépense",
    "Flux paiement": tx.paymentFlow?.name || "",
    Statut: translateStatus(tx.status)
  }));

  const csv = stringify(data, { header: true, delimiter: ";" });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="transactions_${formatDate(new Date())}.csv"`);
  res.send("\uFEFF" + csv); // BOM for Excel compatibility
}

function generatePDF(res, transactions, user) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="transactions_${formatDate(new Date())}.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor("#4F46E5").text("Quelyos Finance", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor("#1F2937").text("Export des transactions", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#6B7280").text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, { align: "center" });
  doc.moveDown(1);

  // Summary
  const totalCredit = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  
  doc.fontSize(12).fillColor("#1F2937");
  doc.text(`Total des revenus : ${formatMoney(totalCredit)} EUR`, { continued: true });
  doc.text(`     Total des dépenses : ${formatMoney(totalDebit)} EUR`);
  doc.text(`Solde : ${formatMoney(totalCredit - totalDebit)} EUR`);
  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  const col1 = 50, col2 = 120, col3 = 280, col4 = 380, col5 = 450;

  doc.fontSize(9).fillColor("#4F46E5");
  doc.text("Date", col1, tableTop);
  doc.text("Description", col2, tableTop);
  doc.text("Catégorie", col3, tableTop);
  doc.text("Type", col4, tableTop);
  doc.text("Montant", col5, tableTop);
  
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke("#E5E7EB");

  // Table rows
  let y = tableTop + 25;
  doc.fillColor("#1F2937");

  for (const tx of transactions.slice(0, 50)) { // Limit to 50 for PDF
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(8);
    doc.text(new Date(tx.occurredAt).toLocaleDateString("fr-FR"), col1, y);
    doc.text((tx.description || "").substring(0, 25), col2, y);
    doc.text((tx.category?.name || "").substring(0, 15), col3, y);
    doc.text(tx.type === "credit" ? "Revenu" : "Dépense", col4, y);
    
    const amountColor = tx.type === "credit" ? "#10B981" : "#EF4444";
    doc.fillColor(amountColor).text(`${tx.type === "credit" ? "+" : "-"}${formatMoney(tx.amount)}`, col5, y);
    doc.fillColor("#1F2937");

    y += 18;
  }

  if (transactions.length > 50) {
    doc.moveDown(2);
    doc.fontSize(9).fillColor("#6B7280").text(`... et ${transactions.length - 50} autres transactions (utilisez l'export CSV pour voir toutes les données)`, { align: "center" });
  }

  // Footer
  doc.fontSize(8).fillColor("#9CA3AF");
  doc.text(`${transactions.length} transaction(s) exportée(s)`, 50, 750, { align: "center" });

  doc.end();
}

function translateStatus(status) {
  const map = {
    PLANNED: "Planifié",
    CONFIRMED: "Confirmé",
    SCHEDULED: "Programmé",
    CANCELED: "Annulé"
  };
  return map[status] || status;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatMoney(amount) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

module.exports = router;
