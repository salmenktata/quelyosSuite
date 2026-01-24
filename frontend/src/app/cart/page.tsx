'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/common';
import { LoadingSpinner } from '@/components/common/Loading';
import { CartItem, CartSummary } from '@/components/cart';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function CartPage() {
  const router = useRouter();
  const { cart, isLoading, error, fetchCart, clearCart, applyCoupon } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [couponCode, setCouponCode] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = React.useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleClearCart = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      await clearCart();
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const result = await applyCoupon(couponCode.trim());
      if (result.success) {
        setCouponSuccess('Coupon appliqué avec succès!');
        setCouponCode('');
        setTimeout(() => setCouponSuccess(null), 3000);
      } else {
        setCouponError(result.message || 'Coupon invalide');
      }
    } catch (err) {
      setCouponError('Erreur lors de l\'application du coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const itemCount = cart?.item_count || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <nav className="text-sm mb-6 text-gray-600">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Panier</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Mon Panier
            {itemCount > 0 && (
              <span className="ml-3 text-xl text-gray-500">({itemCount} article{itemCount > 1 ? 's' : ''})</span>
            )}
          </h1>

          {itemCount > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
            >
              Vider le panier
            </button>
          )}
        </div>

        {isLoading && !cart && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={fetchCart}>Réessayer</Button>
          </div>
        )}

        {!isLoading && !error && itemCount === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-32 h-32 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Votre panier est vide
            </h2>
            <p className="text-gray-600 mb-8">
              Découvrez nos produits et commencez vos achats
            </p>
            <Link href="/products">
              <Button variant="primary" size="lg">
                Découvrir nos produits
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && !error && itemCount > 0 && cart && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Articles ({itemCount})
                </h2>

                <div className="space-y-4">
                  {cart.lines.map((line) => (
                    <CartItem
                      key={line.id}
                      item={line}
                      showRemove={true}
                      compact={false}
                    />
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Code promo
                  </h3>
                  <form onSubmit={handleApplyCoupon} className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Entrez votre code promo"
                        disabled={couponLoading || !!cart.coupon_code}
                        error={couponError || undefined}
                      />
                      {couponSuccess && (
                        <p className="mt-1 text-sm text-green-600">{couponSuccess}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={couponLoading || !couponCode.trim() || !!cart.coupon_code}
                      isLoading={couponLoading}
                    >
                      Appliquer
                    </Button>
                  </form>
                </div>

                <div className="mt-6">
                  <Link href="/products">
                    <Button variant="outline" fullWidth>
                      ← Continuer mes achats
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <CartSummary
                  cart={cart}
                  showCheckoutButton={false}
                  compact={false}
                />

                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleCheckout}
                    disabled={isLoading}
                  >
                    Procéder au paiement
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-xs text-center text-gray-500">
                      Vous devez être connecté pour passer commande
                    </p>
                  )}
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Vos avantages
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span>Livraison gratuite dès 100€</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span>Paiement sécurisé SSL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span>Retours gratuits sous 30 jours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span>Support client 24/7</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 mb-2">Méthodes de paiement acceptées</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                      VISA
                    </div>
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                      MC
                    </div>
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                      PP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
