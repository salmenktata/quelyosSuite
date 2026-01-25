const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

let app;
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-min-32-characters-required";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("production")) {
    throw new Error("❌ DANGER: Cannot run tests against production database!");
  }
  
  app = require("../server");
});

describe("Portfolios API", () => {
  let testCompany;
  let testUser;
  let authToken;

  beforeEach(async () => {
    await prisma.transaction.deleteMany({});
    await prisma.accountPortfolio.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.portfolio.deleteMany({});
    await prisma.companySettings.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});

    testCompany = await prisma.company.create({
      data: { name: "Test Company" }
    });

    testUser = await prisma.user.create({
      data: {
        email: "test@portfolios.com",
        password: "hashed_password",
        companyId: testCompany.id,
        role: "ADMIN"
      }
    });

    authToken = jwt.sign(
      { userId: testUser.id, companyId: testCompany.id, role: "ADMIN" },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({});
    await prisma.accountPortfolio.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.portfolio.deleteMany({});
    await prisma.companySettings.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.$disconnect();
  });

  test("POST /portfolios - créer un portfolio", async () => {
    const response = await request(app)
      .post("/portfolios")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Portfolio Principal",
        status: "ACTIVE"
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Portfolio Principal");
    expect(response.body.status).toBe("ACTIVE");
    expect(response.body.companyId).toBe(testCompany.id);
  });

  test("GET /portfolios - liste tous les portfolios", async () => {
    await prisma.portfolio.createMany({
      data: [
        { name: "Portfolio 1", status: "ACTIVE", companyId: testCompany.id },
        { name: "Portfolio 2", status: "INACTIVE", companyId: testCompany.id }
      ]
    });

    const response = await request(app)
      .get("/portfolios")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  test("PATCH /portfolios/:id - modifier un portfolio", async () => {
    const portfolio = await prisma.portfolio.create({
      data: {
        name: "Portfolio Original",
        status: "ACTIVE",
        companyId: testCompany.id
      }
    });

    const response = await request(app)
      .patch(`/portfolios/${portfolio.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Portfolio Modifié",
        status: "INACTIVE"
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Portfolio Modifié");
    expect(response.body.status).toBe("INACTIVE");
  });

  test("DELETE /portfolios/:id - supprimer un portfolio", async () => {
    const portfolio = await prisma.portfolio.create({
      data: {
        name: "À supprimer",
        status: "ACTIVE",
        companyId: testCompany.id
      }
    });

    const response = await request(app)
      .delete(`/portfolios/${portfolio.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);

    const deleted = await prisma.portfolio.findUnique({
      where: { id: portfolio.id }
    });
    expect(deleted).toBeNull();
  });

  test("GET /portfolios - isolation multi-tenant", async () => {
    const otherCompany = await prisma.company.create({
      data: { name: "Other Company" }
    });

    await prisma.portfolio.create({
      data: {
        name: "Portfolio autre company",
        status: "ACTIVE",
        companyId: otherCompany.id
      }
    });

    const response = await request(app)
      .get("/portfolios")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.every(p => p.companyId === testCompany.id)).toBe(true);
  });

  test("Association compte-portfolio via AccountPortfolio", async () => {
    const portfolio = await prisma.portfolio.create({
      data: {
        name: "Portfolio Test",
        status: "ACTIVE",
        companyId: testCompany.id
      }
    });

    const account = await prisma.account.create({
      data: {
        name: "Compte Test",
        type: "banque",
        companyId: testCompany.id
      }
    });

    // Créer association
    const association = await prisma.accountPortfolio.create({
      data: {
        accountId: account.id,
        portfolioId: portfolio.id
      }
    });

    expect(association).toHaveProperty("id");
    expect(association.accountId).toBe(account.id);
    expect(association.portfolioId).toBe(portfolio.id);

    // Vérifier unicité de l'association
    await expect(
      prisma.accountPortfolio.create({
        data: {
          accountId: account.id,
          portfolioId: portfolio.id
        }
      })
    ).rejects.toThrow();
  });
});
