/**
 * Page panier - Style lesportif.com.tn
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils/formatting';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/Loading';

export default function CartPage() {
  const router = useRouter();
  const { cart, fetchCart, updateQuantity, removeItem, clearCart, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (lineId: number, quantity: number) => {
    if (quantity < 1) {
      await removeItem(lineId);
    } else {
      await updateQuantity(lineId, quantity);
    }
  };

  const handleRemoveItem = async (lineId: number) => {
    if (confirm('Voulez-vous vraiment retirer cet article ?')) {
      await removeItem(lineId);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Voulez-vous vraiment vider votre panier ?')) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (isLoading && !cart) {
    return <LoadingSpinner />;
  }

  const isEmpty = !cart || cart.lines.length === 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-600 hover:text-[#01613a] transition-colors">
            Accueil
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Panier</span>
        </nav>

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon panier</h1>
          {!isEmpty && (
            <p className="text-gray-600">
              {cart.item_count} article{cart.item_count > 1 && 's'} dans votre panier
            </p>
          )}
        </div>

        {isEmpty ? (
          /* Panier vide */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Votre panier est vide
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Découvrez nos produits de sport et commencez vos achats
              </p>
              <Link href="/products">
                <button className="bg-[#01613a] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#024d2e] transition-all shadow-xl hover:shadow-2xl hover:scale-105 inline-flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Découvrir nos produits
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Liste articles */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-gray-50">
                  <span className="font-bold text-lg text-gray-900">
                    {cart.line_count} article{cart.line_count > 1 && 's'}
                  </span>
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Vider le panier
                  </button>
                </div>

                {/* Articles */}
                <div className="divide-y divide-gray-100">
                  {cart.lines.map((line) => (
                    <div key={line.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-6">
                        {/* Image */}
                        <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-md">
                          <Image
                            src={line.image_url}
                            alt={line.product_name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${line.product_slug}`}
                            className="font-bold text-gray-900 hover:text-[#01613a] line-clamp-2 text-lg transition-colors block mb-2"
                          >
                            {line.product_name}
                          </Link>

                          {/* Prix unitaire */}
                          <p className="text-sm text-gray-600 mb-4">
                            Prix unitaire: <span className="font-semibold text-gray-900">{formatPrice(line.price_unit, cart.currency.symbol)}</span>
                          </p>

                          {/* Quantité */}
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-gray-700">Quantité:</label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(line.id, line.quantity - 1)}
                                disabled={isLoading}
                                className="w-9 h-9 border-2 border-gray-300 rounded-lg hover:border-[#01613a] hover:bg-[#01613a] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-all"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(line.id, parseInt(e.target.value) || 1)
                                }
                                disabled={isLoading}
                                className="w-20 text-center border-2 border-gray-300 rounded-lg py-2 font-bold focus:outline-none focus:border-[#01613a] focus:ring-2 focus:ring-[#01613a]/20"
                                min="1"
                              />
                              <button
                                onClick={() => handleQuantityChange(line.id, line.quantity + 1)}
                                disabled={isLoading}
                                className="w-9 h-9 border-2 border-gray-300 rounded-lg hover:border-[#01613a] hover:bg-[#01613a] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Prix et actions */}
                        <div className="text-right flex flex-col justify-between items-end">
                          <button
                            onClick={() => handleRemoveItem(line.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 p-2 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>

                          <div>
                            <p className="text-2xl font-bold text-[#01613a]">
                              {formatPrice(line.price_total, cart.currency.symbol)}
                            </p>
                            {line.discount > 0 && (
                              <p className="text-sm text-red-600 font-semibold mt-1">
                                -{line.discount}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continuer shopping */}
              <Link href="/products">
                <button className="text-[#01613a] font-semibold hover:gap-3 transition-all inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Continuer mes achats
                </button>
              </Link>
            </div>

            {/* Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-4">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Récapitulatif</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Sous-total ({cart.item_count} articles)</span>
                    <span className="font-bold text-gray-900">{formatPrice(cart.amount_untaxed, cart.currency.symbol)}</span>
                  </div>

                  {cart.amount_tax > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="font-medium">TVA</span>
                      <span className="font-bold text-gray-900">{formatPrice(cart.amount_tax, cart.currency.symbol)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Livraison</span>
                    <span className="text-[#01613a] font-bold text-sm">Calculée au checkout</span>
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-5 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-[#01613a]">
                      {formatPrice(cart.amount_total, cart.currency.symbol)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#01613a] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#024d2e] transition-all shadow-xl hover:shadow-2xl hover:scale-105 mb-4 flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Passer la commande
                </button>

                {!isAuthenticated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                    <p className="text-xs text-center text-amber-800 font-medium flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Connexion requise pour finaliser
                    </p>
                  </div>
                )}

                {/* Infos rassurantes */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
                  <h3 className="font-bold text-sm text-gray-900 mb-4">Nos garanties</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#01613a] rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Paiement sécurisé</p>
                        <p className="text-xs text-gray-600">SSL & cryptage</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#01613a] rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Livraison gratuite</p>
                        <p className="text-xs text-gray-600">Dès 200 TND d'achat</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#01613a] rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Retour gratuit</p>
                        <p className="text-xs text-gray-600">14 jours pour changer d'avis</p>
                      </div>
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
