const express = require("express");
const router = express.Router();
const authenticate = require("../../../middleware/auth");
const prisma = require("@quelyos/database");
const prophetClient = require("../../../services/forecasting/ProphetClient");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// ========================================
// PAYMENT PLANNING & OPTIMIZATION
// ========================================

// POST /api/v1/finance/payment-planning/optimize
router.post("/optimize", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      strategy = "BY_DUE_DATE",
      maxDailyAmount,
      targetCashReserve = 10000,
      invoiceIds, // Liste des factures à inclure (optionnel, toutes par défaut)
    } = req.body;

    // 1. Récupérer les factures à payer
    const where = {
      companyId,
      status: { in: ["PENDING", "SCHEDULED"] },
    };

    if (invoiceIds?.length) {
      where.id = { in: invoiceIds };
    }

    const invoices = await prisma.supplierInvoice.findMany({
      where,
      include: { supplier: true },
    });

    if (invoices.length === 0) {
      return res.json({
        plan: [],
        metrics: {
          totalInvoices: 0,
          totalAmount: 0,
          paymentsOnTime: 0,
          paymentsLate: 0,
          onTimeRate: 0,
          averagePaymentDelay: 0,
        },
        message: "Aucune facture à planifier",
      });
    }

    // 2. Récupérer le solde disponible (somme des comptes actifs)
    const accounts = await prisma.account.findMany({
      where: { companyId, status: "ACTIVE" },
      select: { id: true, balance: true },
    });

    const availableCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const accountIds = accounts.map((acc) => acc.id);

    // 3. Récupérer les transactions historiques pour le forecasting ML
    let cashFlowForecast = null;
    try {
      const historicalTxs = await prisma.transaction.findMany({
        where: {
          accountId: { in: accountIds },
          status: "CONFIRMED",
          occurredAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 derniers jours
          },
        },
        select: {
          occurredAt: true,
          type: true,
          amount: true,
        },
        orderBy: { occurredAt: "asc" },
      });

      // Appeler Prophet pour forecast 90 jours (durée max des factures à payer)
      if (historicalTxs.length >= 30) {
        console.log(
          `[Payment Planning] Generating cash flow forecast with ${historicalTxs.length} historical transactions`
        );
        cashFlowForecast = await prophetClient.forecast(historicalTxs, 90);
      } else {
        console.log(
          `[Payment Planning] Insufficient data for ML forecast (${historicalTxs.length} days), using simple projection`
        );
      }
    } catch (error) {
      console.error("[Payment Planning] Prophet forecasting failed, falling back to simple projection:", error.message);
      // Continuer sans forecast ML (mode dégradé)
    }

    // 4. Appliquer l'algorithme de priorisation
    const paymentPlan = optimizePaymentSchedule({
      invoices,
      strategy,
      maxDailyAmount,
      targetCashReserve,
      availableCash,
      cashFlowForecast,
    });

    // 5. Calculer les métriques
    const metrics = calculatePlanMetrics(paymentPlan, invoices);

    res.json({
      plan: paymentPlan,
      metrics,
      availableCash,
      targetCashReserve,
      strategy,
      forecastingUsed: cashFlowForecast ? "prophet" : "simple",
    });
  } catch (error) {
    console.error("Error optimizing payment schedule:", error);
    res.status(500).json({ error: "Failed to optimize payment schedule" });
  }
});

