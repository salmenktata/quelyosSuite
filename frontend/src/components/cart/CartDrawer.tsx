'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/common';
import { LoadingSpinner } from '@/components/common/Loading';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import { useCartStore } from '@/store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, isLoading, error, fetchCart, clearCart } = useCartStore();

  // Fetch cart when drawer opens
  useEffect(() => {
    if (isOpen && !cart) {
      fetchCart();
    }
  }, [isOpen, cart, fetchCart]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClearCart = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  const itemCount = cart?.item_count || 0;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[400px] md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 id="cart-drawer-title" className="text-xl font-bold text-gray-900">
            Panier ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer le panier"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100vh-80px)]">
          {/* Loading State */}
          {isLoading && !cart && (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
              <p className="text-red-800 text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCart()}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          )}

          {/* Empty Cart */}
          {!isLoading && !error && itemCount === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Votre panier est vide
              </h3>
              <p className="text-gray-600 mb-6">
                Découvrez nos produits et ajoutez-les à votre panier
              </p>
              <Link href="/products" onClick={onClose}>
                <Button variant="primary">
                  Découvrir nos produits
                </Button>
              </Link>
            </div>
          )}

          {/* Cart Items */}
          {!isLoading && !error && itemCount > 0 && cart && (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {cart.lines.map((line) => (
                    <CartItem key={line.id} item={line} compact />
                  ))}
                </div>

                {/* Clear Cart Button */}
                {itemCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleClearCart}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Vider le panier
                    </button>
                  </div>
                )}
              </div>

              {/* Summary Footer */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <CartSummary cart={cart} showCheckoutButton={true} compact />

                <div className="mt-4">
                  <Link href="/cart" onClick={onClose}>
                    <Button variant="outline" fullWidth>
                      Voir le panier complet
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
