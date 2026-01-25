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

describe("Accounts API", () => {
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
        email: "test@accounts.com",
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

  test("POST /accounts - créer un compte basique", async () => {
    const response = await request(app)
      .post("/accounts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Compte Principal",
        type: "banque",
        currency: "EUR",
        balance: 1000
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Compte Principal");
    expect(response.body.type).toBe("banque");
    expect(response.body.balance).toBe(1000);
    expect(response.body.companyId).toBe(testCompany.id);
  });

  test("POST /accounts - isShared=true si aucun portfolio associé", async () => {
    const response = await request(app)
      .post("/accounts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Compte Partagé",
        type: "cash"
      });

    expect(response.status).toBe(200);
    expect(response.body.isShared).toBe(true);
  });

  test("POST /accounts - types valides (banque, cash, crypto, autre)", async () => {
    const types = ["banque", "cash", "crypto", "autre"];
    
    for (const type of types) {
      const response = await request(app)
        .post("/accounts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: `Compte ${type}`,
          type
        });

      expect(response.status).toBe(200);
      expect(response.body.type).toBe(type);
    }
  });

  test("POST /accounts - validation currency 3 lettres", async () => {
    const response = await request(app)
      .post("/accounts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Compte USD",
        currency: "USD"
      });

    expect(response.status).toBe(200);
    expect(response.body.currency).toBe("USD");
  });

  test("GET /accounts - liste tous les comptes de la company", async () => {
    await prisma.account.createMany({
      data: [
        { name: "Compte 1", type: "banque", companyId: testCompany.id },
        { name: "Compte 2", type: "cash", companyId: testCompany.id }
      ]
    });

    const response = await request(app)
      .get("/accounts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  test("PUT /accounts/:id - modifier un compte", async () => {
    const account = await prisma.account.create({
      data: {
        name: "Compte Original",
        type: "banque",
        balance: 500,
        companyId: testCompany.id
      }
    });

    const response = await request(app)
      .put(`/accounts/${account.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Compte Modifié",
        balance: 1500
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Compte Modifié");
    expect(response.body.balance).toBe(1500);
  });

  test("DELETE /accounts/:id - supprimer un compte", async () => {
    const account = await prisma.account.create({
      data: {
        name: "À supprimer",
        type: "banque",
        companyId: testCompany.id
      }
    });

    const response = await request(app)
      .delete(`/accounts/${account.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);

    const deleted = await prisma.account.findUnique({
      where: { id: account.id }
    });
    expect(deleted).toBeNull();
  });

  test("GET /accounts - isolation multi-tenant", async () => {
    const otherCompany = await prisma.company.create({
      data: { name: "Other Company" }
    });

    await prisma.account.create({
      data: {
        name: "Compte autre company",
        type: "banque",
        companyId: otherCompany.id
      }
    });

    const response = await request(app)
      .get("/accounts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.every(acc => acc.companyId === testCompany.id)).toBe(true);
  });
});
