const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Import app
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

describe("Categories API", () => {
  let testCompany;
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Cleanup
    await prisma.transaction.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.companySettings.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});

    // Setup test data
    testCompany = await prisma.company.create({
      data: { name: "Test Company" }
    });

    testUser = await prisma.user.create({
      data: {
        email: "test@categories.com",
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
    await prisma.category.deleteMany({});
    await prisma.companySettings.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.$disconnect();
  });

  test("POST /categories - créer une catégorie EXPENSE", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Alimentation",
        kind: "EXPENSE"
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Alimentation");
    expect(response.body.kind).toBe("EXPENSE");
    expect(response.body.companyId).toBe(testCompany.id);
  });

  test("POST /categories - créer une catégorie INCOME", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Ventes",
        kind: "INCOME"
      });

    expect(response.status).toBe(200);
    expect(response.body.kind).toBe("INCOME");
  });

  test("POST /categories - validation échoue si name manquant", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        kind: "EXPENSE"
      });

    expect(response.status).toBe(400);
  });

  test("POST /categories - validation échoue si kind invalide", async () => {
    const response = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test",
        kind: "INVALID"
      });

    expect(response.status).toBe(400);
  });

  test("GET /categories - liste toutes les catégories de la company", async () => {
    // Créer 2 catégories
    await prisma.category.createMany({
      data: [
        { name: "Transport", kind: "EXPENSE", companyId: testCompany.id },
        { name: "Salaires", kind: "INCOME", companyId: testCompany.id }
      ]
    });

    const response = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  test("GET /categories?kind=EXPENSE - filtre par kind", async () => {
    await prisma.category.createMany({
      data: [
        { name: "Transport", kind: "EXPENSE", companyId: testCompany.id },
        { name: "Ventes", kind: "INCOME", companyId: testCompany.id }
      ]
    });

    const response = await request(app)
      .get("/categories?kind=EXPENSE")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].kind).toBe("EXPENSE");
  });

  test("DELETE /categories/:id - supprime une catégorie", async () => {
    const category = await prisma.category.create({
      data: {
        name: "À supprimer",
        kind: "EXPENSE",
        companyId: testCompany.id
      }
    });

    const response = await request(app)
      .delete(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);

    const deleted = await prisma.category.findUnique({
      where: { id: category.id }
    });
    expect(deleted).toBeNull();
  });

  test("GET /categories - isolation multi-tenant", async () => {
    // Créer une autre company avec une catégorie
    const otherCompany = await prisma.company.create({
      data: { name: "Other Company" }
    });

    await prisma.category.create({
      data: {
        name: "Catégorie autre company",
        kind: "EXPENSE",
        companyId: otherCompany.id
      }
    });

    const response = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    // Ne doit pas voir les catégories de l'autre company
    expect(response.body.every(cat => cat.companyId === testCompany.id)).toBe(true);
  });
});
