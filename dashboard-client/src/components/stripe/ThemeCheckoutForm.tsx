/**
 * Formulaire paiement Stripe pour achat thème premium
 *
 * Utilise Stripe Elements pour sécurité PCI DSS
 * Flow : createPaymentIntent → formulaire → confirmPayment → webhook
 */

import { useState } from 'react';
// @ts-expect-error - Package @stripe/react-stripe-js sera installé après résolution npm
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/common';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { logger } from '@quelyos/logger';

interface ThemeCheckoutFormProps {
  themeId: number;
  themeName: string;
  price: number;
  currency: string;
  tenantId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
  hidePostalCode: false,
};

export function ThemeCheckoutForm({
  themeId,
  themeName,
  price,
  currency,
  tenantId,
  onSuccess,
  onCancel,
}: ThemeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Étape 1 : Créer Payment Intent
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/themes/${themeId}/stripe/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              theme_id: themeId,
              tenant_id: tenantId,
            },
            id: 1,
          }),
        }
      );

      const data = await response.json();

      if (data.error || !data.result?.success) {
        throw new Error(data.error?.message || data.result?.error || 'Failed to create payment');
      }

      const { client_secret } = data.result;

      // Étape 2 : Confirmer paiement avec Stripe Elements
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // Paiement réussi ! Le webhook Stripe va gérer la confirmation côté serveur
        onSuccess();
      } else {
        throw new Error('Payment status: ' + (paymentIntent?.status || 'unknown'));
      }
    } catch (err) {
      logger.error('[ThemeCheckoutForm] Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Résumé commande */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white dark:text-gray-300 mb-2">
          Récapitulatif
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-900 dark:text-white">{themeName}</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            ${price.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      {/* Formulaire carte */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
          <CreditCard className="inline h-4 w-4 mr-2" />
          Informations carte bancaire
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
          <CardElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange} />
        </div>
      </div>

      {/* Badges sécurité */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center">
          <Lock className="h-4 w-4 mr-1" />
          <span>Paiement sécurisé</span>
        </div>
        <div>
          <span className="font-semibold">SSL/TLS</span>
        </div>
        <div>
          <span className="font-semibold">PCI DSS Level 1</span>
        </div>
      </div>

      {/* Message erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Erreur de paiement
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Boutons action */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !cardComplete || processing}
          className="min-w-[150px]"
        >
          {processing ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Traitement...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Payer ${price.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      {/* Info aucune donnée stockée */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-500">
        Vos informations bancaires ne sont jamais stockées sur nos serveurs.
        <br />
        Le paiement est traité de manière sécurisée par Stripe.
      </p>
    </form>
  );
}
