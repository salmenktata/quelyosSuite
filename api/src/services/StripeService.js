const Stripe = require("stripe");
const logger = require("../../logger");
const prisma = require("../../prismaClient");

// Stripe instance cache
let stripeInstance = null;
let stripeConfig = null;
let lastConfigFetch = null;
const CONFIG_CACHE_TTL = 60000; // Cache config for 1 minute

/**
 * Get Stripe configuration from database or environment
 */
async function getStripeConfig() {
  const now = Date.now();

  // Return cached config if still valid
  if (stripeConfig && lastConfigFetch && (now - lastConfigFetch) < CONFIG_CACHE_TTL) {
    return stripeConfig;
  }

  try {
    // Try to get config from database first
    const dbConfig = await prisma.paymentProviderConfig.findUnique({
      where: { provider: 'STRIPE' },
    });

    if (dbConfig && dbConfig.isEnabled && dbConfig.secretKey) {
      logger.info("✓ Using Stripe configuration from database");
      stripeConfig = {
        secretKey: dbConfig.secretKey,
        webhookSecret: dbConfig.webhookSecret,
        publicKey: dbConfig.publicKey,
        mode: dbConfig.mode,
        currency: dbConfig.currency,
        source: 'database',
      };
      lastConfigFetch = now;
      return stripeConfig;
    }
  } catch (error) {
    logger.warn("Could not fetch Stripe config from database, falling back to env:", error.message);
  }

  // Fall back to environment variables
  if (process.env.STRIPE_SECRET_KEY) {
    logger.info("✓ Using Stripe configuration from environment variables");
    stripeConfig = {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
      mode: process.env.STRIPE_MODE || 'test',
      currency: 'EUR',
      source: 'environment',
    };
    lastConfigFetch = now;
    return stripeConfig;
  }

  return null;
}

/**
 * Get or create Stripe instance
 */
async function getStripeInstance() {
  const config = await getStripeConfig();

  if (!config || !config.secretKey) {
    throw new Error("Stripe is not configured. Please configure it in Super Admin or set STRIPE_SECRET_KEY in environment variables.");
  }

  // Create new instance if config changed or doesn't exist
  if (!stripeInstance || stripeInstance._config !== config.secretKey) {
    stripeInstance = new Stripe(config.secretKey, {
      apiVersion: "2024-12-18.acacia",
    });
    stripeInstance._config = config.secretKey; // Mark with current config
    logger.info(`✓ Stripe initialized in ${config.mode} mode from ${config.source}`);
  }

  return stripeInstance;
}

// Legacy support: Try to initialize stripe from env on startup
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia",
  });
  logger.info("✓ Stripe initialized from environment variables (legacy mode)");
} else {
  logger.warn("⚠️  STRIPE_SECRET_KEY not set in environment. Stripe will be initialized from database when needed.");
}

/**
 * Stripe Price IDs (Set these in your .env or create them in Stripe Dashboard)
 * Example:
 * STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
 * STRIPE_PRICE_PRO_YEARLY=price_xxxxx
 * STRIPE_PRICE_EXPERT_MONTHLY=price_xxxxx
 * STRIPE_PRICE_EXPERT_YEARLY=price_xxxxx
 */
const PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
  EXPERT_MONTHLY: process.env.STRIPE_PRICE_EXPERT_MONTHLY,
  EXPERT_YEARLY: process.env.STRIPE_PRICE_EXPERT_YEARLY,
};

const PLAN_PRICES = {
  PRO: { monthly: 1900, yearly: 19000 }, // in cents
  EXPERT: { monthly: 4900, yearly: 49000 },
};

