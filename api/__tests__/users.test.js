/**
 * Tests pour /users (gestion utilisateurs - admin only)
 * T22.1 - Tests Jest coverage
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
    'TRUNCATE "Transaction","Account","Category","Budget","Budgets","User","Company" RESTART IDENTITY CASCADE;'
  );
};

describe("Users API (/users)", () => {
  let adminToken;
  let userToken;
  let adminUserId;
  let regularUserId;

  beforeAll(async () => {
    await truncateAll();

    // Créer un admin via register
    const adminRes = await request(app)
      .post("/auth/register")
      .send({
        companyName: "TestCompany",
        email: "admin@test.com",
        password: "Admin#2025!"
      });
    adminToken = adminRes.body.token;
    
    // Décoder le token pour obtenir l'userId
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    adminUserId = decoded.userId;
  });

  afterAll(async () => {
    await truncateAll();
    await prisma.$disconnect();
  });

  describe("GET /users", () => {
    test("retourne 401 sans authentification", async () => {
      const res = await request(app).get("/users");
      expect(res.status).toBe(401);
    });

    test("admin peut lister les utilisateurs", async () => {
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("email");
      expect(res.body[0]).toHaveProperty("role");
      expect(res.body[0]).not.toHaveProperty("password");
    });
  });

  describe("POST /users", () => {
    test("admin peut créer un utilisateur", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "newuser@test.com",
          password: "User#2025!",
          role: "USER"
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe("newuser@test.com");
      expect(res.body.role).toBe("USER");
      regularUserId = res.body.id;
    });

    test("retourne 400 si email manquant", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ password: "Test#2025!" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email.*password/i);
    });

    test("retourne 409 si email déjà utilisé", async () => {
      const res = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "admin@test.com",
          password: "Test#2025!"
        });

      expect(res.status).toBe(409);
    });
  });

  describe("PATCH /users/:id/role", () => {
    test("admin peut changer le rôle d'un utilisateur", async () => {
      const res = await request(app)
        .patch(`/users/${regularUserId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "ADMIN" });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("ADMIN");
    });

    test("retourne 400 pour ID invalide", async () => {
      const res = await request(app)
        .patch("/users/invalid/role")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "USER" });

      expect(res.status).toBe(400);
    });

    test("admin ne peut pas se rétrograder lui-même", async () => {
      const res = await request(app)
        .patch(`/users/${adminUserId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "USER" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/downgrade yourself/i);
    });

    test("retourne 404 pour utilisateur inexistant", async () => {
      const res = await request(app)
        .patch("/users/99999/role")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "USER" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /users/:id", () => {
    test("admin ne peut pas se supprimer lui-même", async () => {
      const res = await request(app)
        .delete(`/users/${adminUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot delete yourself/i);
    });

    test("admin peut supprimer un utilisateur", async () => {
      // D'abord créer un user à supprimer
      const createRes = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "todelete@test.com",
          password: "Delete#2025!"
        });
      
      const deleteRes = await request(app)
        .delete(`/users/${createRes.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/deleted/i);
    });

    test("retourne 404 pour utilisateur inexistant", async () => {
      const res = await request(app)
        .delete("/users/99999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    test("retourne 400 pour ID invalide", async () => {
      const res = await request(app)
        .delete("/users/invalid")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("Contrôle d'accès", () => {
    test("utilisateur non-admin reçoit 403", async () => {
      // Créer un user non-admin et obtenir son token
      const userRes = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "regularuser@test.com",
          password: "Regular#2025!",
          role: "USER"
        });

      // Login avec ce user
      const loginRes = await request(app)
        .post("/auth/login")
        .send({
          email: "regularuser@test.com",
          password: "Regular#2025!"
        });
      
      userToken = loginRes.body.token;

      // Tenter d'accéder à /users
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
