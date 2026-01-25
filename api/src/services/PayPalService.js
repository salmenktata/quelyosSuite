const logger = require("../../logger");
const prisma = require("../../prismaClient");

// PayPal configuration cache
let paypalConfig = null;
let lastConfigFetch = null;
const CONFIG_CACHE_TTL = 60000; // Cache config for 1 minute

/**
 * Get PayPal configuration from database or environment
 */
async function getPayPalConfig() {
  const now = Date.now();

  // Return cached config if still valid
  if (paypalConfig && lastConfigFetch && (now - lastConfigFetch) < CONFIG_CACHE_TTL) {
    return paypalConfig;
  }

  try {
    // Try to get config from database first
    const dbConfig = await prisma.paymentProviderConfig.findUnique({
      where: { provider: 'PAYPAL' },
    });

    if (dbConfig && dbConfig.isEnabled && dbConfig.secretKey) {
      logger.info("✓ Using PayPal configuration from database");
      paypalConfig = {
        clientId: dbConfig.publicKey,
        clientSecret: dbConfig.secretKey,
        webhookId: dbConfig.webhookSecret,
        mode: dbConfig.mode,
        currency: dbConfig.currency,
        source: 'database',
      };
      lastConfigFetch = now;
      return paypalConfig;
    }
  } catch (error) {
    logger.warn("Could not fetch PayPal config from database, falling back to env:", error.message);
  }

  // Fall back to environment variables
  if (process.env.PAYPAL_CLIENT_ID) {
    logger.info("✓ Using PayPal configuration from environment variables");
    paypalConfig = {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      webhookId: process.env.PAYPAL_WEBHOOK_ID,
      mode: process.env.PAYPAL_MODE || 'sandbox',
      currency: 'EUR',
      source: 'environment',
    };
    lastConfigFetch = now;
    return paypalConfig;
  }

  return null;
}

/**
 * Get PayPal OAuth token for API access
 */
async function getAccessToken() {
  const config = await getPayPalConfig();

  if (!config || !config.clientId || !config.clientSecret) {
    throw new Error("PayPal is not configured. Please configure it in Super Admin or set PAYPAL_CLIENT_ID in environment variables.");
  }

  const baseURL = config.mode === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal OAuth failed: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    logger.error("[PayPal] Error getting access token:", error);
    throw error;
  }
}

/**
 * Make authenticated PayPal API request
 */
async function paypalRequest(endpoint, options = {}) {
  const config = await getPayPalConfig();
  const accessToken = await getAccessToken();

  const baseURL = config.mode === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseURL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal API error: ${error}`);
  }

  return response.json();
}

class PayPalService {
  /**
   * Create a PayPal order (one-time payment or subscription setup)
   */
  static async createOrder({ company, user, amount, currency = 'EUR', returnUrl, cancelUrl }) {
    const config = await getPayPalConfig();

    try {
      const order = await paypalRequest('/v2/checkout/orders', {
        method: 'POST',
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: (amount / 100).toFixed(2), // Convert cents to decimal
            },
            description: `Quelyos subscription for ${company.name}`,
            custom_id: `company_${company.id}`,
          }],
          application_context: {
            brand_name: 'Quelyos',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        }),
      });

      logger.info(`[PayPal] Created order ${order.id} for company ${company.id}`);
      return order;
    } catch (error) {
      logger.error("[PayPal] Error creating order:", error);
      throw error;
    }
  }

  /**
   * Capture a PayPal order after user approval
   */
  static async captureOrder(orderId) {
    try {
      const capture = await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
      });

      logger.info(`[PayPal] Captured order ${orderId}`);
      return capture;
    } catch (error) {
      logger.error("[PayPal] Error capturing order:", error);
      throw error;
    }
  }

  /**
   * Create a PayPal subscription plan
   */
  static async createPlan({ name, description, amount, currency = 'EUR', interval = 'MONTH' }) {
    const config = await getPayPalConfig();

    try {
      // First create a product
      const product = await paypalRequest('/v1/catalogs/products', {
        method: 'POST',
        body: JSON.stringify({
          name: `Quelyos ${name}`,
          description,
          type: 'SERVICE',
          category: 'SOFTWARE',
        }),
      });

      // Then create a plan linked to the product
      const plan = await paypalRequest('/v1/billing/plans', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          name: `Quelyos ${name}`,
          description,
          billing_cycles: [{
            frequency: {
              interval_unit: interval, // MONTH or YEAR
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: (amount / 100).toFixed(2),
                currency_code: currency,
              },
            },
          }],
          payment_preferences: {
            auto_bill_outstanding: true,
            payment_failure_threshold: 3,
          },
        }),
      });

      logger.info(`[PayPal] Created plan ${plan.id}`);
      return plan;
    } catch (error) {
      logger.error("[PayPal] Error creating plan:", error);
      throw error;
    }
  }

  /**
   * Create a subscription for a plan
   */
  static async createSubscription({ planId, company, user, returnUrl, cancelUrl }) {
    try {
      const subscription = await paypalRequest('/v1/billing/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          subscriber: {
            name: {
              given_name: user.firstName || company.name,
              surname: user.lastName || '',
            },
            email_address: user.email,
          },
          application_context: {
            brand_name: 'Quelyos',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
          custom_id: `company_${company.id}`,
        }),
      });

      logger.info(`[PayPal] Created subscription ${subscription.id} for company ${company.id}`);
      return subscription;
    } catch (error) {
      logger.error("[PayPal] Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId, reason = 'Customer requested cancellation') {
    try {
      await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      logger.info(`[PayPal] Cancelled subscription ${subscriptionId}`);
    } catch (error) {
      logger.error("[PayPal] Error cancelling subscription:", error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId) {
    try {
      const subscription = await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error("[PayPal] Error getting subscription:", error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static async verifyWebhookSignature(headers, body) {
    const config = await getPayPalConfig();

    if (!config.webhookId) {
      throw new Error("PayPal webhook ID not configured");
    }

    try {
      const result = await paypalRequest('/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: config.webhookId,
          webhook_event: body,
        }),
      });

      return result.verification_status === 'SUCCESS';
    } catch (error) {
      logger.error("[PayPal] Webhook verification error:", error);
      return false;
    }
  }

  /**
   * Check if PayPal is enabled
   */
  static async isEnabled() {
    const config = await getPayPalConfig();
    return config !== null;
  }
}

module.exports = PayPalService;
