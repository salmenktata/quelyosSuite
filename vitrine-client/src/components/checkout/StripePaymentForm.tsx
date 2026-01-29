'use client';

import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  loadStripe,
  StripeElementStyleVariant,
  StripeCardNumberElementChangeEvent,
  StripeCardExpiryElementChangeEvent,
  StripeCardCvcElementChangeEvent,
} from '@stripe/stripe-js';
import { Button } from '@/components/common';
import { useStripePayment } from '@/hooks/useStripePayment';

// Initialiser Stripe (remplacer par votre clé publique)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Options de style modernes pour les champs Stripe
const STRIPE_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1f2937',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      fontWeight: '400',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#6b7280',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
    complete: {
      iconColor: '#10b981',
    },
  },
} as const;

interface StripePaymentFormContentProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: Error) => void;
  onBack: () => void;
  orderAmount: number;
  orderId: number;
}

function StripePaymentFormContent({
  onSuccess,
  onError,
  onBack,
  orderAmount,
  orderId,
}: StripePaymentFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [cardBrand, setCardBrand] = useState<string>('unknown');
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);

  // Utiliser le hook Stripe Payment
  const {
    isProcessing,
    error: paymentError,
    clientSecret,
    createPaymentIntent,
    confirmPayment,
  } = useStripePayment({
    orderId,
    orderAmount,
    onSuccess: () => {
      onSuccess('stripe'); // Appeler le callback parent avec succès
    },
    onError: (error) => {
      onError(error); // Propager l'erreur au parent
    },
  });

  const errorMessage = paymentError;

  // Créer le Payment Intent au montage du composant
  useEffect(() => {
    if (orderId && orderAmount > 0) {
      createPaymentIntent();
    }
  }, [orderId, orderAmount, createPaymentIntent]);

  const handleCardNumberChange = (event: StripeCardNumberElementChangeEvent) => {
    setCardBrand(event.brand);
    setCardNumberComplete(event.complete);
    // Les erreurs de validation Stripe sont gérées par le hook useStripePayment
  };

  const handleCardExpiryChange = (event: StripeCardExpiryElementChangeEvent) => {
    setCardExpiryComplete(event.complete);
  };

  const handleCardCvcChange = (event: StripeCardCvcElementChangeEvent) => {
    setCardCvcComplete(event.complete);
  };

  const isFormValid = () => {
    return (
      cardholderName.trim() !== '' &&
      cardNumberComplete &&
      cardExpiryComplete &&
      cardCvcComplete
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardholderName.trim()) {
      return;
    }

    if (!isFormValid()) {
      return;
    }

    if (!clientSecret) {
      // Payment Intent pas encore créé, attendre
      return;
    }

    // Utiliser le hook pour confirmer le paiement
    await confirmPayment(cardholderName);
  };

  // Logos cartes bancaires selon le type détecté
  const getCardLogo = () => {
    const logos = {
      visa: (
        <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
          <rect width="48" height="32" rx="4" fill="#1434CB"/>
          <path d="M17.412 19.562l1.313-8.165h2.1l-1.313 8.165h-2.1zm9.637-8.012c-.412-.165-.85-.264-1.7-.264-1.875 0-3.188.988-3.2 2.4-.013 1.05.938 1.625 1.65 1.975.725.363.975.6.975.925-.013.5-.6.725-1.15.725-.762 0-1.175-.112-1.8-.375l-.25-.113-.263 1.613c.488.225 1.388.412 2.325.425 2 0 3.288-.975 3.3-2.488.013-.825-.488-1.462-1.563-1.987-.65-.338-.85-.562-.85-.9 0-.3.338-.613.85-.613.488-.013.85.1 1.125.213l.138.063.263-1.6zm4.925-1.5c-.375 0-.65.112-.8.5l-2.838 6.75h2l.4-1.125h2.45l.225 1.125h1.762l-1.537-7.25h-1.662zm.288 2.025l.563 2.7h-1.588l1.025-2.7zM12.35 11.4l-1.95 5.562-.212-1.087c-.362-1.25-1.5-2.6-2.775-3.275l1.875 6.962h2.013l3-8.162H12.35z" fill="white"/>
          <path d="M9.412 11.4H5.85l-.025.15c2.388.6 3.975 2.05 4.625 3.8l-.663-3.325c-.113-.45-.438-.612-.813-.625z" fill="#F7A600"/>
        </svg>
      ),
      mastercard: (
        <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
          <rect width="48" height="32" rx="4" fill="#0B1F35"/>
          <circle cx="18" cy="16" r="7" fill="#EB001B"/>
          <circle cx="30" cy="16" r="7" fill="#F79E1B"/>
          <path d="M24 21.5c1.657-1.376 2.5-3.38 2.5-5.5s-.843-4.124-2.5-5.5C22.343 11.876 21.5 13.88 21.5 16s.843 4.124 2.5 5.5z" fill="#FF5F00"/>
        </svg>
      ),
      amex: (
        <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
          <rect width="48" height="32" rx="4" fill="#006FCF"/>
          <path d="M9 12h2.5l.625 1.5L12.75 12H15l-1.875 4L15 20h-2.5l-.625-1.5L11.25 20H9l1.875-4L9 12z" fill="white"/>
        </svg>
      ),
      discover: (
        <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
          <rect width="48" height="32" rx="4" fill="#FF6000"/>
        </svg>
      ),
      unknown: (
        <div className="h-8 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          CARD
        </div>
      ),
    };
    return logos[cardBrand as keyof typeof logos] || logos.unknown;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom du titulaire */}
      <div>
        <label
          htmlFor="cardholder-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nom du titulaire de la carte *
        </label>
        <input
          id="cardholder-name"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Jean Dupont"
          required
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
          disabled={isProcessing}
        />
      </div>

      {/* Informations de carte */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Informations de carte *
          </label>
          {getCardLogo()}
        </div>

        <div className="space-y-3">
          {/* Numéro de carte */}
          <div className="relative">
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <CardNumberElement
                options={STRIPE_ELEMENT_OPTIONS}
                onChange={handleCardNumberChange}
              />
            </div>
          </div>

          {/* Date d'expiration et CVC */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <CardExpiryElement
                options={STRIPE_ELEMENT_OPTIONS}
                onChange={handleCardExpiryChange}
              />
            </div>
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <CardCvcElement
                options={STRIPE_ELEMENT_OPTIONS}
                onChange={handleCardCvcChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-red-900 dark:text-red-100">
              <p className="font-semibold mb-1">Erreur de paiement</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Message de sécurité */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-1">🔒 Paiement 100% sécurisé</p>
            <p>
              Vos informations sont cryptées et traitées par <strong>Stripe</strong> (norme PCI DSS Level 1).
              Nous ne stockons jamais vos données bancaires.
            </p>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
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
          disabled={!stripe || isProcessing || !isFormValid()}
          isLoading={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Traitement sécurisé...' : `🔒 Payer ${orderAmount.toFixed(2)} €`}
        </Button>
      </div>

      {/* Badges de confiance */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>SSL/TLS</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>PCI DSS Level 1</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>3D Secure</span>
        </div>
      </div>
    </form>
  );
}

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: Error) => void;
  onBack: () => void;
  orderAmount: number;
  orderId: number;
}

export function StripePaymentForm({
  onSuccess,
  onError,
  onBack,
  orderAmount,
  orderId,
}: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentFormContent
        onSuccess={onSuccess}
        onError={onError}
        onBack={onBack}
        orderAmount={orderAmount}
        orderId={orderId}
      />
    </Elements>
  );
}

export default StripePaymentForm;
