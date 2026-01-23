/**
 * Page livraison - Étape 2 du checkout
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { ShippingForm, ShippingAddress } from '@/components/checkout/ShippingForm';
import { LoadingPage } from '@/components/common/Loading';

export default function CheckoutShippingPage() {
  const router = useRouter();
  const { cart, fetchCart, isLoading: cartLoading } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Redirection si non authentifié
  useEffect(() => {
    if (!cartLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout/shipping');
    }
  }, [isAuthenticated, cartLoading, router]);

  // Redirection si panier vide
  useEffect(() => {
    if (!cartLoading && cart && cart.lines.length === 0) {
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  const handleSubmit = async (data: ShippingAddress) => {
    setIsSubmitting(true);

    try {
      // Sauvegarder les informations de livraison dans le localStorage
      localStorage.setItem('checkout_shipping', JSON.stringify(data));

      // TODO: Appeler API pour mettre à jour l'adresse de livraison dans Odoo
      // await odooClient.updateShippingAddress(data);

      // Rediriger vers le paiement
      router.push('/checkout/payment');
    } catch (error) {
      console.error('Erreur mise à jour adresse:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/cart');
  };

  if (cartLoading || !cart || !isAuthenticated) {
    return <LoadingPage />;
  }

  // Pré-remplir avec les données utilisateur
  const initialData = {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  };

  // Charger les données sauvegardées si disponibles
  const savedData = typeof window !== 'undefined'
    ? localStorage.getItem('checkout_shipping')
    : null;
  const shippingData = savedData ? JSON.parse(savedData) : initialData;

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
          <span className="text-gray-900">Livraison</span>
        </nav>

        {/* Titre */}
        <h1 className="text-3xl font-bold mb-8">Informations de livraison</h1>

        {/* Stepper */}
        <CheckoutStepper currentStep={2} />

        {/* Contenu */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ShippingForm
                initialData={shippingData}
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
