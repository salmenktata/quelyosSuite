'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Badge } from '@/components/common';
import { useCartStore } from '@/store/cartStore';
import { logger } from '@/lib/logger';

interface CartSummaryProps {
  cart: {
    amount_untaxed: number;
    amount_tax: number;
    amount_total: number;
    currency: {
      symbol: string;
    };
    coupon_code?: string;
    coupon_discount?: number;
  } | null;
  showCheckoutButton?: boolean;
  compact?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  showCheckoutButton = true,
  compact = false
}) => {
  const router = useRouter();
  const { isLoading, removeCoupon } = useCartStore();

  if (!cart) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="text-center text-gray-500">Votre panier est vide</p>
      </div>
    );
  }

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch (error) {
      logger.error('Failed to remove coupon:', error);
    }
  };

  return (
    <div className={`bg-gray-50 ${compact ? 'p-4' : 'p-6'} rounded-lg`}>
      <h3 className={`font-bold text-gray-900 mb-4 ${compact ? 'text-base' : 'text-lg'}`}>
        Récapitulatif
      </h3>

      {/* Summary Lines */}
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-700">
          <span>Sous-total</span>
          <span className="font-medium">
            {cart.amount_untaxed.toFixed(2)} {cart.currency.symbol}
          </span>
        </div>

        {/* Coupon Discount */}
        {cart.coupon_code && cart.coupon_discount && (
          <div className="flex justify-between items-center text-green-700">
            <div className="flex items-center gap-2">
              <span>Coupon</span>
              <Badge variant="success">{cart.coupon_code}</Badge>
              <button
                onClick={handleRemoveCoupon}
                className="text-xs text-red-600 hover:text-red-800"
                aria-label="Retirer le coupon"
              >
                ✕
              </button>
            </div>
            <span className="font-medium">
              -{cart.coupon_discount.toFixed(2)} {cart.currency.symbol}
            </span>
          </div>
        )}

        {/* Taxes */}
        <div className="flex justify-between text-gray-700">
          <span>TVA</span>
          <span className="font-medium">
            {cart.amount_tax.toFixed(2)} {cart.currency.symbol}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-gray-700">
          <span>Livraison</span>
          <span className="font-medium text-green-600">
            Gratuite
          </span>
        </div>

        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between items-center">
            <span className={`font-bold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              Total
            </span>
            <span className={`font-bold text-primary ${compact ? 'text-lg' : 'text-2xl'}`}>
              {cart.amount_total.toFixed(2)} {cart.currency.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      {showCheckoutButton && (
        <div className="mt-6">
          <Button
            variant="primary"
            size={compact ? 'md' : 'lg'}
            fullWidth
            onClick={handleCheckout}
            disabled={isLoading}
            isLoading={isLoading}
          >
            Procéder au paiement
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Paiement sécurisé • Livraison gratuite dès 100€
          </p>
        </div>
      )}

      {/* Trust Badges */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center justify-around text-xs text-gray-600">
            <div className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Paiement<br/>sécurisé</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Livraison<br/>rapide</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Retours<br/>gratuits</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSummary;
