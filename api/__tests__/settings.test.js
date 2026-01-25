/**
 * Tests pour /settings (paramètres TVA entreprise)
 * T22.3 - Tests Jest coverage
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

describe("Settings API (/settings)", () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await truncateAll();

    // Créer un admin via register
    const adminRes = await request(app)
      .post("/auth/register")
      .send({
        companyName: "SettingsTestCo",
        email: "admin@settings-test.com",
        password: "Admin#2025!"
      });
    adminToken = adminRes.body.token;

    // Créer un user non-admin
    await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "user@settings-test.com",
        password: "User#2025!",
        role: "USER"
      });

    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: "user@settings-test.com",
        password: "User#2025!"
      });
    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    await truncateAll();
    await prisma.$disconnect();
  });

  describe("GET /settings", () => {
    test("retourne 401 sans authentification", async () => {
      const res = await request(app).get("/settings");
      expect(res.status).toBe(401);
    });

    test("retourne les paramètres TVA par défaut", async () => {
      const res = await request(app)
        .get("/settings")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("vatActive");
      expect(res.body).toHaveProperty("vatMode");
      expect(res.body).toHaveProperty("vatDefaultRate");
      expect(res.body).toHaveProperty("vatRates");
      expect(Array.isArray(res.body.vatRates)).toBe(true);
    });

    test("utilisateur non-admin peut lire les settings", async () => {
      const res = await request(app)
        .get("/settings")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("vatActive");
    });
  });

  describe("GET /settings/vat", () => {
    test("retourne les mêmes données que GET /settings", async () => {
      const res = await request(app)
        .get("/settings/vat")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("vatActive");
      expect(res.body).toHaveProperty("vatMode");
    });
  });

  describe("PUT /settings", () => {
    test("admin peut activer la TVA", async () => {
      const res = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          vatActive: true,
          vatMode: "HT",
          vatDefaultRate: 0.2,
          vatRates: [
            { id: "rate-20", label: "TVA 20%", rate: 0.2 },
            { id: "rate-10", label: "TVA 10%", rate: 0.1 },
            { id: "rate-5", label: "TVA 5.5%", rate: 0.055 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.vatActive).toBe(true);
      expect(res.body.vatMode).toBe("HT");
      expect(res.body.vatDefaultRate).toBe(0.2);
    });

    test("admin peut passer en mode TTC", async () => {
      const res = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          vatActive: true,
          vatMode: "TTC",
          vatDefaultRate: 0.2,
          vatRates: [{ id: "rate-20", label: "TVA 20%", rate: 0.2 }]
        });

      expect(res.status).toBe(200);
      expect(res.body.vatMode).toBe("TTC");
    });

    test("retourne 400 si taux par défaut invalide", async () => {
      const res = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          vatActive: true,
          vatMode: "HT",
          vatDefaultRate: 0.5, // pas dans la liste
          vatRates: [{ id: "rate-20", label: "TVA 20%", rate: 0.2 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/taux par défaut/i);
    });

    test("utilisateur non-admin reçoit 403", async () => {
      const res = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          vatActive: true,
          vatMode: "HT",
          vatDefaultRate: 0.2,
          vatRates: [{ id: "rate-20", label: "TVA 20%", rate: 0.2 }]
        });

      expect(res.status).toBe(403);
    });

    test("admin peut désactiver la TVA", async () => {
      const res = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          vatActive: false,
          vatMode: "HT",
          vatDefaultRate: 0,
          vatRates: []
        });

      expect(res.status).toBe(200);
      expect(res.body.vatActive).toBe(false);
    });
  });

  describe("PUT /settings/vat", () => {
    test("admin peut modifier via /settings/vat", async () => {
      const res = await request(app)
        .put("/settings/vat")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          vatActive: true,
          vatMode: "HT",
          vatDefaultRate: 0.1,
          vatRates: [
            { id: "rate-10", label: "TVA 10%", rate: 0.1 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.vatDefaultRate).toBe(0.1);
    });

    test("utilisateur non-admin reçoit 403 sur /settings/vat", async () => {
      const res = await request(app)
        .put("/settings/vat")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ vatActive: true });

      expect(res.status).toBe(403);
    });
  });

  describe("Validation des taux TVA", () => {
    test("taux négatif est ignoré", async () => {
      const res = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          vatActive: false,
          vatMode: "HT",
          vatDefaultRate: 0,
          vatRates: [{ id: "bad", label: "Invalid", rate: -0.1 }]
        });

      expect(res.status).toBe(200);
      // Les taux invalides sont filtrés et remplacés par défaut
      expect(res.body.vatRates.every(r => r.rate >= 0)).toBe(true);
    });

    test("taux > 100% est ignoré", async () => {
      const res = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          vatActive: false,
          vatMode: "HT",
          vatDefaultRate: 0,
          vatRates: [{ id: "bad", label: "Invalid", rate: 1.5 }]
        });

      expect(res.status).toBe(200);
      expect(res.body.vatRates.every(r => r.rate <= 1)).toBe(true);
    });
  });
});
