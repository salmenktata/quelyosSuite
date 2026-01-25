'use client';

import React from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { LoadingSpinner } from '@/components/common/Loading';

const OrderSummary: React.FC = () => {
  const { cart, isLoading } = useCartStore();

  if (isLoading || !cart) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Résumé de la commande
      </h2>

      {/* Products List */}
      <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
        {cart.lines.map((line) => (
          <div key={line.id} className="flex gap-3">
            <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0">
              {line.product_image && (
                <Image
                  src={line.product_image}
                  alt={line.product_name || 'Produit'}
                  fill
                  className="object-cover rounded"
                  sizes="64px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {line.product_name}
              </p>
              <p className="text-xs text-gray-500">
                Qté: {line.quantity}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {(line.price_subtotal || line.subtotal || 0).toFixed(2)} {line.currency_symbol || '€'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-700">
          <span>Sous-total</span>
          <span className="font-medium">
            {(cart.amount_untaxed || cart.subtotal || 0).toFixed(2)} {cart.currency?.symbol || '€'}
          </span>
        </div>

        <div className="flex justify-between text-gray-700">
          <span>TVA</span>
          <span className="font-medium">
            {(cart.amount_tax || cart.tax_total || 0).toFixed(2)} {cart.currency?.symbol || '€'}
          </span>
        </div>

        <div className="flex justify-between text-gray-700">
          <span>Livraison</span>
          <span className="font-medium text-green-600">Gratuite</span>
        </div>

        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-primary">
              {(cart.amount_total || cart.total || 0).toFixed(2)} {cart.currency?.symbol || '€'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span>Paiement 100% sécurisé</span>
        </div>
      </div>
    </div>
  );
};

export { OrderSummary };
export default OrderSummary;
