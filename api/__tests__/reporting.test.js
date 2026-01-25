const request = require("supertest");
const { PrismaClient } = require("@prisma/client");

process.env.NODE_ENV = "test";
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  throw new Error("TEST_DATABASE_URL ou DATABASE_URL doit être défini pour lancer les tests reporting");
}

if (/prod|production|api\.quelyos\.com/i.test(TEST_DB_URL)) {
  throw new Error("Refus de lancer les tests sur une base potentiellement de production");
}

process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../server");
const prisma = new PrismaClient();

const truncateAll = async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Transaction","PlanningMonthlyBreakdown","PlanningItem","AccountPortfolio","Account","Portfolio","Category","Budget","Budgets","CompanySettings","User","Company" RESTART IDENTITY CASCADE;'
  );
};

const registerAndAuth = async () => {
  const res = await request(app)
    .post("/auth/register")
    .send({ companyName: "TestCo", email: "test+reporting@quelyos.com", password: "Test#2025!" });
  expect([200, 201]).toContain(res.status);
  return { token: res.body.token, companyId: res.body.company?.id };
};

const createCategory = async (token, name, kind) => {
  const res = await request(app).post("/categories").set({ Authorization: `Bearer ${token}` }).send({ name, kind });
  expect([200, 201]).toContain(res.status);
  return res.body.id;
};

const createAccount = async (token, name) => {
  const res = await request(app).post("/accounts").set({ Authorization: `Bearer ${token}` }).send({ name });
  expect([200, 201]).toContain(res.status);
  return res.body.id;
};

const createTx = async (token, payload) => {
  const res = await request(app).post("/transactions").set({ Authorization: `Bearer ${token}` }).send(payload);
  expect([200, 201]).toContain(res.status);
  return res.body;
};

const isoDaysFromNow = (delta) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  return d.toISOString();
};

describe("Reporting API", () => {
  beforeAll(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await truncateAll();
    await prisma.$disconnect();
  });

  test("/reporting/actuals retourne soldes et totaux par période", async () => {
    await truncateAll();
    const { token } = await registerAndAuth();
    const catIncome = await createCategory(token, "Revenus", "INCOME");
    const catExpense = await createCategory(token, "Charges", "EXPENSE");
    const accountId = await createAccount(token, "Compte courant");

    // Solde d'ouverture : transaction confirmée hors période
    await createTx(token, { amount: 50, type: "debit", accountId, status: "CONFIRMED", occurredAt: isoDaysFromNow(-40), categoryId: catExpense });
    // Flux dans la période
    await createTx(token, { amount: 200, type: "credit", accountId, status: "CONFIRMED", occurredAt: isoDaysFromNow(-5), categoryId: catIncome });
    await createTx(token, { amount: 80, type: "debit", accountId, status: "CONFIRMED", occurredAt: isoDaysFromNow(-3), categoryId: catExpense });

    const res = await request(app)
      .get("/reporting/actuals")
      .set({ Authorization: `Bearer ${token}` })
      .query({ days: 30, groupBy: "day" });

    expect(res.status).toBe(200);
    const body = res.body;
    expect(body.totalCredit).toBeCloseTo(200);
    expect(body.totalDebit).toBeCloseTo(80);
    expect(body.baseBalance).toBeCloseTo(-50);
    expect(body.endBalance).toBeCloseTo(70);
    expect(body.net).toBeCloseTo(120);

    const incomeTop = body.categoryTotals?.income?.[0];
    const expenseTop = body.categoryTotals?.expense?.[0];
    expect(incomeTop.total).toBeCloseTo(200);
    expect(expenseTop.total).toBeCloseTo(80);
  });

  test("/reporting/forecast projette les flux planifiés et le solde", async () => {
    await truncateAll();
    const { token } = await registerAndAuth();
    const catIncome = await createCategory(token, "Revenus", "INCOME");
    const catExpense = await createCategory(token, "Charges", "EXPENSE");
    const accountId = await createAccount(token, "Compte prévisionnel");

    // Base confirmée avant la période
    await createTx(token, { amount: 100, type: "credit", accountId, status: "CONFIRMED", occurredAt: isoDaysFromNow(-1), categoryId: catIncome });

    // Flux planifiés dans l'horizon
    await createTx(token, { amount: 150, type: "credit", accountId, status: "PLANNED", scheduledFor: isoDaysFromNow(1), categoryId: catIncome });
    await createTx(token, { amount: 40, type: "debit", accountId, status: "SCHEDULED", scheduledFor: isoDaysFromNow(2), categoryId: catExpense });

    const res = await request(app)
      .get("/reporting/forecast")
      .set({ Authorization: `Bearer ${token}` })
      .query({ horizonDays: 5, groupBy: "day" });

    expect(res.status).toBe(200);
    const body = res.body;
    expect(body.baseBalance).toBeCloseTo(100);
    expect(body.futureImpact).toBeCloseTo(110); // 150 - 40
    expect(body.projectedBalance).toBeCloseTo(210);
  });

  test("/reporting/combined mixe réel et prévisionnel et expose landingBalance", async () => {
    await truncateAll();
    const { token } = await registerAndAuth();
    const catIncome = await createCategory(token, "Revenus", "INCOME");
    const catExpense = await createCategory(token, "Charges", "EXPENSE");
    const accountId = await createAccount(token, "Compte mixte");

    // Solde courant avant période
    await createTx(token, { amount: 50, type: "credit", accountId, status: "CONFIRMED", occurredAt: isoDaysFromNow(-1), categoryId: catIncome });
    // Réel dans la période
    await createTx(token, { amount: 20, type: "debit", accountId, status: "CONFIRMED", occurredAt: isoDaysFromNow(0), categoryId: catExpense });
    // Prévisionnel dans l'horizon
    await createTx(token, { amount: 80, type: "credit", accountId, status: "PLANNED", scheduledFor: isoDaysFromNow(1), categoryId: catIncome });
    await createTx(token, { amount: 30, type: "debit", accountId, status: "SCHEDULED", scheduledFor: isoDaysFromNow(2), categoryId: catExpense });

    const res = await request(app)
      .get("/reporting/combined")
      .set({ Authorization: `Bearer ${token}` })
      .query({ horizonDays: 5, groupBy: "day" });

    expect(res.status).toBe(200);
    const body = res.body;
    expect(body.currentBalance).toBeCloseTo(50);
    expect(body.futureImpact).toBeCloseTo(50); // 80 - 30
    expect(body.landingBalance).toBeCloseTo(100);
    expect(Array.isArray(body.daily)).toBe(true);
    expect(body.daily.length).toBeGreaterThan(0);
  });
});
