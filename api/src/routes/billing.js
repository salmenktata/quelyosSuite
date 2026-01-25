const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const logger = require("../../logger");
const StripeService = require("../services/StripeService");
const PayPalService = require("../services/PayPalService");
const { getUsageStats } = require("../middleware/paywall");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * GET /billing/subscription
 * Get current subscription details
 */
router.get("/subscription", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const subscription = await StripeService.getCurrentSubscription(companyId);

    if (!subscription) {
      return res.json({
        plan: "FREE",
        status: "ACTIVE",
        trial: false,
      });
    }

    res.json({
      plan: subscription.plan,
      status: subscription.status,
      trial: !!subscription.trialEnd && new Date() < subscription.trialEnd,
      trialEnd: subscription.trialEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      amount: subscription.amount,
      currency: subscription.currency,
      interval: subscription.interval,
    });
  } catch (error) {
    logger.error("[Billing] GET /subscription error:", error);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

/**
 * POST /billing/create-checkout-session
 * Create a Stripe checkout session for subscription
 */
router.post("/create-checkout-session", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { plan, interval = "month" } = req.body;

    // Validate plan
    if (!["PRO", "EXPERT"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Validate interval
    if (!["month", "year"].includes(interval)) {
      return res.status(400).json({ error: "Invalid interval" });
    }

    // Get company and user
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!company || !user) {
      return res.status(404).json({ error: "Company or user not found" });
    }

    // Create checkout session
    const session = await StripeService.createCheckoutSession({
      company,
      user,
      plan,
      interval,
      successUrl: `${process.env.FRONTEND_URL || "http://localhost:3007"}/dashboard/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:3007"}/dashboard/settings/billing?canceled=true`,
    });

    logger.info(
      `[Billing] Created checkout session ${session.id} for company ${companyId}`
    );

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error("[Billing] POST /create-checkout-session error:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});

/**
 * POST /billing/create-portal-session
 * Create a Stripe customer portal session
 */
router.post("/create-portal-session", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const session = await StripeService.createPortalSession({
      company,
      returnUrl: `${process.env.FRONTEND_URL || "http://localhost:3007"}/dashboard/settings/billing`,
    });

    logger.info(
      `[Billing] Created portal session for company ${companyId}`
    );

    res.json({
      url: session.url,
    });
  } catch (error) {
    logger.error("[Billing] POST /create-portal-session error:", error);
    res.status(500).json({ error: error.message || "Failed to create portal session" });
  }
});

/**
 * GET /billing/invoices
 * Get all invoices for the company
 */
router.get("/invoices", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(invoices);
  } catch (error) {
    logger.error("[Billing] GET /invoices error:", error);
    res.status(500).json({ error: "Failed to get invoices" });
  }
});

/**
 * GET /billing/usage
 * Get current usage stats (for paywall display)
 */
router.get("/usage", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const stats = await getUsageStats(companyId);
    res.json(stats);
  } catch (error) {
    logger.error("[Billing] GET /usage error:", error);
    res.status(500).json({ error: "Failed to get usage stats" });
  }
});

/**
 * GET /billing/plans
 * Get available subscription plans
 */
router.get("/plans", async (req, res) => {
  try {
    const plans = [
      {
        id: "FREE",
        name: "Freemium",
        description: "Pour découvrir et tester",
        price: 0,
        interval: "forever",
        features: [
          "1 utilisateur",
          "2 comptes bancaires",
          "100 transactions/mois",
          "Tableau de bord basique",
          "Export CSV",
          "Support email (48h)",
        ],
        limits: {
          users: 1,
          accounts: 2,
          transactionsPerMonth: 100,
        },
      },
      {
        id: "PRO",
        name: "Pro",
        description: "Pour les indépendants & TPE",
        price: 19,
        priceYearly: 16, // 190€/year = ~16€/month
        interval: "month",
        badge: "Le + populaire",
        features: [
          "1 utilisateur",
          "Comptes illimités",
          "Transactions illimitées",
          "Budgets intelligents",
          "Prévisions IA 12 mois",
          "Rapports avancés",
          "Export comptable (FEC)",
          "Support prioritaire (24h)",
        ],
        limits: {
          users: 1,
          accounts: -1, // unlimited
          transactionsPerMonth: -1, // unlimited
        },
      },
      {
        id: "EXPERT",
        name: "Expert",
        description: "Pour les équipes & multi-sociétés",
        price: 49,
        priceYearly: 41, // 490€/year = ~41€/month
        interval: "month",
        perUser: true,
        badge: "Multi-users",
        features: [
          "Jusqu'à 10 utilisateurs",
          "Tout le plan Pro",
          "Multi-entreprises",
          "Rôles & permissions",
          "Tableaux partagés",
          "API complète",
          "SSO (SAML/OAuth)",
          "Onboarding personnalisé",
        ],
        limits: {
          users: 10,
          accounts: -1,
          transactionsPerMonth: -1,
        },
      },
    ];

    res.json(plans);
  } catch (error) {
    logger.error("[Billing] GET /plans error:", error);
    res.status(500).json({ error: "Failed to get plans" });
  }
});

