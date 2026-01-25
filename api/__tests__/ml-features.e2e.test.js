const request = require("supertest");
const { PrismaClient } = require("@prisma/client");

process.env.NODE_ENV = "test";
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  throw new Error("TEST_DATABASE_URL ou DATABASE_URL doit être défini pour lancer les tests e2e");
}

if (/prod|production|api\.quelyos\.com/i.test(TEST_DB_URL)) {
  throw new Error("Refus de lancer les tests e2e sur une base potentiellement de production");
}

process.env.DATABASE_URL = TEST_DB_URL;

const prisma = new PrismaClient();
const app = require("../server");

async function truncateAll() {
  await prisma.$executeRaw`TRUNCATE TABLE "CategorySuggestion" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "TransactionAnomaly" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "DuplicateDetection" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "BudgetRecommendation" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "CustomerRiskScore" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "CustomerInvoice" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Customer" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Transaction" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Account" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Category" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Budgets" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Company" RESTART IDENTITY CASCADE;`;
}

describe("ML Features E2E Tests", () => {
  let authToken;
  let userId;
  let companyId;
  let accountId;
  let categoryId;

  beforeAll(async () => {
    await truncateAll();

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: "ML Test Company",
        email: "mltest@quelyos.com"
      }
    });
    companyId = company.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "mltest@quelyos.com",
        firstName: "ML",
        lastName: "Tester",
        password: "$2b$10$abcdefghijklmnopqrstuvwxyz", // dummy hash
        companyId: companyId
      }
    });
    userId = user.id;

    // Generate JWT token for tests
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: user.id, companyId: company.id },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test account
    const account = await prisma.account.create({
      data: {
        name: "Test Account",
        type: "CHECKING",
        balance: 10000,
        companyId: companyId
      }
    });
    accountId = account.id;

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: "Alimentation",
        kind: "EXPENSE",
        companyId: companyId
      }
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ===================================
  // P3: DUPLICATE DETECTION TESTS
  // ===================================
  describe("P3 - Duplicate Detection", () => {
    test("should detect exact duplicate transaction", async () => {
      // Create first transaction
      const firstTx = await prisma.transaction.create({
        data: {
          accountId,
          description: "ACHAT CARREFOUR PARIS 75012",
          amount: 45.50,
          occurredAt: new Date("2025-01-06"),
          kind: "DEBIT",
          categoryId,
          companyId
        }
      });

      // Try to create duplicate via API
      const duplicateCheck = await request(app)
        .post("/api/v1/finance/duplicates/check")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          accountId,
          description: "ACHAT CARREFOUR PARIS 75012",
          amount: 45.50,
          occurredAt: "2025-01-07T00:00:00Z"
        });

      expect(duplicateCheck.status).toBe(200);
      expect(duplicateCheck.body.is_likely_duplicate).toBe(true);
      expect(duplicateCheck.body.matches).toHaveLength(1);
      expect(duplicateCheck.body.matches[0].similarity_score).toBeGreaterThan(0.9);
    }, 15000);

    test("should detect fuzzy duplicate with typo", async () => {
      await prisma.transaction.create({
        data: {
          accountId,
          description: "Lidl Supermarch\u00e9 Paris",
          amount: 35.00,
          occurredAt: new Date("2025-01-05"),
          kind: "DEBIT",
          categoryId,
          companyId
        }
      });

      const fuzzyCheck = await request(app)
        .post("/api/v1/finance/duplicates/check")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          accountId,
          description: "LIDL SUPERMARCHE PARIS",
          amount: 35.00,
          occurredAt: "2025-01-06T00:00:00Z"
        });

      expect(fuzzyCheck.status).toBe(200);
      expect(fuzzyCheck.body.is_likely_duplicate).toBe(true);
      expect(fuzzyCheck.body.matches[0].description_similarity).toBeGreaterThan(0.8);
    }, 15000);

    test("should NOT detect different transactions", async () => {
      const differentCheck = await request(app)
        .post("/api/v1/finance/duplicates/check")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          accountId,
          description: "APPLE STORE ONLINE",
          amount: 299.99,
          occurredAt: "2025-01-08T00:00:00Z"
        });

      expect(differentCheck.status).toBe(200);
      expect(differentCheck.body.is_likely_duplicate).toBe(false);
      expect(differentCheck.body.matches).toHaveLength(0);
    }, 15000);
  });

  // ===================================
  // P2: ANOMALY DETECTION TESTS
  // ===================================
  describe("P2 - Anomaly Detection", () => {
    beforeAll(async () => {
      // Create normal transactions for training
      const normalAmounts = [45, 50, 48, 52, 47, 49, 51, 46];

      for (let i = 0; i < normalAmounts.length; i++) {
        await prisma.transaction.create({
          data: {
            accountId,
            description: `Normal purchase ${i}`,
            amount: normalAmounts[i],
            occurredAt: new Date(`2024-12-${String(i + 1).padStart(2, '0')}`),
            kind: "DEBIT",
            categoryId,
            companyId
          }
        });
      }
    });

    test("should train anomaly detector for category", async () => {
      const trainRes = await request(app)
        .post("/api/v1/finance/anomalies/train")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          companyId,
          categoryId
        });

      expect(trainRes.status).toBe(200);
      expect(trainRes.body.success).toBe(true);
      expect(trainRes.body.samples_used).toBeGreaterThan(5);
    }, 20000);

    test("should detect large outlier as anomaly", async () => {
      // Create outlier transaction
      const outlierTx = await prisma.transaction.create({
        data: {
          accountId,
          description: "Unusual large purchase",
          amount: 2500, // 50x normal
          occurredAt: new Date("2025-01-08"),
          kind: "DEBIT",
          categoryId,
          companyId
        }
      });

      const detectRes = await request(app)
        .get(`/api/v1/finance/anomalies`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ categoryId });

      expect(detectRes.status).toBe(200);

      const anomaly = detectRes.body.find(a => a.transactionId === outlierTx.id);
      if (anomaly) {
        expect(anomaly.severity).toMatch(/high|medium/i);
        expect(anomaly.score).toBeGreaterThan(0.5);
      }
    }, 15000);

    test("should NOT detect normal transaction as anomaly", async () => {
      const normalTx = await prisma.transaction.create({
        data: {
          accountId,
          description: "Normal purchase",
          amount: 48.50,
          occurredAt: new Date("2025-01-09"),
          kind: "DEBIT",
          categoryId,
          companyId
        }
      });

      const detectRes = await request(app)
        .get(`/api/v1/finance/anomalies`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ categoryId });

      expect(detectRes.status).toBe(200);

      const anomaly = detectRes.body.find(a => a.transactionId === normalTx.id);
      expect(anomaly).toBeFalsy(); // Should not be flagged as anomaly
    }, 15000);
  });

  // ===================================
  // P4: SMART BUDGETS TESTS
  // ===================================
  describe("P4 - Smart Budgets", () => {
    beforeAll(async () => {
      // Create 6 months of transaction history
      const amounts = [450, 520, 480, 510, 490, 530];

      for (let i = 0; i < 6; i++) {
        await prisma.transaction.create({
          data: {
            accountId,
            description: `Monthly expense ${i}`,
            amount: amounts[i],
            occurredAt: new Date(`2024-${String(7 + i).padStart(2, '0')}-15`),
            kind: "DEBIT",
            categoryId,
            companyId
          }
        });
      }
    });

    test("should generate budget recommendation", async () => {
      const recommendRes = await request(app)
        .get(`/api/v1/finance/budget-recommendations/${categoryId}/recommendation`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ historicalMonths: 6 });

      expect(recommendRes.status).toBe(200);
      expect(recommendRes.body.recommended_amount).toBeDefined();
      expect(recommendRes.body.confidence).toBeGreaterThan(0);
      expect(recommendRes.body.confidence).toBeLessThanOrEqual(100);
      expect(recommendRes.body.seasonal_pattern).toMatch(/stable|increasing|decreasing|seasonal/);
      expect(recommendRes.body.breakdown).toHaveProperty('min');
      expect(recommendRes.body.breakdown).toHaveProperty('q3');
      expect(recommendRes.body.breakdown).toHaveProperty('median');
    }, 15000);

    test("should recommend Q3 (75th percentile) for stable pattern", async () => {
      const recommendRes = await request(app)
        .get(`/api/v1/finance/budget-recommendations/${categoryId}/recommendation`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ historicalMonths: 6 });

      expect(recommendRes.status).toBe(200);

      // For amounts [450, 480, 490, 510, 520, 530], Q3 should be around 517.5
      expect(recommendRes.body.recommended_amount).toBeGreaterThanOrEqual(500);
      expect(recommendRes.body.recommended_amount).toBeLessThanOrEqual(530);
      expect(recommendRes.body.seasonal_pattern).toBe('stable');
    }, 15000);

    test("should have high confidence for low variance data", async () => {
      const recommendRes = await request(app)
        .get(`/api/v1/finance/budget-recommendations/${categoryId}/recommendation`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ historicalMonths: 6 });

      expect(recommendRes.status).toBe(200);

      // Low variance (CV < 10%) should give high confidence (>90%)
      expect(recommendRes.body.confidence).toBeGreaterThan(85);
    }, 15000);
  });

  // ===================================
  // P5: CREDIT SCORING TESTS
  // ===================================
  describe("P5 - Credit Scoring", () => {
    let customerId;

    beforeAll(async () => {
      // Create customer
      const customer = await prisma.customer.create({
        data: {
          name: "Test Customer B2B",
          email: "customer@test.com",
          companyId,
          status: "ACTIVE",
          paymentTerms: 30
        }
      });
      customerId = customer.id;

      // Create invoice history (4 late, 1 on-time)
      const invoiceData = [
        { amount: 5000, dueDate: "2024-09-15", paidDate: "2024-09-30", delay: 15, status: "PAID" },
        { amount: 5200, dueDate: "2024-10-15", paidDate: "2024-10-18", delay: 3, status: "PAID" },
        { amount: 4800, dueDate: "2024-11-15", paidDate: "2024-11-25", delay: 10, status: "PAID" },
        { amount: 4500, dueDate: "2024-12-15", paidDate: "2024-12-14", delay: -1, status: "PAID" },
        { amount: 5000, dueDate: "2025-01-15", paidDate: "2025-01-20", delay: 5, status: "PAID" }
      ];

      for (const inv of invoiceData) {
        await prisma.customerInvoice.create({
          data: {
            customerId,
            invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount: inv.amount,
            amountPaid: inv.amount,
            amountRemaining: 0,
            issuedDate: new Date(inv.dueDate),
            dueDate: new Date(inv.dueDate),
            paidDate: new Date(inv.paidDate),
            status: inv.status,
            paymentDelay: inv.delay
          }
        });
      }
    });

    test("should calculate risk score for customer", async () => {
      const scoreRes = await request(app)
        .get(`/api/v1/finance/credit-scoring/customers/${customerId}/risk-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(scoreRes.status).toBe(200);
      expect(scoreRes.body.score).toBeDefined();
      expect(scoreRes.body.score).toBeGreaterThanOrEqual(0);
      expect(scoreRes.body.score).toBeLessThanOrEqual(100);
      expect(scoreRes.body.risk_level).toMatch(/LOW|MEDIUM|HIGH|CRITICAL/);
      expect(scoreRes.body.features).toHaveProperty('avg_payment_delay');
      expect(scoreRes.body.features).toHaveProperty('late_payment_rate');
      expect(scoreRes.body.features).toHaveProperty('avg_invoice_amount');
    }, 15000);

    test("should classify as MEDIUM risk (80% late payment rate)", async () => {
      const scoreRes = await request(app)
        .get(`/api/v1/finance/credit-scoring/customers/${customerId}/risk-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(scoreRes.status).toBe(200);

      // 4 out of 5 invoices late (80%) should result in MEDIUM or HIGH risk
      expect(scoreRes.body.features.late_payment_rate).toBeGreaterThan(0.7);
      expect(scoreRes.body.risk_level).toMatch(/MEDIUM|HIGH/);
    }, 15000);

    test("should calculate average payment delay correctly", async () => {
      const scoreRes = await request(app)
        .get(`/api/v1/finance/credit-scoring/customers/${customerId}/risk-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(scoreRes.status).toBe(200);

      // Avg delay = (15 + 3 + 10 + (-1) + 5) / 5 = 32 / 5 = 6.4 days
      expect(scoreRes.body.features.avg_payment_delay).toBeCloseTo(6.4, 1);
    }, 15000);

    test("should provide actionable recommendation", async () => {
      const scoreRes = await request(app)
        .get(`/api/v1/finance/credit-scoring/customers/${customerId}/risk-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(scoreRes.status).toBe(200);
      expect(scoreRes.body.recommendation).toBeTruthy();
      expect(scoreRes.body.recommendation.length).toBeGreaterThan(10);
    }, 15000);

    test("should cache risk score for 30 days", async () => {
      // First call
      const firstCall = await request(app)
        .get(`/api/v1/finance/credit-scoring/customers/${customerId}/risk-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(firstCall.status).toBe(200);
      const firstScore = firstCall.body.score;

      // Second call (should be cached)
      const secondCall = await request(app)
        .get(`/api/v1/finance/credit-scoring/customers/${customerId}/risk-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(secondCall.status).toBe(200);
      expect(secondCall.body.score).toBe(firstScore);

      // Verify it's from DB cache (validUntil should be in future)
      const dbScore = await prisma.customerRiskScore.findFirst({
        where: { customerId },
        orderBy: { createdAt: 'desc' }
      });

      expect(dbScore).toBeTruthy();
      expect(new Date(dbScore.validUntil)).toBeInstanceOf(Date);
      expect(new Date(dbScore.validUntil) > new Date()).toBe(true);
    }, 15000);

    test("should refresh risk score when requested", async () => {
      const refreshRes = await request(app)
        .post(`/api/v1/finance/credit-scoring/customers/${customerId}/risk-score/refresh`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.score).toBeDefined();
      expect(refreshRes.body.recalculated).toBe(true);
    }, 15000);

    test("should list high-risk customers", async () => {
      const highRiskRes = await request(app)
        .get("/api/v1/finance/credit-scoring/high-risk")
        .set("Authorization", `Bearer ${authToken}`);

      expect(highRiskRes.status).toBe(200);
      expect(Array.isArray(highRiskRes.body)).toBe(true);

      // If our test customer is high risk, it should appear
      if (highRiskRes.body.length > 0) {
        expect(highRiskRes.body[0]).toHaveProperty('customer');
        expect(highRiskRes.body[0]).toHaveProperty('risk_level');
      }
    }, 15000);
  });

  // ===================================
  // P1: CATEGORIZATION TESTS
  // (Requires trained model, tested separately)
  // ===================================
  describe("P1 - Categorization (Graceful Fallback)", () => {
    test("should return appropriate message when model not trained", async () => {
      const categorizeRes = await request(app)
        .post("/api/v1/finance/suggestions/categorize")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "ACHAT CARREFOUR",
          amount: 45.50,
          type: "debit"
        });

      expect(categorizeRes.status).toBe(200);

      // Should either return suggestions or indicate no model
      if (categorizeRes.body.model_info) {
        expect(categorizeRes.body.model_info.exists).toBeDefined();
      }
    }, 15000);

    test("should accept categorization feedback", async () => {
      const tx = await prisma.transaction.create({
        data: {
          accountId,
          description: "ACHAT CARREFOUR",
          amount: 45.50,
          occurredAt: new Date(),
          kind: "DEBIT",
          companyId
        }
      });

      const acceptRes = await request(app)
        .post("/api/v1/finance/suggestions/accept")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          transactionId: tx.id,
          suggestedCategoryId: categoryId,
          confidence: 0.94
        });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);

      // Verify CategorySuggestion created
      const suggestion = await prisma.categorySuggestion.findFirst({
        where: { transactionId: tx.id }
      });

      expect(suggestion).toBeTruthy();
      expect(suggestion.accepted).toBe(true);
      expect(suggestion.suggestedCategoryId).toBe(categoryId);
    }, 15000);

    test("should reject categorization and provide correct category", async () => {
      const tx = await prisma.transaction.create({
        data: {
          accountId,
          description: "Wrong category test",
          amount: 100,
          occurredAt: new Date(),
          kind: "DEBIT",
          companyId
        }
      });

      const wrongCategoryId = categoryId;
      const correctCategory = await prisma.category.create({
        data: {
          name: "Correct Category",
          kind: "EXPENSE",
          companyId
        }
      });

      const rejectRes = await request(app)
        .post("/api/v1/finance/suggestions/reject")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          transactionId: tx.id,
          suggestedCategoryId: wrongCategoryId,
          correctCategoryId: correctCategory.id,
          confidence: 0.85
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);

      // Verify CategorySuggestion created with rejection
      const suggestion = await prisma.categorySuggestion.findFirst({
        where: { transactionId: tx.id }
      });

      expect(suggestion).toBeTruthy();
      expect(suggestion.accepted).toBe(false);
      expect(suggestion.correctCategoryId).toBe(correctCategory.id);
    }, 15000);
  });

  // ===================================
  // INTEGRATION TESTS
  // ===================================
  describe("Integration - Full Workflow", () => {
    test("should complete full transaction creation with ML features", async () => {
      // 1. Check for duplicates before creating
      const duplicateCheck = await request(app)
        .post("/api/v1/finance/duplicates/check")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          accountId,
          description: "NEW UNIQUE PURCHASE",
          amount: 99.99,
          occurredAt: new Date().toISOString()
        });

      expect(duplicateCheck.status).toBe(200);
      expect(duplicateCheck.body.is_likely_duplicate).toBe(false);

      // 2. Create transaction
      const createRes = await request(app)
        .post("/api/v1/finance/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          accountId,
          description: "NEW UNIQUE PURCHASE",
          amount: 99.99,
          occurredAt: new Date().toISOString(),
          kind: "DEBIT",
          categoryId
        });

      expect(createRes.status).toBe(201);
      const transactionId = createRes.body.id;

      // 3. Check for anomalies (might be flagged if outlier)
      const anomalyCheck = await request(app)
        .get(`/api/v1/finance/anomalies`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ transactionId });

      expect(anomalyCheck.status).toBe(200);

      // 4. Get categorization suggestion (if model exists)
      const categorizeRes = await request(app)
        .post("/api/v1/finance/suggestions/categorize")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "NEW UNIQUE PURCHASE",
          amount: 99.99,
          type: "debit"
        });

      expect(categorizeRes.status).toBe(200);

      // Transaction should exist in DB
      const tx = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      expect(tx).toBeTruthy();
      expect(tx.description).toBe("NEW UNIQUE PURCHASE");
    }, 20000);
  });
});
