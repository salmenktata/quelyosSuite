/**
 * Tests pour /dashboard (synthèse financière)
 * T22.4 - Tests Jest coverage
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
    'TRUNCATE "Transaction","Account","Category","Budget","Budgets","User","Company","CompanySettings" RESTART IDENTITY CASCADE;'
  );
};

describe("Dashboard API (/dashboard)", () => {
  let token;
  let accountId;
  let categoryId;

  beforeAll(async () => {
    await truncateAll();

    // Créer user via register
    const registerRes = await request(app)
      .post("/auth/register")
      .send({
        companyName: "DashboardTestCo",
        email: "admin@dashboard-test.com",
        password: "Admin#2025!"
      });
    token = registerRes.body.token;

    // Créer un compte
    const accountRes = await request(app)
      .post("/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Compte Principal" });
    accountId = accountRes.body.id;

    // Créer une catégorie revenu
    const catIncomeRes = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Ventes", kind: "INCOME" });
    categoryId = catIncomeRes.body.id;

    // Créer une catégorie dépense
    await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Fournitures", kind: "EXPENSE" });

    // Créer des transactions
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Revenu confirmé hier
    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountId,
        categoryId,
        amount: 1000,
        type: "credit",
        status: "CONFIRMED",
        description: "Vente client",
        occurredAt: yesterday
      });

    // Dépense confirmée aujourd'hui
    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountId,
        amount: 300,
        type: "debit",
        status: "CONFIRMED",
        description: "Achat fournitures",
        occurredAt: today
      });

    // Transaction planifiée future
    const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountId,
        amount: 500,
        type: "credit",
        status: "PLANNED",
        description: "Paiement prévu",
        scheduledFor: future
      });
  });

  afterAll(async () => {
    await truncateAll();
    await prisma.$disconnect();
  });

  describe("GET /dashboard", () => {
    test("retourne 401 sans authentification", async () => {
      const res = await request(app).get("/dashboard");
      expect(res.status).toBe(401);
    });

    test("retourne la synthèse financière", async () => {
      const res = await request(app)
        .get("/dashboard")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("balance");
      expect(res.body).toHaveProperty("totalCredit");
      expect(res.body).toHaveProperty("totalDebit");
      expect(res.body).toHaveProperty("accounts");
      expect(Array.isArray(res.body.accounts)).toBe(true);
    });

    test("calcule correctement le solde", async () => {
      const res = await request(app)
        .get("/dashboard")
        .set("Authorization", `Bearer ${token}`);

      // 1000 crédit - 300 débit = 700
      expect(res.body.totalCredit).toBe(1000);
      expect(res.body.totalDebit).toBe(300);
      expect(res.body.balance).toBe(700);
    });
  });

  describe("GET /dashboard/forecast", () => {
    test("retourne les prévisions sur 30 jours par défaut", async () => {
      const res = await request(app)
        .get("/dashboard/forecast")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("range");
      expect(res.body).toHaveProperty("days", 30);
      expect(res.body).toHaveProperty("baseBalance");
      expect(res.body).toHaveProperty("projectedBalance");
      expect(res.body).toHaveProperty("futureImpact");
      expect(res.body).toHaveProperty("daily");
      expect(Array.isArray(res.body.daily)).toBe(true);
    });

    test("accepte le paramètre days", async () => {
      const res = await request(app)
        .get("/dashboard/forecast?days=60")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.days).toBe(60);
      expect(res.body.daily.length).toBe(61); // 60 jours + aujourd'hui
    });

    test("limite days à 180 maximum", async () => {
      const res = await request(app)
        .get("/dashboard/forecast?days=365")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.days).toBe(180);
    });

    test("inclut les transactions planifiées dans les prévisions", async () => {
      const res = await request(app)
        .get("/dashboard/forecast?days=30")
        .set("Authorization", `Bearer ${token}`);

      // La transaction planifiée de 500€ devrait impacter le solde projeté
      expect(res.body.projectedBalance).toBeGreaterThan(res.body.baseBalance);
    });

    test("retourne les données par compte", async () => {
      const res = await request(app)
        .get("/dashboard/forecast")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body).toHaveProperty("perAccount");
      expect(Array.isArray(res.body.perAccount)).toBe(true);
      if (res.body.perAccount.length > 0) {
        expect(res.body.perAccount[0]).toHaveProperty("accountId");
        expect(res.body.perAccount[0]).toHaveProperty("accountName");
        expect(res.body.perAccount[0]).toHaveProperty("baseBalance");
      }
    });
  });

  describe("GET /dashboard/actuals", () => {
    test("retourne l'historique sur 30 jours par défaut", async () => {
      const res = await request(app)
        .get("/dashboard/actuals")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("range");
      expect(res.body).toHaveProperty("days", 30);
      expect(res.body).toHaveProperty("baseBalance");
      expect(res.body).toHaveProperty("endBalance");
      expect(res.body).toHaveProperty("totalCredit");
      expect(res.body).toHaveProperty("totalDebit");
      expect(res.body).toHaveProperty("net");
      expect(res.body).toHaveProperty("daily");
    });

    test("accepte le paramètre days", async () => {
      const res = await request(app)
        .get("/dashboard/actuals?days=7")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.days).toBe(7);
    });

    test("retourne les totaux par catégorie", async () => {
      const res = await request(app)
        .get("/dashboard/actuals?days=30")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body).toHaveProperty("categoryTotals");
      expect(res.body.categoryTotals).toHaveProperty("income");
      expect(res.body.categoryTotals).toHaveProperty("expense");
      expect(Array.isArray(res.body.categoryTotals.income)).toBe(true);
    });

    test("retourne les données par compte", async () => {
      const res = await request(app)
        .get("/dashboard/actuals")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body).toHaveProperty("perAccount");
      expect(Array.isArray(res.body.perAccount)).toBe(true);
    });

    test("calcule le net correctement", async () => {
      const res = await request(app)
        .get("/dashboard/actuals?days=30")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.net).toBe(res.body.totalCredit - res.body.totalDebit);
    });
  });
});