/**
 * POST /billing/paypal/create-order
 * Create a PayPal order for one-time payment
 */
router.post("/paypal/create-order", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { plan, interval = "month" } = req.body;

    // Validate plan
    if (!["PRO", "EXPERT"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Validate interval
    if (!["month", "year"].includes(interval)) {
      return res.status(400).json({ error: "Invalid interval" });
    }

    // Get company and user
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!company || !user) {
      return res.status(404).json({ error: "Company or user not found" });
    }

    // Calculate amount based on plan
    const amounts = {
      PRO: { month: 1900, year: 19000 },
      EXPERT: { month: 4900, year: 49000 },
    };

    const amount = amounts[plan][interval];

    // Create PayPal order
    const order = await PayPalService.createOrder({
      company,
      user,
      amount,
      currency: "EUR",
      returnUrl: `${process.env.FRONTEND_URL || "http://localhost:3007"}/dashboard/settings/billing?paypal=success`,
      cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:3007"}/dashboard/settings/billing?paypal=cancelled`,
    });

    logger.info(
      `[Billing] Created PayPal order ${order.id} for company ${companyId}`
    );

    res.json({
      orderId: order.id,
      approveUrl: order.links.find((link) => link.rel === "approve")?.href,
    });
  } catch (error) {
    logger.error("[Billing] POST /paypal/create-order error:", error);
    res.status(500).json({ error: error.message || "Failed to create PayPal order" });
  }
});

/**
 * POST /billing/paypal/capture-order
 * Capture a PayPal order after user approval
 */
router.post("/paypal/capture-order", auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID required" });
    }

    const capture = await PayPalService.captureOrder(orderId);

    logger.info(`[Billing] Captured PayPal order ${orderId}`);

    res.json({
      success: true,
      capture,
    });
  } catch (error) {
    logger.error("[Billing] POST /paypal/capture-order error:", error);
    res.status(500).json({ error: error.message || "Failed to capture PayPal order" });
  }
});

/**
 * GET /billing/payment-methods
 * Get available payment methods (Stripe, PayPal) based on configuration
 */
router.get("/payment-methods", async (req, res) => {
  try {
    const methods = [];

    // Check Stripe
    try {
      const stripeConfig = await prisma.paymentProviderConfig.findUnique({
        where: { provider: 'STRIPE' },
        select: { isEnabled: true },
      });
      if (stripeConfig?.isEnabled || process.env.STRIPE_SECRET_KEY) {
        methods.push({
          provider: 'stripe',
          name: 'Stripe',
          description: 'Credit card payments',
          available: true,
        });
      }
    } catch (err) {
      logger.warn("[Billing] Error checking Stripe availability:", err);
    }

    // Check PayPal
    try {
      const paypalConfig = await prisma.paymentProviderConfig.findUnique({
        where: { provider: 'PAYPAL' },
        select: { isEnabled: true },
      });
      if (paypalConfig?.isEnabled || process.env.PAYPAL_CLIENT_ID) {
        methods.push({
          provider: 'paypal',
          name: 'PayPal',
          description: 'PayPal payments',
          available: true,
        });
      }
    } catch (err) {
      logger.warn("[Billing] Error checking PayPal availability:", err);
    }

    res.json({
      success: true,
      methods,
    });
  } catch (error) {
    logger.error("[Billing] GET /payment-methods error:", error);
    res.status(500).json({ error: "Failed to get payment methods" });
  }
});

module.exports = router;
