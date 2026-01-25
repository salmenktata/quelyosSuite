/**
 * Tests de sécurité pour la gestion des fournisseurs
 * Vérifie l'isolation complète des données par companyId
 */

const request = require("supertest");
const { PrismaClient } = require("@prisma/client");

process.env.NODE_ENV = "test";
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  throw new Error("TEST_DATABASE_URL ou DATABASE_URL doit être défini");
}

if (/prod|production|api\.quelyos\.com/i.test(TEST_DB_URL)) {
  throw new Error("Refus de lancer les tests sur une base de production");
}

process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../server");
const prisma = new PrismaClient();

const truncateAll = async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "SupplierPayment","SupplierInvoice","Supplier","PaymentScenario","Transaction","Account","CompanySettings","User","Company" RESTART IDENTITY CASCADE;'
  );
};

// Helper: Créer une entreprise + utilisateur
const createCompanyAndUser = async (name, email) => {
  const res = await request(app).post("/auth/register").send({
    companyName: name,
    email: email,
    password: "Test#2025!",
  });
  expect([200, 201]).toContain(res.status);
  return {
    token: res.body.token,
    companyId: res.body.company?.id,
    userId: res.body.userId,
  };
};

// Helper: Créer un compte
const createAccount = async (token, balance = 50000) => {
  const res = await request(app)
    .post("/accounts")
    .set({ Authorization: `Bearer ${token}` })
    .send({ name: "Compte Test", balance, status: "ACTIVE" });
  expect([200, 201]).toContain(res.status);
  return res.body.id;
};

// Helper: Créer un fournisseur
const createSupplier = async (token, data = {}) => {
  const res = await request(app)
    .post("/api/v1/finance/suppliers")
    .set({ Authorization: `Bearer ${token}` })
    .send({
      name: data.name || "Fournisseur Test",
      importance: data.importance || "NORMAL",
      latePaymentPenalty: data.latePaymentPenalty || 0,
      earlyPaymentDiscount: data.earlyPaymentDiscount || 0,
      ...data,
    });
  expect([200, 201]).toContain(res.status);
  return res.body;
};

// Helper: Créer une facture
const createSupplierInvoice = async (token, supplierId, data = {}) => {
  const res = await request(app)
    .post("/api/v1/finance/supplier-invoices")
    .set({ Authorization: `Bearer ${token}` })
    .send({
      supplierId,
      invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
      amount: data.amount || 1000,
      invoiceDate: data.invoiceDate || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: data.status || "PENDING",
      paymentDelay: 30,
      ...data,
    });
  expect([200, 201]).toContain(res.status);
  return res.body;
};