// POST /api/v1/finance/payment-planning/export-excel - Export du plan en Excel
router.post("/export-excel", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { plan, metrics, strategy, availableCash, targetCashReserve } = req.body;

    if (!plan || !metrics) {
      return res.status(400).json({ error: "Plan and metrics are required" });
    }

    // Créer un nouveau classeur Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Quelyos";
    workbook.created = new Date();

    // === Feuille 1: Résumé ===
    const summarySheet = workbook.addWorksheet("Résumé");

    // En-tête
    summarySheet.mergeCells("A1:D1");
    summarySheet.getCell("A1").value = "Plan de Paiement Fournisseurs - Résumé";
    summarySheet.getCell("A1").font = { size: 16, bold: true };
    summarySheet.getCell("A1").alignment = { horizontal: "center" };

    // Informations générales
    summarySheet.addRow([]);
    summarySheet.addRow(["Date de génération:", new Date().toLocaleDateString("fr-FR")]);
    summarySheet.addRow(["Stratégie d'optimisation:", strategy]);
    summarySheet.addRow(["Cash disponible:", `${availableCash.toFixed(2)} €`]);
    summarySheet.addRow(["Réserve cible:", `${targetCashReserve.toFixed(2)} €`]);

    // Métriques
    summarySheet.addRow([]);
    summarySheet.addRow(["MÉTRIQUES CLÉS"]);
    summarySheet.getCell("A8").font = { bold: true };
    summarySheet.addRow(["Total factures:", metrics.totalInvoices]);
    summarySheet.addRow(["Factures planifiées:", metrics.scheduledInvoices]);
    summarySheet.addRow(["Fonds insuffisants:", metrics.insufficientFunds]);
    summarySheet.addRow(["Montant total:", `${metrics.totalAmount.toFixed(2)} €`]);
    summarySheet.addRow(["Pénalités de retard:", `${metrics.totalPenalties.toFixed(2)} €`]);
    summarySheet.addRow(["Remises obtenues:", `${metrics.totalDiscounts.toFixed(2)} €`]);
    summarySheet.addRow(["Coût total:", `${metrics.totalCost.toFixed(2)} €`]);
    summarySheet.addRow(["Économies nettes:", `${metrics.netSavings.toFixed(2)} €`]);
    summarySheet.addRow(["Taux de ponctualité:", `${metrics.onTimeRate.toFixed(1)} %`]);
    summarySheet.addRow(["Délai moyen:", `${metrics.averagePaymentDelay} jours`]);

    // Largeur des colonnes
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 20;

    // === Feuille 2: Plan détaillé ===
    const detailSheet = workbook.addWorksheet("Plan de paiement");

    // En-têtes
    detailSheet.columns = [
      { header: "Fournisseur", key: "supplier", width: 25 },
      { header: "N° Facture", key: "invoiceNumber", width: 15 },
      { header: "Montant", key: "amount", width: 12 },
      { header: "Échéance", key: "dueDate", width: 12 },
      { header: "Date planifiée", key: "scheduledDate", width: 12 },
      { header: "Jours retard/avance", key: "days", width: 15 },
      { header: "Pénalité", key: "penalty", width: 12 },
      { header: "Remise", key: "discount", width: 12 },
      { header: "Coût total", key: "totalCost", width: 12 },
      { header: "Score", key: "score", width: 10 },
      { header: "Statut", key: "status", width: 20 },
      { header: "Raison", key: "reason", width: 40 },
    ];

    // Style de l'en-tête
    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Données
    plan.forEach((payment) => {
      const dueDate = new Date(payment.dueDate);
      const scheduledDate = payment.scheduledDate ? new Date(payment.scheduledDate) : null;

      let daysLabel = "";
      if (payment.daysLate > 0) {
        daysLabel = `${payment.daysLate}j retard`;
      } else if (payment.daysEarly > 0) {
        daysLabel = `${payment.daysEarly}j avance`;
      } else if (scheduledDate) {
        daysLabel = "À l'échéance";
      }

      detailSheet.addRow({
        supplier: payment.supplierName,
        invoiceNumber: payment.invoiceNumber,
        amount: `${payment.amount.toFixed(2)} €`,
        dueDate: dueDate.toLocaleDateString("fr-FR"),
        scheduledDate: scheduledDate ? scheduledDate.toLocaleDateString("fr-FR") : "-",
        days: daysLabel,
        penalty: payment.penalty ? `${payment.penalty.toFixed(2)} €` : "0 €",
        discount: payment.discount ? `${payment.discount.toFixed(2)} €` : "0 €",
        totalCost: payment.totalCost ? `${payment.totalCost.toFixed(2)} €` : `${payment.amount.toFixed(2)} €`,
        score: payment.score.toFixed(0),
        status: payment.status === "SCHEDULED" ? "Planifié" : "Fonds insuffisants",
        reason: payment.reason,
      });
    });

    // Alternance de couleurs pour les lignes
    detailSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    });

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Envoyer le fichier
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="plan-paiement-${Date.now()}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ error: "Failed to export to Excel" });
  }
});

