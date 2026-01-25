'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { odooClient } from '@/lib/odoo/client';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/common';
import { logger } from '@/lib/logger';

/**
 * Cart Recovery Content Component
 */
function CartRecoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { fetchCart } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    products_restored: number;
    coupon_applied: boolean;
    coupon_code?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Lien de récupération invalide');
      setLoading(false);
      return;
    }

    recoverCart();
  }, [token]);

  const recoverCart = async () => {
    if (!token) {
      setError('Token invalide');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await odooClient.recoverCart(token);

      if (response.success && response.data) {
        setSuccess(true);
        setRecoveryData({
          products_restored: response.data.products_restored,
          coupon_applied: response.data.coupon_applied,
          coupon_code: response.data.coupon_code,
          message: response.data.message,
        });

        // Refresh cart in store
        await fetchCart();
      } else {
        setError(response.message || 'Échec de la récupération du panier');
      }
    } catch (err: any) {
      logger.error('Error recovering cart:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-gray-600">Récupération de votre panier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-lg">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="mb-2 text-2xl font-bold text-red-900">Lien invalide ou expiré</h1>
            <p className="mb-6 text-red-800">{error}</p>
            <div className="flex justify-center gap-3">
              <Link href="/">
                <Button variant="outline">Retour à l'accueil</Button>
              </Link>
              <Link href="/products">
                <Button variant="primary">Voir nos produits</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success && recoveryData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Success Message */}
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-8 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="mb-2 text-3xl font-bold text-green-900">Panier récupéré !</h1>
            <p className="text-lg text-green-800">{recoveryData.message}</p>
          </div>

          {/* Coupon Info */}
          {recoveryData.coupon_applied && recoveryData.coupon_code && (
            <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white shadow-lg">
              <div className="text-center">
                <p className="mb-2 text-lg font-semibold">🎁 Bonus de bienvenue !</p>
                <p className="mb-4 text-sm">
                  Un code promo de <strong>10% de réduction</strong> a été appliqué à votre panier
                </p>
                <div className="rounded-lg border-2 border-dashed border-white bg-white/20 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wider">Code Promo Appliqué</p>
                  <p className="text-2xl font-bold tracking-widest">{recoveryData.coupon_code}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cart Summary */}
          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Récapitulatif</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center justify-between">
                <span>Produits restaurés</span>
                <span className="font-semibold text-primary">{recoveryData.products_restored}</span>
              </div>
              {recoveryData.coupon_applied && (
                <div className="flex items-center justify-between">
                  <span>Réduction appliquée</span>
                  <span className="font-semibold text-green-600">10%</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link href="/cart" className="block">
              <Button variant="primary" className="w-full text-lg">
                Voir mon panier 🛒
              </Button>
            </Link>

            <div className="flex gap-3">
              <Link href="/products" className="flex-1">
                <Button variant="outline" className="w-full">
                  Continuer mes achats
                </Button>
              </Link>
              <Link href="/checkout" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Passer commande
                </Button>
              </Link>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-8 rounded-lg border bg-gray-50 p-6">
            <h3 className="mb-4 text-center font-semibold text-gray-900">
              Pourquoi commander maintenant ?
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚚</span>
                <span className="text-sm text-gray-700">Livraison rapide</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <span className="text-sm text-gray-700">Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">↩️</span>
                <span className="text-sm text-gray-700">Retours gratuits</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <span className="text-sm text-gray-700">Support 7j/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function RecoverLoading() {
  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-lg text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

/**
 * Cart Recovery Page
 * Restores abandoned cart from recovery email link
 */
export default function CartRecoverPage() {
  return (
    <Suspense fallback={<RecoverLoading />}>
      <CartRecoverContent />
    </Suspense>
  );
}
