  test(
    "onboarding démo : création user/company démo et seed",
    async () => {
      await truncateAll();
      const demoEmail = "demo+e2e@quelyos.com";
      const res = await request(app)
        .post("/auth/register-demo")
        .send({ email: demoEmail });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.isDemo).toBe(true);

      const token = res.body.token;
      const authHeader = { Authorization: `Bearer ${token}` };

      // Vérifier la présence des données démo
      const accountsRes = await request(app).get("/accounts").set(authHeader);
      expect(accountsRes.status).toBe(200);
      expect(accountsRes.body.some((a) => a.name === "Compte Démo")).toBe(true);

      const categoriesRes = await request(app).get("/categories").set(authHeader);
      expect(categoriesRes.status).toBe(200);
      expect(categoriesRes.body.some((c) => c.name === "Catégorie Démo" && c.kind === "EXPENSE")).toBe(true);

      const txRes = await request(app).get("/transactions").set(authHeader);
      expect(txRes.status).toBe(200);
      expect(txRes.body.some((t) => t.description === "Achat fournitures" || t.description === "Abonnement logiciel" || t.description === "Vente client")).toBe(true);

      const budgetsRes = await request(app).get("/budgets").set(authHeader);
      expect(budgetsRes.status).toBe(200);
      expect(budgetsRes.body.some((b) => b.name === "Budget Démo")).toBe(true);
    },
    20000
  );
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");

process.env.NODE_ENV = "test";
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  throw new Error("TEST_DATABASE_URL ou DATABASE_URL doit être défini pour lancer les tests e2e");
}

if (/prod|production|api\.quelyos\.com/i.test(TEST_DB_URL)) {
  throw new Error("Refus de lancer les tests e2e sur une base potentiellement de production");
}

process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../server");
const prisma = new PrismaClient();

const truncateAll = async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Transaction","Account","Category","Budget","Budgets","User","Company" RESTART IDENTITY CASCADE;'
  );
};

describe("E2E auth + budgets + transactions", () => {
  beforeAll(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await truncateAll();
    await prisma.$disconnect();
  });

  test(
    "inscription, auth et CRUD minimum",
    async () => {
      const registerRes = await request(app)
        .post("/auth/register")
        .send({
          companyName: "TestCo",
          email: "test+e2e@quelyos.com",
          password: "Test#2025!"
        });

      expect(registerRes.status).toBe(200);
      const token = registerRes.body.token;
      expect(token).toBeTruthy();

      const authHeader = { Authorization: `Bearer ${token}` };

      const categoryRes = await request(app)
        .post("/categories")
        .set(authHeader)
        .send({ name: "Ops", kind: "EXPENSE" });
      expect(categoryRes.status).toBe(200);
      expect(categoryRes.body.id).toBeTruthy();

      const accountRes = await request(app)
        .post("/accounts")
        .set(authHeader)
        .send({ name: "Compte E2E" });
      expect(accountRes.status).toBe(200);
      const accountId = accountRes.body.id;
      expect(accountId).toBeTruthy();

      const txRes = await request(app)
        .post("/transactions")
        .set(authHeader)
        .send({ amount: 42.5, type: "credit", accountId });
      expect(txRes.status).toBe(201);
      expect(txRes.body.accountId).toBe(accountId);

      const budgetRes = await request(app)
        .post("/budgets")
        .set(authHeader)
        .send({ name: "Budget Ops" });
      expect(budgetRes.status).toBe(200);
      const budgetId = budgetRes.body.id;
      expect(budgetId).toBeTruthy();

      const budgetsList = await request(app)
        .get("/budgets")
        .set(authHeader);
      expect(budgetsList.status).toBe(200);
      expect(budgetsList.body.some((b) => b.id === budgetId)).toBe(true);

      const txList = await request(app)
        .get("/transactions")
        .set(authHeader);
      expect(txList.status).toBe(200);
      expect(txList.body.some((t) => t.id === txRes.body.id)).toBe(true);
    },
    20000
  );
});
