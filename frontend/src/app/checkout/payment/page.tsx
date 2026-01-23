/**
 * Page paiement - Étape 3 du checkout
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentForm, PaymentMethod } from '@/components/checkout/PaymentForm';
import { LoadingPage } from '@/components/common/Loading';

// Méthodes de paiement disponibles
const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Carte bancaire',
    description: 'Visa, Mastercard, American Express',
    icon: 'card',
  },
  {
    id: 'cash_on_delivery',
    name: 'Paiement à la livraison',
    description: 'Payez en espèces lors de la réception',
    icon: 'cash',
  },
  {
    id: 'bank_transfer',
    name: 'Virement bancaire',
    description: 'Paiement par virement',
    icon: 'transfer',
  },
];

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { cart, fetchCart, isLoading: cartLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Redirection si non authentifié
  useEffect(() => {
    if (!cartLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout/payment');
    }
  }, [isAuthenticated, cartLoading, router]);

  // Redirection si panier vide
  useEffect(() => {
    if (!cartLoading && cart && cart.lines.length === 0) {
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  // Vérifier que l'adresse de livraison est remplie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shippingData = localStorage.getItem('checkout_shipping');
      if (!shippingData) {
        router.push('/checkout/shipping');
      }
    }
  }, [router]);

  const handleSubmit = async (methodId: string) => {
    setIsSubmitting(true);

    try {
      // Récupérer les données de livraison
      const shippingData = localStorage.getItem('checkout_shipping');
      if (!shippingData) {
        alert('Informations de livraison manquantes');
        router.push('/checkout/shipping');
        return;
      }

      const shipping = JSON.parse(shippingData);

      // TODO: Appeler API pour confirmer la commande
      // const result = await odooClient.confirmOrder({
      //   shipping_address: shipping,
      //   payment_method: methodId,
      // });

      // Simuler la confirmation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Nettoyer le localStorage
      localStorage.removeItem('checkout_shipping');

      // Rediriger vers la page de succès
      router.push('/checkout/success');
    } catch (error) {
      console.error('Erreur confirmation commande:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/checkout/shipping');
  };

  if (cartLoading || !cart || !isAuthenticated) {
    return <LoadingPage />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-600 hover:text-primary">
            Accueil
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/cart" className="text-gray-600 hover:text-primary">
            Panier
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/checkout/shipping" className="text-gray-600 hover:text-primary">
            Livraison
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">Paiement</span>
        </nav>

        {/* Titre */}
        <h1 className="text-3xl font-bold mb-8">Paiement</h1>

        {/* Stepper */}
        <CheckoutStepper currentStep={3} />

        {/* Contenu */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <PaymentForm
                methods={paymentMethods}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isLoading={isSubmitting}
              />
            </div>
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
