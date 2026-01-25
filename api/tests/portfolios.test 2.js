const request = require("supertest");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use("/portfolios", require("../src/routes/portfolios"));

describe("Portfolio Routes", () => {
  let authToken;
  let testCompanyId;
  let testAccountId;
  let testPortfolioId;

  beforeAll(async () => {
    // Create test company
    const company = await prisma.company.create({
      data: { name: "Test Portfolio Company" },
    });
    testCompanyId = company.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `portfolio-test-${Date.now()}@test.com`,
        password: "hashedpassword",
        companyId: testCompanyId,
      },
    });

    // Create test account
    const account = await prisma.account.create({
      data: {
        name: "Test Account for Portfolio",
        companyId: testCompanyId,
        balance: 1000,
      },
    });
    testAccountId = account.id;

    // Mock auth middleware
    app.use((req, res, next) => {
      req.user = { id: user.id, companyId: testCompanyId };
      next();
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testPortfolioId) {
      await prisma.portfolio.deleteMany({ where: { id: testPortfolioId } });
    }
    if (testAccountId) {
      await prisma.account.deleteMany({ where: { id: testAccountId } });
    }
    await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
    await prisma.$disconnect();
  });

  test("POST /portfolios - Create portfolio", async () => {
    const res = await request(app)
      .post("/portfolios")
      .send({
        name: "Test Portfolio",
        description: "A test portfolio",
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Portfolio");
    expect(res.body.description).toBe("A test portfolio");
    testPortfolioId = res.body.id;
  });

  test("GET /portfolios - List portfolios", async () => {
    const res = await request(app).get("/portfolios");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("GET /portfolios/:id - Get portfolio by ID", async () => {
    const res = await request(app).get(`/portfolios/${testPortfolioId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testPortfolioId);
    expect(res.body.name).toBe("Test Portfolio");
  });

  test("PATCH /portfolios/:id - Update portfolio", async () => {
    const res = await request(app)
      .patch(`/portfolios/${testPortfolioId}`)
      .send({
        name: "Updated Portfolio",
        description: "Updated description",
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Portfolio");
    expect(res.body.description).toBe("Updated description");
  });

  test("POST /portfolios/:id/accounts/:accountId - Add account to portfolio", async () => {
    const res = await request(app)
      .post(`/portfolios/${testPortfolioId}/accounts/${testAccountId}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account added to portfolio");
  });

  test("DELETE /portfolios/:id/accounts/:accountId - Remove account from portfolio", async () => {
    const res = await request(app)
      .delete(`/portfolios/${testPortfolioId}/accounts/${testAccountId}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account removed from portfolio");
  });

  test("DELETE /portfolios/:id - Delete portfolio", async () => {
    const res = await request(app).delete(`/portfolios/${testPortfolioId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Portfolio deleted");
    testPortfolioId = null;
  });
});
