/**
 * Page de confirmation de commande
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [orderNumber] = useState(() => Math.floor(Math.random() * 1000000));

  useEffect(() => {
    // Vider le panier après confirmation
    clearCart();
  }, [clearCart]);

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Succès */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {/* Icône succès */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Titre */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Commande confirmée !
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-8">
              Merci pour votre commande. Nous avons bien reçu votre demande et nous la traitons dans les plus brefs délais.
            </p>

            {/* Numéro de commande (simulé) */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Numéro de commande</p>
              <p className="text-2xl font-bold text-primary">
                #{orderNumber}
              </p>
            </div>

            {/* Informations */}
            <div className="text-left space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Confirmation par email</p>
                  <p className="text-sm text-gray-600">
                    Un email de confirmation a été envoyé à votre adresse
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Suivi de commande</p>
                  <p className="text-sm text-gray-600">
                    Vous pouvez suivre votre commande dans votre espace client
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Livraison estimée</p>
                  <p className="text-sm text-gray-600">
                    Votre commande sera livrée sous 3 à 5 jours ouvrés
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/account/orders" className="flex-1">
                <Button variant="primary" size="lg" className="w-full rounded-full">
                  Voir mes commandes
                </Button>
              </Link>
              <Link href="/products" className="flex-1">
                <Button variant="outline" size="lg" className="w-full rounded-full">
                  Continuer mes achats
                </Button>
              </Link>
            </div>
          </div>

          {/* Avantages */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Que se passe-t-il ensuite ?</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Préparation</p>
                  <p className="text-sm text-gray-600">
                    Nous préparons votre commande avec soin
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Expédition</p>
                  <p className="text-sm text-gray-600">
                    Votre colis est confié à notre transporteur
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Livraison</p>
                  <p className="text-sm text-gray-600">
                    Vous recevez votre commande à l&apos;adresse indiquée
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
