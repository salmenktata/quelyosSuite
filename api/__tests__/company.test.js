/**
 * Tests pour /company (profil et settings entreprise)
 * T22.2 - Tests Jest coverage
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

describe("Company API (/company)", () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await truncateAll();

    // Créer un admin via register
    const adminRes = await request(app)
      .post("/auth/register")
      .send({
        companyName: "TestCompany",
        email: "admin@company-test.com",
        password: "Admin#2025!"
      });
    adminToken = adminRes.body.token;

    // Créer un user non-admin
    await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "user@company-test.com",
        password: "User#2025!",
        role: "USER"
      });

    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: "user@company-test.com",
        password: "User#2025!"
      });
    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    await truncateAll();
    await prisma.$disconnect();
  });

  describe("GET /company", () => {
    test("retourne 401 sans authentification", async () => {
      const res = await request(app).get("/company");
      expect(res.status).toBe(401);
    });

    test("retourne le profil de l'entreprise avec stats", async () => {
      const res = await request(app)
        .get("/company")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("name", "TestCompany");
      expect(res.body).toHaveProperty("usersCount");
      expect(res.body).toHaveProperty("accountsCount");
      expect(res.body).toHaveProperty("categoriesCount");
      expect(res.body.usersCount).toBeGreaterThanOrEqual(1);
    });

    test("utilisateur non-admin peut voir le profil", async () => {
      const res = await request(app)
        .get("/company")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("TestCompany");
    });
  });

  describe("PUT /company", () => {
    test("admin peut renommer l'entreprise", async () => {
      const res = await request(app)
        .put("/company")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "RenamedCompany" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("RenamedCompany");
    });

    test("retourne 400 si nom manquant", async () => {
      const res = await request(app)
        .put("/company")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/missing name/i);
    });

    test("retourne 400 si nom vide (espaces)", async () => {
      const res = await request(app)
        .put("/company")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "   " });

      expect(res.status).toBe(400);
    });

    test("utilisateur non-admin reçoit 403", async () => {
      const res = await request(app)
        .put("/company")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "HackedName" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /company/settings", () => {
    test("retourne les settings de l'entreprise", async () => {
      const res = await request(app)
        .get("/company/settings")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("name");
      expect(res.body).toHaveProperty("vatActive");
      expect(res.body).toHaveProperty("vatMode");
      expect(res.body).toHaveProperty("vatDefaultRate");
    });

    test("retourne isDemo pour compte démo", async () => {
      // Créer un compte démo
      const demoRes = await request(app)
        .post("/auth/register-demo")
        .send({ email: "demo@company-test.com" });

      const settingsRes = await request(app)
        .get("/company/settings")
        .set("Authorization", `Bearer ${demoRes.body.token}`);

      expect(settingsRes.status).toBe(200);
      expect(settingsRes.body.isDemo).toBe(true);
    });

    test("utilisateur non-admin peut voir les settings", async () => {
      const res = await request(app)
        .get("/company/settings")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("vatActive");
    });
  });
});
