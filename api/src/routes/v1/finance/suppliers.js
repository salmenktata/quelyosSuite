const express = require("express");
const router = express.Router();
const authenticate = require("../../../middleware/auth");
const prisma = require("@quelyos/database");

// ========================================
// SUPPLIERS CRUD
// ========================================

// GET /api/v1/finance/suppliers - Liste des fournisseurs
router.get("/", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { category, importance, search, page = 1, limit = 50 } = req.query;

    const where = { companyId };

    // Filtres optionnels
    if (category && category !== "all") where.category = category;
    if (importance && importance !== "all") where.importance = importance;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { invoices: true, payments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.supplier.count({ where });

    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// GET /api/v1/finance/suppliers/:id - Détails fournisseur
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        invoices: {
          orderBy: { dueDate: "desc" },
          take: 10,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
        _count: {
          select: { invoices: true, payments: true },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

// POST /api/v1/finance/suppliers - Créer un fournisseur
router.post("/", authenticate, async (req, res) => {
  try {
    const { companyId, id: userId } = req.user;
    const supplierData = req.body;

    // Validation basique
    if (!supplierData.name) {
      return res.status(400).json({ error: "Supplier name is required" });
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...supplierData,
        companyId,
        createdBy: userId,
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

// PUT /api/v1/finance/suppliers/:id - Modifier fournisseur
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le fournisseur appartient à la company
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Retirer les champs non modifiables
    delete updateData.id;
    delete updateData.companyId;
    delete updateData.createdBy;
    delete updateData.createdAt;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    res.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

// DELETE /api/v1/finance/suppliers/:id - Supprimer fournisseur
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    // Vérifier que le fournisseur appartient à la company
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Vérifier qu'il n'y a pas de factures en attente
    const pendingInvoices = await prisma.supplierInvoice.count({
      where: {
        supplierId: id,
        status: { in: ["PENDING", "SCHEDULED"] },
      },
    });

    if (pendingInvoices > 0) {
      return res.status(400).json({
        error: `Cannot delete supplier with ${pendingInvoices} pending invoice(s)`,
      });
    }

    await prisma.supplier.delete({ where: { id } });

    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

// ========================================
// SUPPLIER INVOICES CRUD
// ========================================

// GET /api/v1/finance/supplier-invoices - Liste des factures fournisseurs
router.get("/invoices", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { supplierId, status, page = 1, limit = 50 } = req.query;

    const where = { companyId };

    if (supplierId) where.supplierId = supplierId;
    if (status && status !== "all") where.status = status;

    const invoices = await prisma.supplierInvoice.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            category: true,
            importance: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.supplierInvoice.count({ where });

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier invoices:", error);
    res.status(500).json({ error: "Failed to fetch supplier invoices" });
  }
});

// GET /api/v1/finance/supplier-invoices/upcoming - Factures à venir
router.get("/invoices/upcoming", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { days = 30 } = req.query;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const invoices = await prisma.supplierInvoice.findMany({
      where: {
        companyId,
        status: { in: ["PENDING", "SCHEDULED"] },
        dueDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        supplier: true,
      },
      orderBy: { dueDate: "asc" },
    });

    // Grouper par semaine
    const byWeek = {};
    invoices.forEach((invoice) => {
      const weekStart = new Date(invoice.dueDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!byWeek[weekKey]) {
        byWeek[weekKey] = [];
      }
      byWeek[weekKey].push(invoice);
    });

    res.json({
      invoices,
      byWeek,
      summary: {
        total: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching upcoming invoices:", error);
    res.status(500).json({ error: "Failed to fetch upcoming invoices" });
  }
});

// GET /api/v1/finance/supplier-invoices/overdue - Factures en retard
router.get("/invoices/overdue", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;

    const today = new Date();
    const invoices = await prisma.supplierInvoice.findMany({
      where: {
        companyId,
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { lt: today },
      },
      include: {
        supplier: true,
      },
      orderBy: { dueDate: "asc" },
    });

    // Calculer les pénalités
    const withPenalties = invoices.map((invoice) => {
      const daysOverdue = Math.floor(
        (today - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)
      );
      const penaltyAmount = invoice.supplier.latePaymentPenalty
        ? (invoice.amount * invoice.supplier.latePaymentPenalty * daysOverdue) / 100
        : 0;

      return {
        ...invoice,
        daysOverdue,
        penaltyAmount,
        totalDue: invoice.amount + penaltyAmount,
      };
    });

    res.json({
      invoices: withPenalties,
      summary: {
        total: withPenalties.length,
        totalAmount: withPenalties.reduce((sum, inv) => sum + inv.totalDue, 0),
        totalPenalties: withPenalties.reduce((sum, inv) => sum + inv.penaltyAmount, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching overdue invoices:", error);
    res.status(500).json({ error: "Failed to fetch overdue invoices" });
  }
});

// GET /api/v1/finance/supplier-invoices/:id - Détails facture
router.get("/invoices/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const invoice = await prisma.supplierInvoice.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        supplier: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// POST /api/v1/finance/supplier-invoices - Créer une facture
router.post("/invoices", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const invoiceData = req.body;

    // Validation basique
    if (!invoiceData.supplierId || !invoiceData.invoiceNumber || !invoiceData.amount) {
      return res.status(400).json({
        error: "Supplier, invoice number, and amount are required"
      });
    }

    // Vérifier que le fournisseur appartient à la company
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: invoiceData.supplierId,
        companyId,
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Calculer le payment delay
    const invoiceDate = new Date(invoiceData.invoiceDate || new Date());
    const dueDate = new Date(invoiceData.dueDate);
    const paymentDelay = Math.floor((dueDate - invoiceDate) / (1000 * 60 * 60 * 24));

    const invoice = await prisma.supplierInvoice.create({
      data: {
        ...invoiceData,
        companyId,
        paymentDelay,
      },
      include: {
        supplier: true,
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "An invoice with this number already exists"
      });
    }
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// PUT /api/v1/finance/supplier-invoices/:id - Modifier une facture
router.put("/invoices/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que la facture appartient à la company
    const existing = await prisma.supplierInvoice.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Ne pas permettre de modifier une facture payée
    if (existing.status === "PAID") {
      return res.status(400).json({
        error: "Cannot modify a paid invoice"
      });
    }

    // Retirer les champs non modifiables
    delete updateData.id;
    delete updateData.companyId;
    delete updateData.supplierId;
    delete updateData.createdAt;

    // Recalculer paymentDelay si les dates changent
    if (updateData.invoiceDate || updateData.dueDate) {
      const invoiceDate = new Date(updateData.invoiceDate || existing.invoiceDate);
      const dueDate = new Date(updateData.dueDate || existing.dueDate);
      updateData.paymentDelay = Math.floor((dueDate - invoiceDate) / (1000 * 60 * 60 * 24));
    }

    const invoice = await prisma.supplierInvoice.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
      },
    });

    res.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// DELETE /api/v1/finance/supplier-invoices/:id - Supprimer une facture
router.delete("/invoices/:id", authenticate, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    // Vérifier que la facture appartient à la company
    const existing = await prisma.supplierInvoice.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Ne pas permettre de supprimer une facture payée
    if (existing.status === "PAID") {
      return res.status(400).json({
        error: "Cannot delete a paid invoice"
      });
    }

    await prisma.supplierInvoice.delete({ where: { id } });

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

module.exports = router;
