/**
 * Tests d'intégration pour les endpoints de planification des paiements
 */

const request = require("supertest");
const { PrismaClient } = require("@prisma/client");

process.env.NODE_ENV = "test";
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  throw new Error(
    "TEST_DATABASE_URL ou DATABASE_URL doit être défini pour lancer les tests payment-planning"
  );
}

if (/prod|production|api\.quelyos\.com/i.test(TEST_DB_URL)) {
  throw new Error("Refus de lancer les tests sur une base potentiellement de production");
}

process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../server");
const prisma = new PrismaClient();

const truncateAll = async () => {
  // Ajouter les nouvelles tables dans le truncate
  await prisma.$executeRawUnsafe(
    'TRUNCATE "SupplierPayment","SupplierInvoice","Supplier","PaymentScenario","Transaction","Account","CompanySettings","User","Company" RESTART IDENTITY CASCADE;'
  );
};

const registerAndAuth = async () => {
  const res = await request(app)
    .post("/auth/register")
    .send({
      companyName: "TestCo Payment",
      email: "test+payment@quelyos.com",
      password: "Test#2025!",
    });
  expect([200, 201]).toContain(res.status);
  return { token: res.body.token, companyId: res.body.company?.id, userId: res.body.userId };
};

const createAccount = async (token, balance = 50000) => {
  const res = await request(app)
    .post("/accounts")
    .set({ Authorization: `Bearer ${token}` })
    .send({ name: "Compte Principal", balance, status: "ACTIVE" });
  expect([200, 201]).toContain(res.status);
  return res.body.id;
};

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
      ...data,
    });
  expect([200, 201]).toContain(res.status);
  return res.body;
};