class StripeService {
  /**
   * Get or create a Stripe customer for a company
   */
  static async getOrCreateCustomer(company, user) {
    const stripe = await getStripeInstance();
    try {
      // Check if customer already exists
      let stripeCustomer = await prisma.stripeCustomer.findUnique({
        where: { companyId: company.id },
      });

      if (stripeCustomer) {
        return stripeCustomer;
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: {
          companyId: company.id.toString(),
          userId: user.id.toString(),
        },
      });

      // Save to database
      stripeCustomer = await prisma.stripeCustomer.create({
        data: {
          companyId: company.id,
          stripeCustomerId: customer.id,
          email: user.email,
          name: company.name,
        },
      });

      logger.info(
        `[Stripe] Created customer ${customer.id} for company ${company.id}`
      );

      return stripeCustomer;
    } catch (error) {
      logger.error("[Stripe] Error creating customer:", error);
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession({
    company,
    user,
    plan,
    interval = "month",
    successUrl,
    cancelUrl,
  }) {
    const stripe = await getStripeInstance();
    try {
      const stripeCustomer = await this.getOrCreateCustomer(company, user);

      // Get price ID
      const priceKey = `${plan}_${interval.toUpperCase()}`;
      const priceId = PRICE_IDS[priceKey];

      if (!priceId) {
        throw new Error(
          `Price ID not configured for ${plan} ${interval}. Please set STRIPE_PRICE_${priceKey} in .env`
        );
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomer.stripeCustomerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: plan === "EXPERT" ? 1 : 1, // For EXPERT, quantity could be number of users
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          companyId: company.id.toString(),
          plan,
          interval,
        },
        subscription_data: {
          trial_period_days: 14, // 14 days trial
          metadata: {
            companyId: company.id.toString(),
            plan,
          },
        },
      });

      logger.info(
        `[Stripe] Created checkout session ${session.id} for company ${company.id}`
      );

      return session;
    } catch (error) {
      logger.error("[Stripe] Error creating checkout session:", error);
      throw error;
    }
  }

  /**
   * Create a customer portal session
   */
  static async createPortalSession({ company, returnUrl }) {
    const stripe = await getStripeInstance();
    try {
      const stripeCustomer = await prisma.stripeCustomer.findUnique({
        where: { companyId: company.id },
      });

      if (!stripeCustomer) {
        throw new Error("No Stripe customer found for this company");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomer.stripeCustomerId,
        return_url: returnUrl,
      });

      logger.info(
        `[Stripe] Created portal session for company ${company.id}`
      );

      return session;
    } catch (error) {
      logger.error("[Stripe] Error creating portal session:", error);
      throw error;
    }
  }

  /**
   * Get current subscription for a company
   */
  static async getCurrentSubscription(companyId) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          companyId,
          status: {
            in: ["ACTIVE", "TRIALING"],
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return subscription;
    } catch (error) {
      logger.error("[Stripe] Error getting subscription:", error);
      throw error;
    }
  }

  /**
   * Handle subscription created webhook
   */
  static async handleSubscriptionCreated(subscription) {
    try {
      const companyId = parseInt(subscription.metadata.companyId);
      const plan = subscription.metadata.plan || "PRO";

      const stripeCustomer = await prisma.stripeCustomer.findUnique({
        where: { stripeCustomerId: subscription.customer },
      });

      if (!stripeCustomer) {
        logger.error(
          `[Stripe] Customer not found for subscription ${subscription.id}`
        );
        return;
      }

      // Determine pricing
      const interval = subscription.items.data[0]?.plan?.interval || "month";
      const amount =
        subscription.items.data[0]?.plan?.amount ||
        PLAN_PRICES[plan][interval === "year" ? "yearly" : "monthly"];

      // Create subscription in database
      await prisma.subscription.create({
        data: {
          companyId,
          stripeCustomerId: stripeCustomer.id,
          stripeSubscriptionId: subscription.id,
          plan,
          status: subscription.status.toUpperCase(),
          priceId: subscription.items.data[0]?.price?.id,
          amount,
          currency: subscription.currency,
          interval,
          trialStart: subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          metadata: subscription.metadata,
        },
      });

      logger.info(
        `[Stripe] Created subscription ${subscription.id} for company ${companyId}`
      );
    } catch (error) {
      logger.error("[Stripe] Error handling subscription.created:", error);
      throw error;
    }
  }

  /**
   * Handle subscription updated webhook
   */
  static async handleSubscriptionUpdated(subscription) {
    try {
      const companyId = parseInt(subscription.metadata.companyId);
      const interval = subscription.items.data[0]?.plan?.interval || "month";
      const plan = subscription.metadata.plan || "PRO";
      const amount =
        subscription.items.data[0]?.plan?.amount ||
        PLAN_PRICES[plan][interval === "year" ? "yearly" : "monthly"];

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status.toUpperCase(),
          priceId: subscription.items.data[0]?.price?.id,
          amount,
          currency: subscription.currency,
          interval,
          trialStart: subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
          endedAt: subscription.ended_at
            ? new Date(subscription.ended_at * 1000)
            : null,
          metadata: subscription.metadata,
        },
      });

      logger.info(
        `[Stripe] Updated subscription ${subscription.id} for company ${companyId}`
      );
    } catch (error) {
      logger.error("[Stripe] Error handling subscription.updated:", error);
      throw error;
    }
  }

  /**
   * Handle subscription deleted webhook
   */
  static async handleSubscriptionDeleted(subscription) {
    try {
      const companyId = parseInt(subscription.metadata.companyId);

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: "CANCELED",
          endedAt: new Date(),
        },
      });

      logger.info(
        `[Stripe] Deleted subscription ${subscription.id} for company ${companyId}`
      );
    } catch (error) {
      logger.error("[Stripe] Error handling subscription.deleted:", error);
      throw error;
    }
  }

  /**
   * Handle invoice payment succeeded
   */
  static async handleInvoicePaymentSucceeded(invoice) {
    try {
      const stripeCustomer = await prisma.stripeCustomer.findUnique({
        where: { stripeCustomerId: invoice.customer },
      });

      if (!stripeCustomer) {
        logger.error(
          `[Stripe] Customer not found for invoice ${invoice.id}`
        );
        return;
      }

      // Upsert invoice
      await prisma.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
          companyId: stripeCustomer.companyId,
          stripeCustomerId: stripeCustomer.id,
          stripeInvoiceId: invoice.id,
          number: invoice.number,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          dueDate: invoice.due_date
            ? new Date(invoice.due_date * 1000)
            : null,
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
        },
        update: {
          number: invoice.number,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          status: invoice.status,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
        },
      });

      logger.info(
        `[Stripe] Payment succeeded for invoice ${invoice.id} (company ${stripeCustomer.companyId})`
      );
    } catch (error) {
      logger.error(
        "[Stripe] Error handling invoice.payment_succeeded:",
        error
      );
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static async constructEvent(payload, signature) {
    const stripe = await getStripeInstance();
    const config = await getStripeConfig();

    const webhookSecret = config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured. Please set it in Super Admin or environment variables.");
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Check if company has active subscription
   */
  static async hasActiveSubscription(companyId) {
    const subscription = await this.getCurrentSubscription(companyId);
    return !!subscription;
  }

  /**
   * Get subscription plan for company
   */
  static async getCompanyPlan(companyId) {
    const subscription = await this.getCurrentSubscription(companyId);
    return subscription?.plan || "FREE";
  }
}

module.exports = StripeService;
