/**
 * Formulaire de paiement
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/Button';

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: 'card' | 'cash' | 'transfer';
}

interface PaymentFormProps {
  methods: PaymentMethod[];
  onSubmit: (methodId: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function PaymentForm({ methods, onSubmit, onBack, isLoading }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>(methods[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethod) {
      onSubmit(selectedMethod);
    }
  };

  const getIcon = (type: 'card' | 'cash' | 'transfer') => {
    switch (type) {
      case 'card':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        );
      case 'cash':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );
      case 'transfer':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Méthodes de paiement */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Méthode de paiement</h3>
        <div className="space-y-3">
          {methods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-primary bg-primary bg-opacity-5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-5 h-5 text-primary focus:ring-primary"
              />

              <div
                className={`${
                  selectedMethod === method.id ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {getIcon(method.icon)}
              </div>

              <div className="flex-1">
                <p className="font-semibold text-gray-900">{method.name}</p>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Informations de sécurité */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Paiement sécurisé</h4>
            <p className="text-sm text-gray-600">
              Vos informations de paiement sont cryptées et sécurisées. Nous ne stockons jamais vos informations bancaires.
            </p>
          </div>
        </div>
      </div>

      {/* Conditions générales */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">
            J'accepte les{' '}
            <a href="/terms" target="_blank" className="text-primary hover:text-primary-dark font-medium">
              conditions générales de vente
            </a>
            {' '}et confirme avoir lu la{' '}
            <a href="/privacy" target="_blank" className="text-primary hover:text-primary-dark font-medium">
              politique de confidentialité
            </a>
          </span>
        </label>
      </div>

      {/* Boutons */}
      <div className="flex gap-4 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1 rounded-full"
          >
            ← Retour
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={!selectedMethod}
          className="flex-1 rounded-full"
        >
          Confirmer la commande
        </Button>
      </div>
    </form>
  );
}
