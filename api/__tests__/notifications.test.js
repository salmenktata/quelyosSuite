/**
 * Tests pour /user/notifications (notifications et préférences)
 * T22.5 - Tests Jest coverage
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
    'TRUNCATE "Notification","NotificationPreferences","Transaction","Account","Category","Budget","Budgets","User","Company","CompanySettings" RESTART IDENTITY CASCADE;'
  );
};

describe("Notifications API (/user/notifications)", () => {
  let token;
  let userId;

  beforeAll(async () => {
    await truncateAll();

    // Créer user via register
    const registerRes = await request(app)
      .post("/auth/register")
      .send({
        companyName: "NotifTestCo",
        email: "admin@notif-test.com",
        password: "Admin#2025!"
      });
    token = registerRes.body.token;

    // Décoder le token pour obtenir l'userId
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  });

  afterAll(async () => {
    await truncateAll();
    await prisma.$disconnect();
  });

  describe("GET /user/notifications/preferences", () => {
    test("retourne 401 sans authentification", async () => {
      const res = await request(app).get("/user/notifications/preferences");
      expect(res.status).toBe(401);
    });

    test("retourne les préférences par défaut", async () => {
      const res = await request(app)
        .get("/user/notifications/preferences")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("emailOnTransaction");
      expect(res.body).toHaveProperty("emailOnBudgetAlert");
      expect(res.body).toHaveProperty("weeklyDigest");
      expect(res.body).toHaveProperty("pushEnabled");
      expect(res.body).toHaveProperty("budgetAlertThreshold");
    });
  });

  describe("PATCH /user/notifications/preferences", () => {
    test("peut activer les notifications email", async () => {
      const res = await request(app)
        .patch("/user/notifications/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          emailOnTransaction: true,
          emailOnBudgetAlert: true
        });

      expect(res.status).toBe(200);
      expect(res.body.emailOnTransaction).toBe(true);
      expect(res.body.emailOnBudgetAlert).toBe(true);
    });

    test("peut modifier le seuil d'alerte budget", async () => {
      const res = await request(app)
        .patch("/user/notifications/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          budgetAlertThreshold: 80
        });

      expect(res.status).toBe(200);
      expect(res.body.budgetAlertThreshold).toBe(80);
    });

    test("peut activer/désactiver les notifications push", async () => {
      const res = await request(app)
        .patch("/user/notifications/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pushEnabled: true,
          pushOnTransaction: true,
          pushOnBudgetAlert: true
        });

      expect(res.status).toBe(200);
      expect(res.body.pushEnabled).toBe(true);
    });

    test("peut activer les rapports périodiques", async () => {
      const res = await request(app)
        .patch("/user/notifications/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          weeklyDigest: true,
          monthlyReport: true
        });

      expect(res.status).toBe(200);
      expect(res.body.weeklyDigest).toBe(true);
      expect(res.body.monthlyReport).toBe(true);
    });
  });

  describe("GET /user/notifications", () => {
    let notificationId;

    beforeAll(async () => {
      // Créer quelques notifications pour les tests
      const notif1 = await prisma.notification.create({
        data: {
          userId,
          type: "BUDGET_ALERT",
          title: "Alerte Budget",
          message: "Vous avez dépassé 80% du budget Marketing"
        }
      });
      notificationId = notif1.id;

      await prisma.notification.create({
        data: {
          userId,
          type: "TRANSACTION",
          title: "Nouvelle transaction",
          message: "Une dépense de 150€ a été enregistrée",
          read: true
        }
      });

      await prisma.notification.create({
        data: {
          userId,
          type: "SYSTEM",
          title: "Bienvenue",
          message: "Bienvenue sur Quelyos !"
        }
      });
    });

    test("retourne la liste des notifications", async () => {
      const res = await request(app)
        .get("/user/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notifications");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("unreadCount");
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(3);
    });

    test("filtre les notifications non lues", async () => {
      const res = await request(app)
        .get("/user/notifications?unread=true")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.every(n => n.read === false)).toBe(true);
    });

    test("respecte le paramètre limit", async () => {
      const res = await request(app)
        .get("/user/notifications?limit=2")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeLessThanOrEqual(2);
      expect(res.body.limit).toBe(2);
    });

    test("limite le limit à 100 maximum", async () => {
      const res = await request(app)
        .get("/user/notifications?limit=500")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.limit).toBeLessThanOrEqual(100);
    });
  });

  describe("PATCH /user/notifications/:id/read", () => {
    let unreadNotificationId;

    beforeEach(async () => {
      // Créer une notification non lue
      const notif = await prisma.notification.create({
        data: {
          userId,
          type: "TEST",
          title: "Test notification",
          message: "Test message"
        }
      });
      unreadNotificationId = notif.id;
    });

    test("marque une notification comme lue", async () => {
      const res = await request(app)
        .patch(`/user/notifications/${unreadNotificationId}/read`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.read).toBe(true);
      expect(res.body.readAt).toBeTruthy();
    });

    test("retourne 404 pour notification inexistante", async () => {
      const res = await request(app)
        .patch("/user/notifications/99999/read")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    test("retourne 400 pour ID invalide", async () => {
      const res = await request(app)
        .patch("/user/notifications/invalid/read")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe("POST /user/notifications/read-all", () => {
    beforeEach(async () => {
      // Créer des notifications non lues
      await prisma.notification.createMany({
        data: [
          { userId, type: "TEST", title: "Test 1", message: "Msg 1" },
          { userId, type: "TEST", title: "Test 2", message: "Msg 2" },
        ]
      });
    });

    test("marque toutes les notifications comme lues", async () => {
      const res = await request(app)
        .post("/user/notifications/read-all")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/all.*read/i);

      // Vérifier qu'elles sont bien toutes lues
      const checkRes = await request(app)
        .get("/user/notifications?unread=true")
        .set("Authorization", `Bearer ${token}`);

      expect(checkRes.body.unreadCount).toBe(0);
    });
  });

  describe("DELETE /user/notifications/:id", () => {
    let notifToDelete;

    beforeEach(async () => {
      notifToDelete = await prisma.notification.create({
        data: {
          userId,
          type: "TEST",
          title: "To delete",
          message: "This will be deleted"
        }
      });
    });

    test("supprime une notification", async () => {
      const res = await request(app)
        .delete(`/user/notifications/${notifToDelete.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    test("retourne 404 pour notification inexistante", async () => {
      const res = await request(app)
        .delete("/user/notifications/99999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    test("retourne 400 pour ID invalide", async () => {
      const res = await request(app)
        .delete("/user/notifications/invalid")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});