// POST /api/v1/finance/payment-planning/export-pdf - Export du plan en PDF
router.post("/export-pdf", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { plan, metrics, strategy, availableCash, targetCashReserve } = req.body;

    if (!plan || !metrics) {
      return res.status(400).json({ error: "Plan and metrics are required" });
    }

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    // Collecter les chunks du PDF
    doc.on("data", (chunk) => chunks.push(chunk));

    // Promesse pour attendre la fin de la génération
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // ===== EN-TÊTE =====
    doc.fontSize(20).font("Helvetica-Bold").text("Plan de Paiement Fournisseurs", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#666666");
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, { align: "center" });
    doc.moveDown(1);

    // ===== STRATÉGIE =====
    doc.fillColor("#000000");
    doc.fontSize(12).font("Helvetica-Bold").text("Stratégie d'optimisation", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    const strategyNames = {
      BY_DUE_DATE: "Par date d'échéance",
      BY_IMPORTANCE: "Par importance fournisseur",
      MINIMIZE_PENALTIES: "Minimiser les pénalités",
      MAXIMIZE_DISCOUNTS: "Maximiser les remises",
      OPTIMIZE_CASH_FLOW: "Optimiser le cash flow",
    };
    doc.text(`• Stratégie : ${strategyNames[strategy] || strategy}`);
    doc.text(`• Trésorerie disponible : ${availableCash?.toFixed(2) || "N/A"} €`);
    doc.text(`• Réserve cible : ${targetCashReserve?.toFixed(2) || "N/A"} €`);
    doc.moveDown(1);

    // ===== MÉTRIQUES PRINCIPALES =====
    doc.fontSize(12).font("Helvetica-Bold").text("Métriques du plan", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    // Colonne 1
    doc.text(`Factures planifiées : ${metrics.scheduledInvoices}/${metrics.totalInvoices}`, 50, doc.y);
    doc.text(`Montant total : ${metrics.totalAmount?.toFixed(2)} €`, 50, doc.y + 15);
    doc.text(`Taux à l'heure : ${metrics.onTimeRate?.toFixed(1)}%`, 50, doc.y + 15);

    // Colonne 2
    const col2X = 300;
    doc.text(`Pénalités de retard : ${metrics.totalPenalties?.toFixed(2)} €`, col2X, doc.y - 30);
    doc.text(`Remises obtenues : ${metrics.totalDiscounts?.toFixed(2)} €`, col2X, doc.y + 15);
    doc.text(`Coût total : ${metrics.totalCost?.toFixed(2)} €`, col2X, doc.y + 15);

    doc.moveDown(2);

    // ===== TABLEAU DES PAIEMENTS =====
    doc.fontSize(12).font("Helvetica-Bold").text("Détail des paiements", { underline: true });
    doc.moveDown(0.5);

    // En-têtes du tableau
    const tableTop = doc.y;
    const tableHeaders = [
      { label: "Fournisseur", x: 50, width: 100 },
      { label: "Facture", x: 155, width: 60 },
      { label: "Montant", x: 220, width: 60 },
      { label: "Échéance", x: 285, width: 70 },
      { label: "Paiement", x: 360, width: 70 },
      { label: "Statut", x: 435, width: 70 },
    ];

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFFFFF");
    doc.rect(50, tableTop, 495, 20).fill("#4A5568");

    tableHeaders.forEach((header) => {
      doc.text(header.label, header.x, tableTop + 5, { width: header.width, align: "left" });
    });

    let currentY = tableTop + 25;
    doc.fillColor("#000000").font("Helvetica");

    // Limiter à 15 paiements pour ne pas surcharger le PDF
    const displayedPayments = plan.slice(0, 15);

    displayedPayments.forEach((payment, index) => {
      // Vérifier si on doit passer à une nouvelle page
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }

      // Alternance de couleurs
      if (index % 2 === 0) {
        doc.rect(50, currentY - 3, 495, 20).fill("#F7FAFC");
      }

      doc.fillColor("#000000");
      const dueDate = new Date(payment.dueDate);
      const scheduledDate = payment.scheduledDate ? new Date(payment.scheduledDate) : null;

      // Tronquer le nom du fournisseur si trop long
      const supplierName = payment.supplierName.length > 18
        ? payment.supplierName.substring(0, 15) + "..."
        : payment.supplierName;

      doc.text(supplierName, 50, currentY, { width: 100 });
      doc.text(payment.invoiceNumber, 155, currentY, { width: 60 });
      doc.text(`${payment.amount.toFixed(0)} €`, 220, currentY, { width: 60 });
      doc.text(dueDate.toLocaleDateString("fr-FR"), 285, currentY, { width: 70 });
      doc.text(
        scheduledDate ? scheduledDate.toLocaleDateString("fr-FR") : "-",
        360,
        currentY,
        { width: 70 }
      );

      // Statut avec couleur
      const statusText = payment.status === "SCHEDULED" ? "Planifié" : "Fonds KO";
      const statusColor = payment.status === "SCHEDULED" ? "#22C55E" : "#EF4444";
      doc.fillColor(statusColor).text(statusText, 435, currentY, { width: 70 });
      doc.fillColor("#000000");

      currentY += 20;
    });

    // Note si plus de 15 paiements
    if (plan.length > 15) {
      doc.moveDown(1);
      doc.fontSize(9).fillColor("#666666");
      doc.text(
        `Note : ${plan.length - 15} paiements supplémentaires non affichés. Consultez l'export Excel pour la liste complète.`,
        { align: "center" }
      );
    }

    // ===== PIED DE PAGE =====
    doc.fontSize(8).fillColor("#999999");
    doc.text(
      "Document généré par Quelyos - Planification des paiements fournisseurs",
      50,
      750,
      { align: "center" }
    );

    // Finaliser le PDF
    doc.end();

    // Attendre la génération complète
    const pdfBuffer = await pdfPromise;

    // Envoyer le fichier
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="plan-paiement-${Date.now()}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({ error: "Failed to export to PDF" });
  }
});

