const request = require("supertest");
const app = require("../server");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

describe("VAT Calculation API", () => {
  let testCompany, testUser, testAccount, testCategory, authToken;

  beforeEach(async () => {
    // Créer société
    testCompany = await prisma.company.create({
      data: { name: "Test Company VAT" }
    });

    // Créer utilisateur
    const hashedPassword = await bcrypt.hash("password123", 10);
    testUser = await prisma.user.create({
      data: {
        email: "vat@test.com",
        password: hashedPassword,
        role: "ADMIN",
        companyId: testCompany.id
      }
    });

    // Générer token
    const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    authToken = jwt.sign(
      { userId: testUser.id, companyId: testCompany.id, role: "ADMIN" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Créer compte et catégorie
    testAccount = await prisma.account.create({
      data: {
        name: "Test Account VAT",
        companyId: testCompany.id,
        balance: 5000
      }
    });

    testCategory = await prisma.category.create({
      data: {
        name: "Test Category",
        kind: "EXPENSE",
        companyId: testCompany.id
      }
    });

    // Activer la TVA avec taux par défaut 20%
    await prisma.companySettings.upsert({
      where: { companyId: testCompany.id },
      update: {
        vatActive: true,
        vatMode: "HT",
        vatDefaultRate: 0.2,
        vatRates: [
          { id: "tva-0", label: "TVA 0%", rate: 0 },
          { id: "tva-10", label: "TVA 10%", rate: 0.1 },
          { id: "tva-20", label: "TVA 20%", rate: 0.2 }
        ]
      },
      create: {
        companyId: testCompany.id,
        vatActive: true,
        vatMode: "HT",
        vatDefaultRate: 0.2,
        vatRates: [
          { id: "tva-0", label: "TVA 0%", rate: 0 },
          { id: "tva-10", label: "TVA 10%", rate: 0.1 },
          { id: "tva-20", label: "TVA 20%", rate: 0.2 }
        ]
      }
    });
  });

  afterEach(async () => {
    await prisma.transaction.deleteMany({ where: { accountId: testAccount.id } });
    await prisma.category.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.account.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.companySettings.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.user.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.company.delete({ where: { id: testCompany.id } });
  });

  test("POST /transactions - calcul TVA avec montant HT (taux 20%)", async () => {
    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        accountId: testAccount.id,
        categoryId: testCategory.id,
        amount: 100, // 100€ HT
        type: "debit",
        description: "Test TVA 20%",
        vatRate: 0.2,
        vatMode: "HT"
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(100);
    expect(res.body.vatRate).toBe(0.2);
    expect(res.body.vatAmount).toBe(20); // 100 * 0.2
    expect(res.body.amountTTC).toBe(120); // 100 + 20
  });

  test("POST /transactions - calcul TVA avec montant TTC (taux 20%)", async () => {
    // Mettre le mode en TTC
    await prisma.companySettings.update({
      where: { companyId: testCompany.id },
      data: { vatMode: "TTC" }
    });

    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        accountId: testAccount.id,
        categoryId: testCategory.id,
        amount: 120, // 120€ TTC
        type: "debit",
        description: "Test TVA TTC",
        vatRate: 0.2,
        vatMode: "TTC"
      });

    expect(res.status).toBe(201);
    expect(res.body.amountTTC).toBe(120);
    expect(res.body.vatRate).toBe(0.2);
    // HT = TTC / (1 + taux) = 120 / 1.2 = 100
    expect(res.body.amount).toBe(100);
    expect(res.body.vatAmount).toBe(20);
  });

  test("POST /transactions - TVA à 10%", async () => {
    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        accountId: testAccount.id,
        categoryId: testCategory.id,
        amount: 200,
        type: "debit",
        description: "Test TVA 10%",
        vatRate: 0.1,
        vatMode: "HT"
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(200);
    expect(res.body.vatRate).toBe(0.1);
    expect(res.body.vatAmount).toBe(20); // 200 * 0.1
    expect(res.body.amountTTC).toBe(220);
  });

  test("POST /transactions - TVA à 0% (exonération)", async () => {
    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        accountId: testAccount.id,
        categoryId: testCategory.id,
        amount: 150,
        type: "debit",
        description: "Test TVA 0%",
        vatRate: 0,
        vatMode: "HT"
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(150);
    expect(res.body.vatRate).toBe(0);
    expect(res.body.vatAmount).toBe(0);
    expect(res.body.amountTTC).toBe(150);
  });

  test("POST /transactions - utilise taux par défaut si non spécifié", async () => {
    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        accountId: testAccount.id,
        categoryId: testCategory.id,
        amount: 100,
        type: "debit",
        description: "Test TVA défaut"
        // vatRate non spécifié, devrait utiliser 20% par défaut
      });

    expect(res.status).toBe(201);
    expect(res.body.vatRate).toBe(0.2); // Taux par défaut
    expect(res.body.vatAmount).toBe(20);
    expect(res.body.amountTTC).toBe(120);
  });

  test("GET /settings - récupérer config TVA", async () => {
    const res = await request(app)
      .get("/settings")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.vatActive).toBe(true);
    expect(res.body.vatMode).toBe("HT");
    expect(res.body.vatDefaultRate).toBe(0.2);
    expect(res.body.vatRates).toHaveLength(3);
  });

  test("PUT /settings - modifier config TVA", async () => {
    const res = await request(app)
      .put("/settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        vatActive: true,
        vatMode: "TTC",
        vatDefaultRate: 0.1,
        vatRates: [
          { id: "tva-5", label: "TVA 5.5%", rate: 0.055 },
          { id: "tva-10", label: "TVA 10%", rate: 0.1 },
          { id: "tva-20", label: "TVA 20%", rate: 0.2 }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.vatMode).toBe("TTC");
    expect(res.body.vatDefaultRate).toBe(0.1);
    expect(res.body.vatRates).toHaveLength(3);
    expect(res.body.vatRates[0].rate).toBe(0.055);
  });
});
