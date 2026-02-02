'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe, Stripe, PaymentRequest } from '@stripe/stripe-js';
import { backendClient } from '@/lib/backend/client';
import { logger } from '@/lib/logger';

interface WalletPaymentButtonProps {
  orderId?: number;
  amount: number;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Wallet Payment Button (Apple Pay / Google Pay)
 * Uses Stripe Payment Request API
 * Auto-detects available wallet (Apple Pay on Safari/iOS, Google Pay on Chrome/Android)
 *
 * Requirements:
 * - Stripe.js loaded
 * - HTTPS domain (wallets require secure context)
 * - Stripe account configured for wallet payments
 */
export function WalletPaymentButton({
  orderId,
  amount,
  onSuccess,
  onError,
}: WalletPaymentButtonProps) {
  const router = useRouter();

  const [canMakePayment, setCanMakePayment] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Stripe
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      logger.warn('Stripe API key missing');
      return;
    }

    loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).then((stripeInstance) => {
      setStripe(stripeInstance);
    });
  }, []);

  useEffect(() => {
    if (!stripe) return;
    initializePaymentRequest();
  }, [stripe, amount]);

  const initializePaymentRequest = async () => {
    if (!stripe) return;

    try {

      // Create Payment Request
      const pr = stripe.paymentRequest({
        country: 'FR',
        currency: 'eur',
        total: {
          label: 'Total',
          amount: Math.round(amount * 100), // Convert to cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestShipping: true,
        shippingOptions: [
          {
            id: 'standard',
            label: 'Livraison standard',
            detail: '3-5 jours',
            amount: 0,
          },
        ],
      });

      // Check if wallet payment is available
      const result = await pr.canMakePayment();

      if (result) {
        setCanMakePayment(true);
        setPaymentRequest(pr);

        // Handle payment method submission
        pr.on('paymentmethod', async (event) => {
          await handlePaymentMethod(event as unknown as PaymentMethodEvent, stripe);
        });
      } else {
        logger.debug('Wallet payment not available on this device/browser');
      }
    } catch (_error) {
      logger.error('Error initializing payment request:', error);
    }
  };

  const handlePaymentMethod = async (event: PaymentMethodEvent, stripeInstance: Stripe) => {
    try {
      setProcessing(true);

      // Get payment method from event
      const { paymentMethod, shippingAddress, payerName, payerEmail } = event;

      // Create payment intent on backend
      const response = await backendClient.createWalletPayment({
        amount: Math.round(amount * 100),
        payment_method_id: parseInt(paymentMethod.id, 10) || 0,
        shipping_address: {
          firstName: shippingAddress?.recipient?.split(' ')[0] || '',
          lastName: shippingAddress?.recipient?.split(' ').slice(1).join(' ') || '',
          address: shippingAddress?.addressLine?.[0] || '',
          city: shippingAddress?.city || '',
          postalCode: shippingAddress?.postalCode || '',
          country: shippingAddress?.country || '',
          phone: shippingAddress?.phone || '',
        },
        order_id: orderId,
      });

      if (!response.success || !response.data?.client_secret) {
        event.complete('fail');
        if (onError) {
          onError(response.message || 'Payment failed');
        }
        return;
      }

      // Confirm payment intent
      const { error: confirmError, paymentIntent } = await stripeInstance.confirmCardPayment(
        response.data.client_secret,
        {
          payment_method: paymentMethod.id,
        },
        { handleActions: false }
      );

      if (confirmError) {
        event.complete('fail');
        if (onError) {
          onError(confirmError.message || 'Payment confirmation failed');
        }
        return;
      }

      // Complete payment
      event.complete('success');

      if (onSuccess) {
        onSuccess(paymentIntent.id);
      } else {
        // Default: redirect to confirmation page
        router.push(`/checkout/confirmation?payment_intent=${paymentIntent.id}`);
      }
    } catch (_error: unknown) {
      logger.error('Error processing wallet payment:', error);
      event.complete('fail');
      if (onError) {
        onError(error instanceof Error ? error.message : 'Payment processing error');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Don't render if wallet payment is not available
  if (!canMakePayment || !paymentRequest) {
    return null;
  }

  return (
    <div className="wallet-payment-button">
      {/* Apple Pay / Google Pay Button */}
      <div
        onClick={() => {
          if (!processing && paymentRequest) {
            paymentRequest.show();
          }
        }}
        className="cursor-pointer"
      >
        {/* Stripe Payment Request Button Element */}
        <div id="payment-request-button" className="payment-request-button">
          {/* The actual button will be rendered by Stripe */}
          <button
            type="button"
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Traitement...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                <span>Paiement express</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <p className="mt-2 text-center text-xs text-gray-600">
        Paiement sécurisé avec Apple Pay ou Google Pay
      </p>
    </div>
  );
}

// Additional type definitions for PaymentRequest events
interface PaymentMethodEvent {
  complete: (status: 'success' | 'fail' | 'unknown') => void;
  paymentMethod: {
    id: string;
    type: string;
    card?: unknown;
  };
  shippingAddress?: {
    addressLine?: string[];
    city?: string;
    country?: string;
    dependentLocality?: string;
    organization?: string;
    phone?: string;
    postalCode?: string;
    recipient?: string;
    region?: string;
    sortingCode?: string;
  };
  shippingOption?: {
    id: string;
    label: string;
    amount: number;
  };
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
}