// GET /api/v1/finance/payment-planning/scenarios - Liste des scénarios
router.get("/scenarios", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;

    const scenarios = await prisma.paymentScenario.findMany({
      where: { companyId },
      include: {
        invoices: {
          include: { supplier: true },
        },
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ scenarios });
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    res.status(500).json({ error: "Failed to fetch scenarios" });
  }
});

// POST /api/v1/finance/payment-planning/scenarios - Créer un scénario
router.post("/scenarios", authenticate, async (req, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const scenarioData = req.body;

    // Validation
    if (!scenarioData.name || !scenarioData.invoices || scenarioData.invoices.length === 0) {
      return res.status(400).json({
        error: "Name and invoices are required",
      });
    }

    // Calculer les dates et montants
    const invoices = await prisma.supplierInvoice.findMany({
      where: {
        id: { in: scenarioData.invoices },
        companyId,
      },
    });

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const dueDates = invoices.map((inv) => new Date(inv.dueDate));
    const startDate = new Date(Math.min(...dueDates));
    const endDate = new Date(Math.max(...dueDates));

    const scenario = await prisma.paymentScenario.create({
      data: {
        name: scenarioData.name,
        description: scenarioData.description,
        strategy: scenarioData.strategy || "BY_DUE_DATE",
        maxDailyAmount: scenarioData.maxDailyAmount,
        targetCashReserve: scenarioData.targetCashReserve,
        totalAmount,
        startDate,
        endDate,
        companyId,
        createdBy: userId,
        invoices: {
          connect: scenarioData.invoices.map((id) => ({ id })),
        },
      },
      include: {
        invoices: {
          include: { supplier: true },
        },
      },
    });

    res.status(201).json(scenario);
  } catch (error) {
    console.error("Error creating scenario:", error);
    res.status(500).json({ error: "Failed to create scenario" });
  }
});

// GET /api/v1/finance/payment-planning/scenarios/:id - Détails scénario
router.get("/scenarios/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const scenario = await prisma.paymentScenario.findFirst({
      where: { id, companyId },
      include: {
        invoices: {
          include: { supplier: true },
        },
      },
    });

    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found" });
    }

    res.json(scenario);
  } catch (error) {
    console.error("Error fetching scenario:", error);
    res.status(500).json({ error: "Failed to fetch scenario" });
  }
});

// PUT /api/v1/finance/payment-planning/scenarios/:id/activate - Activer un scénario
router.put("/scenarios/:id/activate", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    // Vérifier que le scénario appartient à la company
    const scenario = await prisma.paymentScenario.findFirst({
      where: { id, companyId },
    });

    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found" });
    }

    // Désactiver tous les autres scénarios
    await prisma.paymentScenario.updateMany({
      where: { companyId, isActive: true },
      data: { isActive: false },
    });

    // Activer ce scénario
    const updated = await prisma.paymentScenario.update({
      where: { id },
      data: {
        isActive: true,
        appliedAt: new Date(),
      },
      include: {
        invoices: {
          include: { supplier: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error activating scenario:", error);
    res.status(500).json({ error: "Failed to activate scenario" });
  }
});

// DELETE /api/v1/finance/payment-planning/scenarios/:id - Supprimer scénario
router.delete("/scenarios/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    // Vérifier que le scénario appartient à la company
    const scenario = await prisma.paymentScenario.findFirst({
      where: { id, companyId },
    });

    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found" });
    }

    await prisma.paymentScenario.delete({ where: { id } });

    res.json({ message: "Scenario deleted successfully" });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    res.status(500).json({ error: "Failed to delete scenario" });
  }
});

