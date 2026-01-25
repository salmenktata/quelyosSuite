'use client';

import { useState, useCallback } from 'react';
import { useStripe, useElements, CardNumberElement } from '@stripe/react-stripe-js';
import { odooClient } from '@/lib/odoo/client';
import { logger } from '@/lib/logger';
import { getUserFriendlyErrorMessage } from '@/lib/logger';

interface UseStripePaymentOptions {
  orderId: number;
  orderAmount: number;
  onSuccess?: (orderId: number) => void;
  onError?: (error: Error) => void;
}

interface UseStripePaymentReturn {
  isProcessing: boolean;
  error: string | null;
  clientSecret: string | null;
  paymentIntentId: string | null;
  createPaymentIntent: () => Promise<void>;
  confirmPayment: (cardholderName: string) => Promise<void>;
}

/**
 * Hook personnalisé pour gérer le flux de paiement Stripe complet
 *
 * Flow:
 * 1. createPaymentIntent() - Créer un PaymentIntent côté serveur
 * 2. L'utilisateur remplit le formulaire Stripe Elements
 * 3. confirmPayment() - Confirmer le paiement avec Stripe et finaliser la commande Odoo
 */
export function useStripePayment({
  orderId,
  orderAmount,
  onSuccess,
  onError,
}: UseStripePaymentOptions): UseStripePaymentReturn {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  /**
   * Étape 1: Créer un Payment Intent Stripe côté serveur
   */
  const createPaymentIntent = useCallback(async () => {
    if (!orderId || orderAmount <= 0) {
      const err = new Error('Commande invalide');
      setError('Commande invalide');
      onError?.(err);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await odooClient.createStripePaymentIntent(orderId);

      if (response.success && response.client_secret && response.payment_intent_id) {
        setClientSecret(response.client_secret);
        setPaymentIntentId(response.payment_intent_id);
        logger.info('Payment Intent créé:', response.payment_intent_id);
      } else {
        throw new Error(response.error || 'Erreur création Payment Intent');
      }
    } catch (err: any) {
      const errorMessage = getUserFriendlyErrorMessage(err);
      logger.error('Erreur création Payment Intent:', err);
      setError(errorMessage);
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  }, [orderId, orderAmount, onError]);

  /**
   * Étape 2: Confirmer le paiement avec Stripe et finaliser la commande
   */
  const confirmPayment = useCallback(
    async (cardholderName: string) => {
      if (!stripe || !elements) {
        throw new Error('Stripe non initialisé');
      }

      if (!clientSecret || !paymentIntentId) {
        throw new Error('Payment Intent non créé');
      }

      if (!cardholderName.trim()) {
        setError('Veuillez entrer le nom du titulaire de la carte');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) {
          throw new Error('Élément de carte non trouvé');
        }

        // Confirmer le paiement avec Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardNumberElement,
              billing_details: {
                name: cardholderName,
              },
            },
          }
        );

        if (stripeError) {
          throw new Error(stripeError.message || 'Erreur paiement Stripe');
        }

        if (!paymentIntent || paymentIntent.status !== 'succeeded') {
          throw new Error('Le paiement n\'a pas abouti');
        }

        logger.info('Paiement Stripe confirmé:', paymentIntent.id);

        // Confirmer la commande côté serveur Odoo
        const confirmResponse = await odooClient.confirmStripePayment(
          paymentIntent.id,
          orderId
        );

        if (confirmResponse.success && confirmResponse.order) {
          logger.info('Commande Odoo confirmée:', confirmResponse.order.name);
          onSuccess?.(orderId);
        } else {
          throw new Error(confirmResponse.error || 'Erreur confirmation commande');
        }
      } catch (err: any) {
        const errorMessage = getUserFriendlyErrorMessage(err);
        logger.error('Erreur confirmation paiement:', err);
        setError(errorMessage);
        onError?.(err);
      } finally {
        setIsProcessing(false);
      }
    },
    [stripe, elements, clientSecret, paymentIntentId, orderId, onSuccess, onError]
  );

  return {
    isProcessing,
    error,
    clientSecret,
    paymentIntentId,
    createPaymentIntent,
    confirmPayment,
  };
}
