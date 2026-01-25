const request = require("supertest");
const app = require("../server");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

describe("Refresh Token API", () => {
  let testCompany, testUser, accessToken, refreshToken;

  beforeEach(async () => {
    // Créer société de test
    testCompany = await prisma.company.create({
      data: { name: "Test Company Refresh Token" }
    });

    // Créer utilisateur
    const hashedPassword = await bcrypt.hash("password123", 10);
    testUser = await prisma.user.create({
      data: {
        email: "refresh@test.com",
        password: hashedPassword,
        role: "ADMIN",
        companyId: testCompany.id
      }
    });

    // Générer tokens
    const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    accessToken = jwt.sign(
      { userId: testUser.id, companyId: testCompany.id, role: "ADMIN" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    refreshToken = jwt.sign(
      { userId: testUser.id, companyId: testCompany.id, role: "ADMIN", type: "refresh" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Stocker le refresh token en DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: testUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      }
    });
  });

  afterEach(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.company.delete({ where: { id: testCompany.id } });
  });

  test("POST /auth/refresh - devrait générer un nouveau access token avec refresh token valide", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.userId).toBe(testUser.id);
    expect(res.body.companyId).toBe(testCompany.id);
    expect(res.body.role).toBe("ADMIN");

    // Vérifier que le nouveau token est valide
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET || "test-secret");
    expect(decoded.userId).toBe(testUser.id);
  });

  test("POST /auth/refresh - devrait échouer avec refresh token manquant", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test("POST /auth/refresh - devrait échouer avec refresh token invalide", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "invalid-token-12345" });

    expect(res.status).toBe(401);
  });

  test("POST /auth/refresh - devrait échouer avec refresh token expiré", async () => {
    // Créer un token expiré
    const expiredToken = jwt.sign(
      { userId: testUser.id, companyId: testCompany.id, role: "ADMIN", type: "refresh" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "-1d" } // Expiré depuis 1 jour
    );

    await prisma.refreshToken.create({
      data: {
        token: expiredToken,
        userId: testUser.id,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Hier
      }
    });

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
  });

  test("POST /auth/logout - devrait révoquer le refresh token", async () => {
    // Logout pour révoquer le token
    const logoutRes = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Tenter de réutiliser le refresh token révoqué
    const refreshRes = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });

  test("POST /auth/refresh - devrait fonctionner plusieurs fois avec le même refresh token", async () => {
    // Premier refresh
    const res1 = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    expect(res1.status).toBe(200);
    const newAccessToken1 = res1.body.token;
    expect(newAccessToken1).toBeDefined();

    // Deuxième refresh avec le même refresh token
    const res2 = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    expect(res2.status).toBe(200);
    const newAccessToken2 = res2.body.token;
    expect(newAccessToken2).toBeDefined();

    // Les deux devraient être valides (peuvent être identiques si générés dans la même seconde)
    const decoded1 = jwt.verify(newAccessToken1, process.env.JWT_SECRET || "test-secret");
    const decoded2 = jwt.verify(newAccessToken2, process.env.JWT_SECRET || "test-secret");
    expect(decoded1.userId).toBe(testUser.id);
    expect(decoded2.userId).toBe(testUser.id);
  });
});