describe("Supplier Security Tests - Company Isolation", () => {
  let company1, company2;
  let supplier1, supplier2;
  let invoice1, invoice2;
  let account1, account2;

  beforeAll(async () => {
    await truncateAll();

    // Créer deux entreprises distinctes
    company1 = await createCompanyAndUser("Company1", "test1+supplier@quelyos.com");
    company2 = await createCompanyAndUser("Company2", "test2+supplier@quelyos.com");

    // Créer des comptes
    account1 = await createAccount(company1.token, 100000);
    account2 = await createAccount(company2.token, 100000);

    // Créer des fournisseurs pour chaque entreprise
    supplier1 = await createSupplier(company1.token, {
      name: "Fournisseur Company 1",
      importance: "HIGH",
      latePaymentPenalty: 5,
    });

    supplier2 = await createSupplier(company2.token, {
      name: "Fournisseur Company 2",
      importance: "CRITICAL",
      earlyPaymentDiscount: 2,
    });

    // Créer des factures
    invoice1 = await createSupplierInvoice(company1.token, supplier1.id, {
      invoiceNumber: "C1-INV-001",
      amount: 5000,
    });

    invoice2 = await createSupplierInvoice(company2.token, supplier2.id, {
      invoiceNumber: "C2-INV-001",
      amount: 3000,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ========================================
  // TESTS GET /api/v1/finance/suppliers
  // ========================================

  describe("GET /api/v1/finance/suppliers", () => {
    test("Company1 ne voit que ses propres fournisseurs", async () => {
      const res = await request(app)
        .get("/api/v1/finance/suppliers")
        .set({ Authorization: `Bearer ${company1.token}` });

      expect(res.status).toBe(200);
      expect(res.body.suppliers).toBeDefined();
      expect(res.body.suppliers.length).toBeGreaterThanOrEqual(1);

      // Vérifier que tous les fournisseurs appartiennent à Company1
      res.body.suppliers.forEach((supplier) => {
        expect(supplier.companyId).toBe(company1.companyId);
      });

      // Vérifier que supplier2 n'est PAS visible
      const hasSupplier2 = res.body.suppliers.some((s) => s.id === supplier2.id);
      expect(hasSupplier2).toBe(false);
    });

    test("Company2 ne voit que ses propres fournisseurs", async () => {
      const res = await request(app)
        .get("/api/v1/finance/suppliers")
        .set({ Authorization: `Bearer ${company2.token}` });

      expect(res.status).toBe(200);
      expect(res.body.suppliers.length).toBeGreaterThanOrEqual(1);

      res.body.suppliers.forEach((supplier) => {
        expect(supplier.companyId).toBe(company2.companyId);
      });

      const hasSupplier1 = res.body.suppliers.some((s) => s.id === supplier1.id);
      expect(hasSupplier1).toBe(false);
    });
  });

  // ========================================
  // TESTS GET /api/v1/finance/suppliers/:id
  // ========================================

  describe("GET /api/v1/finance/suppliers/:id", () => {
    test("Company1 peut accéder à son propre fournisseur", async () => {
      const res = await request(app)
        .get(`/api/v1/finance/suppliers/${supplier1.id}`)
        .set({ Authorization: `Bearer ${company1.token}` });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(supplier1.id);
      expect(res.body.companyId).toBe(company1.companyId);
    });

    test("Company1 NE PEUT PAS accéder au fournisseur de Company2", async () => {
      const res = await request(app)
        .get(`/api/v1/finance/suppliers/${supplier2.id}`)
        .set({ Authorization: `Bearer ${company1.token}` });

      expect([403, 404]).toContain(res.status);
    });

    test("Company2 NE PEUT PAS accéder au fournisseur de Company1", async () => {
      const res = await request(app)
        .get(`/api/v1/finance/suppliers/${supplier1.id}`)
        .set({ Authorization: `Bearer ${company2.token}` });

      expect([403, 404]).toContain(res.status);
    });
  });

  // ========================================
  // TESTS PUT /api/v1/finance/suppliers/:id
  // ========================================

  describe("PUT /api/v1/finance/suppliers/:id", () => {
    test("Company1 peut modifier son propre fournisseur", async () => {
      const res = await request(app)
        .put(`/api/v1/finance/suppliers/${supplier1.id}`)
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({ importance: "CRITICAL" });

      expect(res.status).toBe(200);
      expect(res.body.importance).toBe("CRITICAL");
    });

    test("Company1 NE PEUT PAS modifier le fournisseur de Company2", async () => {
      const res = await request(app)
        .put(`/api/v1/finance/suppliers/${supplier2.id}`)
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({ importance: "LOW" });

      expect([403, 404]).toContain(res.status);

      // Vérifier que le fournisseur n'a pas été modifié
      const check = await prisma.supplier.findUnique({
        where: { id: supplier2.id },
      });
      expect(check.importance).toBe("CRITICAL"); // Valeur d'origine
    });
  });

  // ========================================
  // TESTS DELETE /api/v1/finance/suppliers/:id
  // ========================================

  describe("DELETE /api/v1/finance/suppliers/:id", () => {
    test("Company1 NE PEUT PAS supprimer le fournisseur de Company2", async () => {
      const res = await request(app)
        .delete(`/api/v1/finance/suppliers/${supplier2.id}`)
        .set({ Authorization: `Bearer ${company1.token}` });

      expect([403, 404]).toContain(res.status);

      // Vérifier que le fournisseur existe toujours
      const check = await prisma.supplier.findUnique({
        where: { id: supplier2.id },
      });
      expect(check).not.toBeNull();
    });
  });

  // ========================================
  // TESTS GET /api/v1/finance/supplier-invoices
  // ========================================

  describe("GET /api/v1/finance/supplier-invoices", () => {
    test("Company1 ne voit que ses propres factures", async () => {
      const res = await request(app)
        .get("/api/v1/finance/supplier-invoices")
        .set({ Authorization: `Bearer ${company1.token}` });

      expect(res.status).toBe(200);
      expect(res.body.invoices).toBeDefined();

      res.body.invoices.forEach((invoice) => {
        expect(invoice.companyId).toBe(company1.companyId);
      });

      const hasInvoice2 = res.body.invoices.some((inv) => inv.id === invoice2.id);
      expect(hasInvoice2).toBe(false);
    });
  });

  // ========================================
  // TESTS GET /api/v1/finance/supplier-invoices/:id
  // ========================================

  describe("GET /api/v1/finance/supplier-invoices/:id", () => {
    test("Company1 peut accéder à sa propre facture", async () => {
      const res = await request(app)
        .get(`/api/v1/finance/supplier-invoices/${invoice1.id}`)
        .set({ Authorization: `Bearer ${company1.token}` });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(invoice1.id);
    });

    test("Company1 NE PEUT PAS accéder à la facture de Company2", async () => {
      const res = await request(app)
        .get(`/api/v1/finance/supplier-invoices/${invoice2.id}`)
        .set({ Authorization: `Bearer ${company1.token}` });

      expect([403, 404]).toContain(res.status);
    });
  });

  // ========================================
  // TESTS POST /api/v1/finance/payment-planning/optimize
  // ========================================

  describe("POST /api/v1/finance/payment-planning/optimize", () => {
    test("Company1 optimise uniquement ses propres factures", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({ strategy: "BY_DUE_DATE" });

      expect(res.status).toBe(200);
      expect(res.body.plan).toBeDefined();

      // Vérifier que seules les factures de Company1 sont dans le plan
      res.body.plan.forEach((payment) => {
        expect(payment.invoiceId).not.toBe(invoice2.id);
      });
    });

    test("Company1 ne peut pas demander d'optimiser une facture de Company2", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({
          strategy: "BY_DUE_DATE",
          invoiceIds: [invoice2.id], // Facture de Company2
        });

      expect(res.status).toBe(200);
      // Le plan devrait être vide car la facture n'appartient pas à Company1
      expect(res.body.plan.length).toBe(0);
    });
  });

  // ========================================
  // TESTS POST /api/v1/finance/payment-planning/execute-payment
  // ========================================

  describe("POST /api/v1/finance/payment-planning/execute-payment", () => {
    test("Company1 peut exécuter un paiement pour sa propre facture", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/execute-payment")
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({
          invoiceId: invoice1.id,
          accountId: account1,
          paymentDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.payment).toBeDefined();
      expect(res.body.data.transaction).toBeDefined();
    });

    test("Company1 NE PEUT PAS exécuter un paiement pour la facture de Company2", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/execute-payment")
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({
          invoiceId: invoice2.id, // Facture de Company2
          accountId: account1, // Compte de Company1
          paymentDate: new Date().toISOString(),
        });

      expect([403, 404]).toContain(res.status);

      // Vérifier qu'aucune transaction n'a été créée
      const transactions = await prisma.transaction.findMany({
        where: {
          description: { contains: invoice2.invoiceNumber },
        },
      });
      expect(transactions.length).toBe(0);
    });

    test("Company1 NE PEUT PAS utiliser le compte de Company2", async () => {
      // Créer une nouvelle facture pour Company1
      const newInvoice = await createSupplierInvoice(company1.token, supplier1.id, {
        invoiceNumber: `C1-INV-${Date.now()}`,
        amount: 2000,
      });

      const res = await request(app)
        .post("/api/v1/finance/payment-planning/execute-payment")
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({
          invoiceId: newInvoice.id, // Facture de Company1
          accountId: account2, // Compte de Company2 ❌
          paymentDate: new Date().toISOString(),
        });

      expect([403, 404]).toContain(res.status);
    });
  });

  // ========================================
  // TESTS POST /api/v1/finance/payment-planning/scenarios
  // ========================================

  describe("POST /api/v1/finance/payment-planning/scenarios", () => {
    test("Company1 peut créer un scénario avec ses propres factures", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/scenarios")
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({
          name: "Scénario Test Company1",
          strategy: "BY_DUE_DATE",
          invoices: [invoice1.id],
          totalAmount: 5000,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });

    test("Company1 NE PEUT PAS créer un scénario avec des factures de Company2", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/scenarios")
        .set({ Authorization: `Bearer ${company1.token}` })
        .send({
          name: "Scénario Malveillant",
          strategy: "BY_DUE_DATE",
          invoices: [invoice2.id], // Facture de Company2 ❌
          totalAmount: 3000,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      // Le scénario ne devrait pas être créé OU devrait être vide
      if (res.status === 201) {
        // Si le scénario est créé, il ne doit pas contenir la facture de Company2
        const scenario = await prisma.paymentScenario.findUnique({
          where: { id: res.body.id },
          include: { invoices: true },
        });
        expect(scenario.invoices.length).toBe(0);
      } else {
        expect([400, 403]).toContain(res.status);
      }
    });
  });

  // ========================================
  // TESTS GET /api/v1/finance/payment-planning/scenarios
  // ========================================

  describe("GET /api/v1/finance/payment-planning/scenarios", () => {
    test("Company1 ne voit que ses propres scénarios", async () => {
      const res = await request(app)
        .get("/api/v1/finance/payment-planning/scenarios")
        .set({ Authorization: `Bearer ${company1.token}` });

      expect(res.status).toBe(200);
      expect(res.body.scenarios).toBeDefined();

      res.body.scenarios.forEach((scenario) => {
        expect(scenario.companyId).toBe(company1.companyId);
      });
    });
  });

  // ========================================
  // TEST FINAL: Vérification de la base de données
  // ========================================

  describe("Database Integrity Check", () => {
    test("Aucune donnée cross-company dans la base", async () => {
      // Vérifier que supplier1 n'a pas de factures de Company2
      const supplier1Invoices = await prisma.supplierInvoice.findMany({
        where: { supplierId: supplier1.id },
      });
      supplier1Invoices.forEach((invoice) => {
        expect(invoice.companyId).toBe(company1.companyId);
      });

      // Vérifier que supplier2 n'a pas de factures de Company1
      const supplier2Invoices = await prisma.supplierInvoice.findMany({
        where: { supplierId: supplier2.id },
      });
      supplier2Invoices.forEach((invoice) => {
        expect(invoice.companyId).toBe(company2.companyId);
      });
    });
  });
});
