'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common';
import { useInitPayment } from '@/hooks/usePaymentProviders';
import { logger } from '@/lib/logger';

interface TunisianPaymentGatewayProps {
  providerId: number;
  providerCode: 'flouci' | 'konnect';
  providerName: string;
  orderAmount: number;
  orderId: number;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  onBack: () => void;
}

export const TunisianPaymentGateway: React.FC<TunisianPaymentGatewayProps> = ({
  providerId,
  providerCode,
  providerName,
  orderAmount,
  orderId,
  customerData,
  onBack,
}) => {
  const initPaymentMutation = useInitPayment();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePayment = async () => {
    setIsRedirecting(true);

    try {
      // Get current origin for return URL
      const returnUrl = `${window.location.origin}/checkout/payment/return`;

      const response = await initPaymentMutation.mutateAsync({
        provider_id: providerId,
        amount: orderAmount,
        currency_code: 'TND',
        order_reference: `ORDER-${orderId}`,
        customer_data: customerData,
        return_url: returnUrl,
      });

      if (response.success && response.paymentUrl) {
        logger.debug(`Redirecting to ${providerName} payment gateway`, {
          transactionRef: response.transactionRef,
          paymentUrl: response.paymentUrl,
        });

        // Redirect to payment gateway
        window.location.href = response.paymentUrl;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      logger.error(`Failed to initialize ${providerName} payment:`, error);
      setIsRedirecting(false);
      alert(`Erreur lors de l&apos;initialisation du paiement: ${error}`);
    }
  };

  const getProviderLogo = () => {
    switch (providerCode) {
      case 'flouci':
        return '📱';
      case 'konnect':
        return '🔗';
      default:
        return '💳';
    }
  };

  const getProviderDescription = () => {
    switch (providerCode) {
      case 'flouci':
        return 'Vous allez être redirigé vers la plateforme Flouci pour finaliser votre paiement en toute sécurité.';
      case 'konnect':
        return 'Vous allez être redirigé vers Konnect pour choisir votre méthode de paiement (wallet, carte bancaire, D17).';
      default:
        return 'Vous allez être redirigé vers la plateforme de paiement sécurisée.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Info Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{getProviderLogo()}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Paiement via {providerName}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {getProviderDescription()}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Montant total :</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {orderAmount.toFixed(3)} DT
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Commande :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ORDER-{orderId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-green-900 dark:text-green-300">
            <p className="font-semibold mb-1">Paiement 100% sécurisé</p>
            <p>
              Vos informations bancaires sont protégées par {providerName} et ne sont jamais
              partagées avec notre site.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Steps */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Étapes du paiement :
        </h4>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Cliquez sur &quot;Procéder au paiement&quot; ci-dessous
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Vous serez redirigé vers la plateforme {providerName}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Complétez votre paiement sur leur interface sécurisée
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Vous serez automatiquement redirigé vers notre site après le paiement
            </span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isRedirecting}
          className="flex-1"
        >
          ← Retour
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handlePayment}
          disabled={isRedirecting}
          isLoading={isRedirecting}
          className="flex-1"
        >
          {isRedirecting ? 'Redirection en cours...' : `Procéder au paiement via ${providerName}`}
        </Button>
      </div>
    </div>
  );
};
