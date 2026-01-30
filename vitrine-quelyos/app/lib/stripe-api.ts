/**
 * Client API Stripe pour le frontend
 *
 * Endpoints:
 * - createCheckoutSession: Crée une session Stripe Checkout
 * - createPortalSession: Crée un lien vers le Customer Portal
 * - getStripeConfig: Récupère la clé publique Stripe
 */

import { logger } from './logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

interface CreateCheckoutSessionRequest {
  plan_code: string;
  billing_cycle: 'monthly' | 'yearly';
  tenant_code: string;
  customer_email?: string;
  success_url?: string;
  cancel_url?: string;
}

interface CreateCheckoutSessionResponse {
  success: boolean;
  checkout_url?: string;
  session_id?: string;
  error?: string;
  error_code?: string;
}

interface CreatePortalSessionRequest {
  tenant_code: string;
  return_url?: string;
}

interface CreatePortalSessionResponse {
  success: boolean;
  portal_url?: string;
  error?: string;
}

interface StripeConfigResponse {
  publishable_key: string;
  available: boolean;
}

/**
 * Crée une session Stripe Checkout pour un abonnement
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return await response.json();
  } catch (error) {
    logger.error('Erreur création session checkout', error);
    return {
      success: false,
      error: 'Erreur de connexion',
      error_code: 'CONNECTION_ERROR',
    };
  }
}

/**
 * Crée un lien vers le Stripe Customer Portal
 */
export async function createPortalSession(
  request: CreatePortalSessionRequest,
  authToken?: string
): Promise<CreatePortalSessionResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/stripe/create-portal-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    return await response.json();
  } catch (error) {
    logger.error('Erreur création session portail', error);
    return {
      success: false,
      error: 'Erreur de connexion',
    };
  }
}

/**
 * Récupère la configuration Stripe (clé publique)
 */
export async function getStripeConfig(): Promise<StripeConfigResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stripe/config`, {
      method: 'GET',
    });

    return await response.json();
  } catch (error) {
    logger.error('Erreur récupération config Stripe', error);
    return {
      publishable_key: '',
      available: false,
    };
  }
}

/**
 * Redirige vers Stripe Checkout
 */
export async function redirectToCheckout(
  planCode: string,
  billingCycle: 'monthly' | 'yearly',
  tenantCode: string,
  customerEmail?: string
): Promise<void> {
  const response = await createCheckoutSession({
    plan_code: planCode,
    billing_cycle: billingCycle,
    tenant_code: tenantCode,
    customer_email: customerEmail,
    success_url: `${window.location.origin}/ecommerce/signup/success?store=${tenantCode}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${window.location.origin}/ecommerce/pricing`,
  });

  if (response.success && response.checkout_url) {
    window.location.href = response.checkout_url;
  } else {
    throw new Error(response.error || 'Erreur lors de la création du checkout');
  }
}

// Types exports
export type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
  StripeConfigResponse,
};