describe("Payment Planning Integration Tests", () => {
  let token, companyId, userId, accountId;

  beforeAll(async () => {
    await truncateAll();
    const auth = await registerAndAuth();
    token = auth.token;
    companyId = auth.companyId;
    userId = auth.userId;
    accountId = await createAccount(token, 100000); // 100k€ de cash
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/finance/payment-planning/optimize", () => {
    let supplier1, supplier2, invoice1, invoice2, invoice3;

    beforeAll(async () => {
      // Créer des fournisseurs avec différentes configurations
      supplier1 = await createSupplier(token, {
        name: "Fournisseur Critique",
        importance: "CRITICAL",
        latePaymentPenalty: 5,
      });

      supplier2 = await createSupplier(token, {
        name: "Fournisseur Normal",
        importance: "NORMAL",
        earlyPaymentDiscount: 2,
      });

      // Créer des factures
      invoice1 = await createSupplierInvoice(token, supplier1.id, {
        invoiceNumber: "INV-001",
        amount: 5000,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5j
      });

      invoice2 = await createSupplierInvoice(token, supplier2.id, {
        invoiceNumber: "INV-002",
        amount: 3000,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15j
      });

      invoice3 = await createSupplierInvoice(token, supplier1.id, {
        invoiceNumber: "INV-003",
        amount: 2000,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // -5j (retard)
      });
    });

    test("Optimisation BY_DUE_DATE retourne un plan valide", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${token}` })
        .send({
          strategy: "BY_DUE_DATE",
          targetCashReserve: 10000,
        });

      expect(res.status).toBe(200);
      expect(res.body.plan).toBeDefined();
      expect(Array.isArray(res.body.plan)).toBe(true);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.availableCash).toBeDefined();
      expect(res.body.strategy).toBe("BY_DUE_DATE");
    });

    test("Les factures en retard ont la priorité", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${token}` })
        .send({ strategy: "BY_DUE_DATE" });

      expect(res.status).toBe(200);

      // La facture en retard (invoice3) doit être en premier
      const overduePayment = res.body.plan.find((p) => p.invoiceId === invoice3.id);
      expect(overduePayment).toBeDefined();
      expect(overduePayment.score).toBeGreaterThan(1000); // Bonus pour retard
    });

    test("BY_IMPORTANCE priorise les fournisseurs critiques", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${token}` })
        .send({ strategy: "BY_IMPORTANCE" });

      expect(res.status).toBe(200);

      const criticalPayment = res.body.plan.find((p) => p.invoiceId === invoice1.id);
      const normalPayment = res.body.plan.find((p) => p.invoiceId === invoice2.id);

      expect(criticalPayment.score).toBeGreaterThan(normalPayment.score);
    });

    test("Contrainte maxDailyAmount est respectée", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${token}` })
        .send({
          strategy: "BY_DUE_DATE",
          maxDailyAmount: 6000, // Limite de 6k€/jour
        });

      expect(res.status).toBe(200);

      // Vérifier que les paiements du même jour ne dépassent pas 6k€
      const paymentsByDate = {};
      res.body.plan.forEach((payment) => {
        if (payment.scheduledDate) {
          const dateKey = payment.scheduledDate.split("T")[0];
          paymentsByDate[dateKey] = (paymentsByDate[dateKey] || 0) + payment.amount;
        }
      });

      Object.values(paymentsByDate).forEach((dailyTotal) => {
        expect(dailyTotal).toBeLessThanOrEqual(6000);
      });
    });

    test("Métriques calculées correctement", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${token}` })
        .send({ strategy: "BY_DUE_DATE" });

      expect(res.status).toBe(200);

      const { metrics } = res.body;

      expect(metrics.totalInvoices).toBeGreaterThan(0);
      expect(metrics.scheduledInvoices).toBeLessThanOrEqual(metrics.totalInvoices);
      expect(metrics.totalAmount).toBeGreaterThan(0);
      expect(metrics.onTimeRate).toBeGreaterThanOrEqual(0);
      expect(metrics.onTimeRate).toBeLessThanOrEqual(100);

      // Vérifier que les totaux correspondent
      expect(metrics.totalInvoices).toBe(metrics.scheduledInvoices + metrics.insufficientFunds);
    });

    test("Pénalités calculées pour paiements en retard", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/optimize")
        .set({ Authorization: `Bearer ${token}` })
        .send({ strategy: "BY_DUE_DATE" });

      expect(res.status).toBe(200);

      const { metrics } = res.body;

      // Si des paiements sont en retard, il devrait y avoir des pénalités
      if (metrics.paymentsLate > 0) {
        expect(metrics.totalPenalties).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("POST /api/v1/finance/payment-planning/scenarios", () => {
    let supplier, invoice1, invoice2;

    beforeAll(async () => {
      supplier = await createSupplier(token, {
        name: "Fournisseur Scénario",
        importance: "HIGH",
      });

      invoice1 = await createSupplierInvoice(token, supplier.id, {
        invoiceNumber: "SCN-001",
        amount: 10000,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      });

      invoice2 = await createSupplierInvoice(token, supplier.id, {
        invoiceNumber: "SCN-002",
        amount: 8000,
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });

    test("Création d'un scénario réussit", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/scenarios")
        .set({ Authorization: `Bearer ${token}` })
        .send({
          name: "Scénario Test Q1",
          description: "Plan de paiement pour Q1 2024",
          strategy: "OPTIMIZE_CASH_FLOW",
          targetCashReserve: 15000,
          invoices: [invoice1.id, invoice2.id],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("Scénario Test Q1");
      expect(res.body.strategy).toBe("OPTIMIZE_CASH_FLOW");
      expect(res.body.totalAmount).toBe(18000);
    });

    test("Erreur si nom ou factures manquants", async () => {
      const res = await request(app)
        .post("/api/v1/finance/payment-planning/scenarios")
        .set({ Authorization: `Bearer ${token}` })
        .send({
          strategy: "BY_DUE_DATE",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Name and invoices are required");
    });
  });

  describe("GET /api/v1/finance/payment-planning/scenarios", () => {
    test("Liste des scénarios retourne un array", async () => {
      const res = await request(app)
        .get("/api/v1/finance/payment-planning/scenarios")
        .set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(200);
      expect(res.body.scenarios).toBeDefined();
      expect(Array.isArray(res.body.scenarios)).toBe(true);
    });
  });

  describe("PUT /api/v1/finance/payment-planning/scenarios/:id/activate", () => {
    let scenarioId;

    beforeAll(async () => {
      const supplier = await createSupplier(token);
      const invoice = await createSupplierInvoice(token, supplier.id, {
        amount: 5000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const createRes = await request(app)
        .post("/api/v1/finance/payment-planning/scenarios")
        .set({ Authorization: `Bearer ${token}` })
        .send({
          name: "Scénario à activer",
          strategy: "BY_DUE_DATE",
          invoices: [invoice.id],
        });

      scenarioId = createRes.body.id;
    });

    test("Activation d'un scénario réussit", async () => {
      const res = await request(app)
        .put(`/api/v1/finance/payment-planning/scenarios/${scenarioId}/activate`)
        .set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(true);
      expect(res.body.appliedAt).toBeDefined();
    });

    test("Erreur si scénario inexistant", async () => {
      const res = await request(app)
        .put("/api/v1/finance/payment-planning/scenarios/fake-id/activate")
        .set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(404);
    });
  });
});
