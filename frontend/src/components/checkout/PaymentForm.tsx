'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common';
import { PayPalButton } from './PayPalButton';

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface PaymentFormProps {
  methods: PaymentMethod[];
  onSubmit: (methodId: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  orderId?: number;  // For PayPal
  orderAmount?: number;  // For PayPal
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  methods,
  onSubmit,
  onBack,
  isLoading = false,
  orderId,
  orderAmount,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>(methods[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethod) {
      onSubmit(selectedMethod);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'card':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'paypal':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.16a.804.804 0 01-.794.68H7.72a.483.483 0 01-.477-.558L9.22 8.3a.946.946 0 01.934-.8h4.776c.815 0 1.596.098 2.32.28 1.06.267 1.93.735 2.518 1.425.39.46.67 1.01.785 1.643z"/>
            <path d="M7.5 8.3c0-.177.143-.32.32-.32h5.956c.98 0 1.913.12 2.778.36 2.28.63 3.596 2.455 3.086 5.53-.51 3.076-2.916 4.93-5.795 4.93h-.906a.8.8 0 00-.79.68l-.85 5.39a.48.48 0 01-.476.4H7.32a.32.32 0 01-.316-.372L7.5 8.3z" opacity=".7"/>
          </svg>
        );
      case 'cash':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'transfer':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Choisissez votre mode de paiement
      </h2>

      <div className="space-y-3 mb-8">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="mt-1 text-primary focus:ring-ring"
            />
            <div className="ml-4 flex-1 flex items-start gap-4">
              <div className={`flex-shrink-0 text-gray-600 ${selectedMethod === method.id ? 'text-primary' : ''}`}>
                {getIcon(method.icon)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{method.name}</p>
                <p className="text-sm text-gray-600 mt-1">{method.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Paiement sécurisé</p>
            <p>Toutes les transactions sont cryptées et sécurisées. Vos données bancaires ne sont jamais stockées sur nos serveurs.</p>
          </div>
        </div>
      </div>

      {/* PayPal Button (if PayPal is selected) */}
      {selectedMethod === 'paypal' && orderId && orderAmount ? (
        <div className="space-y-4">
          <PayPalButton
            orderId={orderId}
            amount={orderAmount}
            onSuccess={(transactionId) => {
              console.log('PayPal payment successful:', transactionId);
              onSubmit('paypal');
            }}
            onError={(error) => {
              console.error('PayPal payment error:', error);
              alert(`Erreur PayPal: ${error.message}`);
            }}
            onCancel={() => {
              console.log('PayPal payment cancelled');
            }}
          />

          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="w-full"
          >
            ← Retour
          </Button>
        </div>
      ) : (
        /* Actions for other payment methods */
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            ← Retour
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedMethod || isLoading}
            isLoading={isLoading}
            className="flex-1"
          >
            Confirmer la commande
          </Button>
        </div>
      )}
    </form>
  );
};

export { PaymentForm };
export default PaymentForm;
