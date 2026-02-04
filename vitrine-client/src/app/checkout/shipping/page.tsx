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
import { DeliverySelector } from '@/components/checkout/DeliverySelector';
import { LoadingPage } from '@/components/common/Loading';
import { logger } from '@/lib/logger';

export default function CheckoutShippingPage() {
  const router = useRouter();
  const { cart, fetchCart, isLoading: cartLoading } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null);
  const [selectedZoneCode, setSelectedZoneCode] = useState<string | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState<number>(0);

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
    // Vérifier qu'une méthode de livraison a été sélectionnée
    if (!selectedCarrierId || !selectedZoneCode) {
      alert('Veuillez sélectionner une méthode de livraison');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sauvegarder les informations de livraison dans le localStorage
      localStorage.setItem('checkout_shipping', JSON.stringify(data));
      localStorage.setItem('checkout_delivery', JSON.stringify({
        carrier_id: selectedCarrierId,
        zone_code: selectedZoneCode,
        price: deliveryPrice,
      }));

      // Rediriger vers le paiement
      router.push('/checkout/payment');
    } catch (error) {
      logger.error('Erreur mise à jour adresse:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliverySelect = (carrierId: number, zoneCode: string, price: number) => {
    setSelectedCarrierId(carrierId);
    setSelectedZoneCode(zoneCode);
    setDeliveryPrice(price);
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Adresse de livraison</h2>
              <ShippingForm
                initialData={shippingData}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isLoading={isSubmitting}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Méthode de livraison</h2>
              <DeliverySelector
                orderAmount={cart?.total || 0}
                onSelect={handleDeliverySelect}
                selectedCarrierId={selectedCarrierId}
                selectedZoneCode={selectedZoneCode}
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