// ========================================
// PAYMENT EXECUTION (TRANSACTION INTEGRATION)
// ========================================

/**
 * POST /api/v1/finance/payment-planning/execute-payment
 * Exécute un paiement fournisseur et crée la transaction associée
 */
router.post("/execute-payment", authenticate, async (req, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const {
      invoiceId,
      accountId, // Compte depuis lequel effectuer le paiement
      paymentDate = new Date(),
      paymentMethod = "VIREMENT",
      reference,
    } = req.body;

    // Validation
    if (!invoiceId || !accountId) {
      return res.status(400).json({
        error: "invoiceId and accountId are required",
      });
    }

    // Récupérer la facture avec le fournisseur
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: { supplier: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.companyId !== companyId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (invoice.status === "PAID") {
      return res.status(400).json({ error: "Invoice already paid" });
    }

    // Récupérer le compte
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (account.companyId !== companyId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Vérifier si le compte a suffisamment de fonds
    if (account.balance < invoice.amount) {
      return res.status(400).json({
        error: "Insufficient funds",
        available: account.balance,
        required: invoice.amount,
      });
    }

    // Effectuer le paiement dans une transaction database
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer la transaction (débit du compte)
      const transaction = await tx.transaction.create({
        data: {
          amount: invoice.amount,
          type: "debit",
          accountId: accountId,
          occurredAt: new Date(paymentDate),
          status: "CONFIRMED",
          description: `Paiement fournisseur: ${invoice.supplier.name} - Facture ${invoice.invoiceNumber}`,
          categoryId: null, // Peut être catégorisé plus tard
        },
      });

      // 2. Mettre à jour le solde du compte
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: invoice.amount,
          },
        },
      });

      // 3. Créer le paiement fournisseur lié à la transaction
      const payment = await tx.supplierPayment.create({
        data: {
          companyId: companyId,
          supplierId: invoice.supplierId,
          invoiceId: invoice.id,
          amount: invoice.amount,
          paymentDate: new Date(paymentDate),
          paymentMethod: paymentMethod,
          reference: reference || `PAY-${Date.now()}`,
          transactionId: transaction.id,
          createdBy: userId,
        },
      });

      // 4. Mettre à jour le statut de la facture
      const updatedInvoice = await tx.supplierInvoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(paymentDate),
          paidAmount: invoice.amount,
        },
        include: { supplier: true },
      });

      return {
        transaction,
        payment,
        invoice: updatedInvoice,
      };
    });

    res.status(201).json({
      message: "Payment executed successfully",
      data: {
        payment: result.payment,
        transaction: result.transaction,
        invoice: result.invoice,
      },
    });
  } catch (error) {
    console.error("Error executing payment:", error);
    res.status(500).json({
      error: "Failed to execute payment",
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/finance/payment-planning/execute-batch
 * Exécute plusieurs paiements en batch
 */
router.post("/execute-batch", authenticate, async (req, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const {
      payments, // Array of { invoiceId, accountId, paymentDate?, paymentMethod?, reference? }
    } = req.body;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: "payments array is required" });
    }

    // Valider tous les paiements avant de les exécuter
    const invoiceIds = payments.map((p) => p.invoiceId);
    const invoices = await prisma.supplierInvoice.findMany({
      where: {
        id: { in: invoiceIds },
        companyId: companyId,
      },
      include: { supplier: true },
    });

    if (invoices.length !== payments.length) {
      return res.status(400).json({
        error: "Some invoices not found or do not belong to your company",
      });
    }

    // Exécuter les paiements en série (pour éviter les problèmes de concurrence)
    const results = [];
    const errors = [];

    for (const payment of payments) {
      try {
        const invoice = invoices.find((inv) => inv.id === payment.invoiceId);

        if (invoice.status === "PAID") {
          errors.push({
            invoiceId: payment.invoiceId,
            error: "Invoice already paid",
          });
          continue;
        }

        const account = await prisma.account.findUnique({
          where: { id: payment.accountId },
        });

        if (!account || account.companyId !== companyId) {
          errors.push({
            invoiceId: payment.invoiceId,
            error: "Invalid account",
          });
          continue;
        }

        if (account.balance < invoice.amount) {
          errors.push({
            invoiceId: payment.invoiceId,
            error: "Insufficient funds",
            available: account.balance,
            required: invoice.amount,
          });
          continue;
        }

        // Exécuter le paiement
        const result = await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.create({
            data: {
              amount: invoice.amount,
              type: "debit",
              accountId: payment.accountId,
              occurredAt: new Date(payment.paymentDate || new Date()),
              status: "CONFIRMED",
              description: `Paiement fournisseur: ${invoice.supplier.name} - Facture ${invoice.invoiceNumber}`,
            },
          });

          await tx.account.update({
            where: { id: payment.accountId },
            data: { balance: { decrement: invoice.amount } },
          });

          const supplierPayment = await tx.supplierPayment.create({
            data: {
              companyId: companyId,
              supplierId: invoice.supplierId,
              invoiceId: invoice.id,
              amount: invoice.amount,
              paymentDate: new Date(payment.paymentDate || new Date()),
              paymentMethod: payment.paymentMethod || "VIREMENT",
              reference: payment.reference || `PAY-${Date.now()}`,
              transactionId: transaction.id,
              createdBy: userId,
            },
          });

          await tx.supplierInvoice.update({
            where: { id: invoice.id },
            data: {
              status: "PAID",
              paidAt: new Date(payment.paymentDate || new Date()),
              paidAmount: invoice.amount,
            },
          });

          return { transaction, payment: supplierPayment };
        });

        results.push({
          invoiceId: payment.invoiceId,
          success: true,
          data: result,
        });
      } catch (error) {
        errors.push({
          invoiceId: payment.invoiceId,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Processed ${results.length + errors.length} payments`,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Error executing batch payments:", error);
    res.status(500).json({
      error: "Failed to execute batch payments",
      details: error.message,
    });
  }
});

module.exports = router;

// ========================================
// ALGORITHME D'OPTIMISATION
// ========================================

function optimizePaymentSchedule({
  invoices,
  strategy,
  maxDailyAmount,
  targetCashReserve,
  availableCash,
  cashFlowForecast,
}) {
  // 1. Scorer chaque facture selon la stratégie
  const scoredInvoices = invoices.map((invoice) => ({
    ...invoice,
    score: calculatePriorityScore(invoice, strategy),
  }));

  // 2. Trier par score (plus haut = plus prioritaire)
  scoredInvoices.sort((a, b) => b.score - a.score);

  // 3. Créer un index du forecast par date (si disponible)
  const forecastByDate = {};
  if (cashFlowForecast?.predictions) {
    cashFlowForecast.predictions.forEach((pred) => {
      forecastByDate[pred.ds] = pred.yhat; // Balance prédite
    });
  }

  // 4. Planifier les paiements jour par jour
  const plan = [];
  const dailyAmounts = {};
  let remainingCash = availableCash - targetCashReserve;

  for (const invoice of scoredInvoices) {
    // Vérifier si on a assez de cash actuellement
    if (remainingCash < invoice.amount) {
      plan.push({
        invoiceId: invoice.id,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplier.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        scheduledDate: null,
        score: invoice.score,
        status: "INSUFFICIENT_FUNDS",
        reason: `Fonds insuffisants (disponible: ${remainingCash.toFixed(2)}€, requis: ${invoice.amount}€)`,
      });
      continue;
    }

    // Trouver le meilleur jour de paiement
    const paymentDate = findOptimalPaymentDate({
      invoice,
      dailyAmounts,
      maxDailyAmount,
      remainingCash,
      forecastByDate,
      targetCashReserve,
    });

    if (paymentDate) {
      const dateKey = paymentDate.toISOString().split("T")[0];
      dailyAmounts[dateKey] = (dailyAmounts[dateKey] || 0) + invoice.amount;
      remainingCash -= invoice.amount;

      // Calculer les pénalités/remises
      const penalty = calculateLatePenalty(invoice, paymentDate);
      const discount = calculateEarlyDiscount(invoice, paymentDate);

      plan.push({
        invoiceId: invoice.id,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplier.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        scheduledDate: paymentDate,
        score: invoice.score,
        status: "SCHEDULED",
        reason: getScheduleReason(invoice, paymentDate),
        penalty: penalty.penalty,
        daysLate: penalty.daysLate,
        discount: discount.discount,
        daysEarly: discount.daysEarly,
        totalCost: invoice.amount + penalty.penalty - discount.discount,
      });
    }
  }

  return plan;
}

function calculatePriorityScore(invoice, strategy) {
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

  let score = 0;

  switch (strategy) {
    case "BY_DUE_DATE":
      // Plus proche de l'échéance = plus prioritaire
      score = 1000 - daysUntilDue;
      // Bonus pour les factures déjà en retard
      if (daysUntilDue < 0) {
        score += Math.abs(daysUntilDue) * 10; // Forte pénalité pour retard
      }
      break;

    case "BY_IMPORTANCE":
      // Importance fournisseur
      const importanceScores = {
        CRITICAL: 1000,
        HIGH: 750,
        NORMAL: 500,
        LOW: 250,
      };
      score = importanceScores[invoice.supplier.importance] || 500;
      score -= daysUntilDue; // Secondaire: échéance
      break;

    case "MINIMIZE_PENALTIES":
      // Calculer le coût potentiel de retard
      const penaltyRate = invoice.supplier.latePaymentPenalty || 0;
      if (penaltyRate > 0) {
        // Plus de pénalités = plus prioritaire
        score = penaltyRate * invoice.amount * 10;
      } else {
        // Pas de pénalités, utiliser l'échéance
        score = 500 - daysUntilDue;
      }
      break;

    case "MAXIMIZE_DISCOUNTS":
      // Calculer le gain potentiel de paiement anticipé
      const discountRate = invoice.supplier.earlyPaymentDiscount || 0;
      if (discountRate > 0 && daysUntilDue > 7) {
        // Gain potentiel = taux * montant * jours d'avance
        score = discountRate * invoice.amount * daysUntilDue;
      } else {
        // Pas de discount possible, basse priorité
        score = 100 - daysUntilDue;
      }
      break;

    case "OPTIMIZE_CASH_FLOW":
      // Complexe: équilibre entre tous les facteurs
      const urgencyScore = 1000 - daysUntilDue;
      const importanceScore = {
        CRITICAL: 500,
        HIGH: 300,
        NORMAL: 100,
        LOW: 0,
      }[invoice.supplier.importance] || 100;

      const penaltyScore = (invoice.supplier.latePaymentPenalty || 0) * 10;
      const discountScore = (invoice.supplier.earlyPaymentDiscount || 0) * 5;

      // Pondération: 40% urgence, 30% importance, 20% pénalités, 10% remises
      score =
        urgencyScore * 0.4 +
        importanceScore * 0.3 +
        penaltyScore * 0.2 +
        discountScore * 0.1;
      break;

    default:
      score = 500 - daysUntilDue;
  }

  return Math.max(0, score); // Éviter les scores négatifs
}

function findOptimalPaymentDate({
  invoice,
  dailyAmounts,
  maxDailyAmount,
  remainingCash,
  forecastByDate,
  targetCashReserve,
}) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Minuit aujourd'hui

  const dueDate = new Date(invoice.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

  // Si déjà en retard, payer aujourd'hui si possible
  if (daysUntilDue < 0) {
    return now;
  }

  // Chercher le meilleur jour entre aujourd'hui et la date d'échéance
  for (let date = new Date(now); date <= dueDate; date.setDate(date.getDate() + 1)) {
    const dateKey = date.toISOString().split("T")[0];
    const dailyTotal = dailyAmounts[dateKey] || 0;

    // Vérifier les contraintes de montant journalier
    const wouldExceedDaily = maxDailyAmount && dailyTotal + invoice.amount > maxDailyAmount;

    if (wouldExceedDaily) {
      continue; // Essayer le jour suivant
    }

    // Si on a un forecast ML, vérifier qu'on aura assez de cash ce jour-là
    if (forecastByDate[dateKey] !== undefined) {
      const predictedBalance = forecastByDate[dateKey];
      const balanceAfterPayment = predictedBalance - invoice.amount;

      // Vérifier qu'on ne passe pas sous la réserve cible
      if (balanceAfterPayment < targetCashReserve) {
        console.log(
          `[Payment Planning] Cannot schedule payment on ${dateKey}: predicted balance ${predictedBalance.toFixed(
            2
          )}€ would drop to ${balanceAfterPayment.toFixed(2)}€ (below reserve ${targetCashReserve}€)`
        );
        continue; // Essayer le jour suivant
      }

      // Ce jour convient!
      return new Date(date);
    } else {
      // Pas de forecast ML, utiliser la logique simple
      return new Date(date);
    }
  }

  // Si aucune date trouvée dans les contraintes, utiliser la date d'échéance
  // (quitte à dépasser les contraintes pour respecter l'échéance)
  return dueDate;
}

function getScheduleReason(invoice, paymentDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const scheduledDate = new Date(paymentDate);
  scheduledDate.setHours(0, 0, 0, 0);

  const dueDate = new Date(invoice.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilPayment = Math.floor((scheduledDate - now) / (1000 * 60 * 60 * 24));
  const daysUntilDue = Math.floor((scheduledDate - dueDate) / (1000 * 60 * 60 * 24));

  if (daysUntilDue === 0) {
    return "Paiement à l'échéance";
  } else if (daysUntilDue < 0) {
    const daysEarly = Math.abs(daysUntilDue);
    return `Paiement anticipé (${daysEarly}j avant échéance)`;
  } else {
    return `Paiement reporté (${daysUntilDue}j après échéance)`;
  }
}

/**
 * Calcule les pénalités de retard pour une facture
 * @param {Object} invoice - La facture
 * @param {Date} scheduledDate - Date de paiement planifiée
 * @returns {Object} - { penalty: montant, daysLate: nombre de jours }
 */
function calculateLatePenalty(invoice, scheduledDate) {
  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  const dueDate = new Date(invoice.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const daysLate = Math.max(0, Math.floor((scheduled - dueDate) / (1000 * 60 * 60 * 24)));

  if (daysLate === 0) {
    return { penalty: 0, daysLate: 0 };
  }

  // Calculer la pénalité selon le taux du fournisseur
  const penaltyRate = invoice.supplier?.latePaymentPenalty || 0;

  if (penaltyRate === 0) {
    return { penalty: 0, daysLate };
  }

  // Formule : (montant * taux/100) * jours de retard
  // Le taux est généralement annuel, donc on divise par 365
  const dailyPenaltyRate = penaltyRate / 365;
  const penalty = invoice.amount * (dailyPenaltyRate / 100) * daysLate;

  return {
    penalty: Math.round(penalty * 100) / 100, // Arrondir à 2 décimales
    daysLate,
  };
}

/**
 * Calcule la remise pour paiement anticipé
 * @param {Object} invoice - La facture
 * @param {Date} scheduledDate - Date de paiement planifiée
 * @returns {Object} - { discount: montant, daysEarly: nombre de jours }
 */
function calculateEarlyDiscount(invoice, scheduledDate) {
  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  const dueDate = new Date(invoice.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const daysEarly = Math.max(0, Math.floor((dueDate - scheduled) / (1000 * 60 * 60 * 24)));

  if (daysEarly === 0) {
    return { discount: 0, daysEarly: 0 };
  }

  // Calculer la remise selon le taux du fournisseur
  const discountRate = invoice.supplier?.earlyPaymentDiscount || 0;

  if (discountRate === 0 || daysEarly < 7) {
    // Généralement, la remise ne s'applique que si le paiement est au moins 7 jours en avance
    return { discount: 0, daysEarly };
  }

  // Formule : montant * taux/100
  const discount = invoice.amount * (discountRate / 100);

  return {
    discount: Math.round(discount * 100) / 100, // Arrondir à 2 décimales
    daysEarly,
  };
}

function calculatePlanMetrics(plan, invoices) {
  const scheduled = plan.filter((p) => p.status === "SCHEDULED");
  const totalAmount = scheduled.reduce((sum, p) => sum + p.amount, 0);

  const onTime = scheduled.filter((p) => {
    const scheduled = new Date(p.scheduledDate);
    const due = new Date(p.dueDate);
    return scheduled <= due;
  }).length;

  const late = scheduled.length - onTime;

  // Calculer le délai moyen
  let totalDelay = 0;
  scheduled.forEach((p) => {
    const scheduledDate = new Date(p.scheduledDate);
    const dueDate = new Date(p.dueDate);
    const delay = Math.floor((scheduledDate - dueDate) / (1000 * 60 * 60 * 24));
    totalDelay += delay;
  });

  const averagePaymentDelay = scheduled.length > 0 ? totalDelay / scheduled.length : 0;

  // Calculer les pénalités et remises totales
  const totalPenalties = scheduled.reduce((sum, p) => sum + (p.penalty || 0), 0);
  const totalDiscounts = scheduled.reduce((sum, p) => sum + (p.discount || 0), 0);
  const totalCost = totalAmount + totalPenalties - totalDiscounts;

  return {
    totalInvoices: plan.length,
    scheduledInvoices: scheduled.length,
    insufficientFunds: plan.filter((p) => p.status === "INSUFFICIENT_FUNDS").length,
    totalAmount,
    totalPenalties: Math.round(totalPenalties * 100) / 100,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    netSavings: Math.round((totalDiscounts - totalPenalties) * 100) / 100,
    paymentsOnTime: onTime,
    paymentsLate: late,
    onTimeRate: scheduled.length > 0 ? (onTime / scheduled.length) * 100 : 0,
    averagePaymentDelay: averagePaymentDelay.toFixed(1),
  };
}
