'use client';

import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, StripeCardElementOptions } from '@stripe/stripe-js';
import { Button } from '@/components/common';

// Initialiser Stripe (remplacer par votre clé publique)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

interface StripePaymentFormContentProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: Error) => void;
  onBack: () => void;
  orderAmount: number;
}

function StripePaymentFormContent({
  onSuccess,
  onError,
  onBack,
  orderAmount,
}: StripePaymentFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage('Veuillez entrer le nom du titulaire de la carte');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Élément de carte non trouvé');
      }

      // Créer un Payment Method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la création du moyen de paiement');
      }

      if (paymentMethod) {
        // Appeler le callback de succès avec l'ID du Payment Method
        onSuccess(paymentMethod.id);
      }
    } catch (error: any) {
      console.error('Erreur paiement Stripe:', error);
      setErrorMessage(error.message || 'Une erreur est survenue');
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="cardholder-name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Nom du titulaire de la carte
        </label>
        <input
          id="cardholder-name"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Nom complet"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          disabled={isProcessing}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Informations de carte
        </label>
        <div className="px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-red-900">
              <p className="font-semibold mb-1">Erreur de paiement</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">Paiement 100% sécurisé</p>
            <p>
              Vos informations de carte sont traitées de manière sécurisée par Stripe. Nous ne
              stockons jamais vos données bancaires.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          ← Retour
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe || isProcessing}
          isLoading={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Traitement...' : `Payer ${orderAmount.toFixed(2)} €`}
        </Button>
      </div>
    </form>
  );
}

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: Error) => void;
  onBack: () => void;
  orderAmount: number;
}

export function StripePaymentForm({
  onSuccess,
  onError,
  onBack,
  orderAmount,
}: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentFormContent
        onSuccess={onSuccess}
        onError={onError}
        onBack={onBack}
        orderAmount={orderAmount}
      />
    </Elements>
  );
}

export default StripePaymentForm;
