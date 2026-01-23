/**
 * Résumé de commande pour le checkout
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils/formatting';

export function OrderSummary() {
  const { cart } = useCartStore();

  if (!cart || cart.lines.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4">Résumé de la commande</h2>

      {/* Articles */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {cart.lines.map((line) => (
          <div key={line.id} className="flex gap-3">
            {/* Image */}
            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
              <Image
                src={line.image_url}
                alt={line.product_name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                {line.product_name}
              </h3>
              <p className="text-sm text-gray-600">Qté: {line.quantity}</p>
            </div>

            {/* Prix */}
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatPrice(line.price_total, cart.currency.symbol)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totaux */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total ({cart.item_count} articles)</span>
          <span>{formatPrice(cart.amount_untaxed, cart.currency.symbol)}</span>
        </div>

        {cart.amount_tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>TVA</span>
            <span>{formatPrice(cart.amount_tax, cart.currency.symbol)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Livraison</span>
          <span className="text-primary font-medium">
            {cart.delivery_amount ? formatPrice(cart.delivery_amount, cart.currency.symbol) : 'À calculer'}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="border-t mt-4 pt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(cart.amount_total + (cart.delivery_amount || 0), cart.currency.symbol)}
          </span>
        </div>
      </div>

      {/* Infos rassurantes */}
      <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Paiement 100% sécurisé</span>
        </div>
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Livraison gratuite dès 200 TND</span>
        </div>
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Retour gratuit sous 14 jours</span>
        </div>
      </div>
    </div>
  );
}
