'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { backendClient } from '@/lib/backend/client';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common';
import { logger } from '@/lib/logger';
import type { DeliveryMethod } from '@/types/api';

interface ShippingAddress {
  name: string;
  street: string;
  street2?: string;
  city: string;
  zip: string;
  country_id?: number;
  state_id?: number;
  phone: string;
  email: string;
}

/**
 * One-Page Checkout Component
 * All checkout steps in a single page with collapsible sections
 * Features:
 * - Shipping address form
 * - Delivery method selection
 * - Payment method selection
 * - Order summary (sticky sidebar)
 * - Single submit for entire checkout
 */
export function OnePageCheckout() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { user } = useAuthStore();

  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: user?.name || '',
    street: '',
    street2: '',
    city: '',
    zip: '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<string>('stripe');
  const [notes, setNotes] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    shipping: true,
    delivery: false,
    payment: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDeliveryMethods();
  }, []);

  const loadDeliveryMethods = async () => {
    try {
      const response = await backendClient.getDeliveryMethods();

      if (response.success && response.data?.delivery_methods) {
        setDeliveryMethods(response.data.delivery_methods);
        if (response.data.delivery_methods.length > 0) {
          setSelectedDelivery(response.data.delivery_methods[0].id);
        }
      }
    } catch (error) {
      logger.error('Error loading delivery methods:', error);
    }
  };

  const toggleSection = (section: 'shipping' | 'delivery' | 'payment') => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate shipping address
    if (!shippingAddress.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    if (!shippingAddress.street.trim()) {
      errors.street = 'L\'adresse est requise';
    }
    if (!shippingAddress.city.trim()) {
      errors.city = 'La ville est requise';
    }
    if (!shippingAddress.zip.trim()) {
      errors.zip = 'Le code postal est requis';
    }
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    }
    if (!shippingAddress.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      errors.email = 'Email invalide';
    }

    // Validate delivery method
    if (!selectedDelivery) {
      errors.delivery = 'Veuillez sélectionner une méthode de livraison';
    }

    // Validate payment method
    if (!paymentMethod) {
      errors.payment = 'Veuillez sélectionner une méthode de paiement';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Submit complete checkout
      const response = await backendClient.completeCheckout({
        shipping_address: shippingAddress,
        delivery_method_id: selectedDelivery!, // Safe: validated in validateForm()
        payment_method: paymentMethod,
        notes: notes,
        save_address: saveAddress,
      });

      if (response.success && response.data) {
        // Clear cart
        await fetchCart();

        // Redirect based on payment method
        if (paymentMethod === 'stripe') {
          // Redirect to payment page with order ID
          router.push(`/checkout/payment?order_id=${response.data.order.id}`);
        } else if (paymentMethod === 'paypal') {
          // Redirect to PayPal
          router.push(`/checkout/payment?order_id=${response.data.order.id}&method=paypal`);
        } else {
          // Redirect to confirmation
          router.push(`/checkout/confirmation?order_id=${response.data.order.id}`);
        }
      } else {
        setError(response.message || 'Échec de la commande');
      }
    } catch (error: unknown) {
      const err = _error as Error;
      logger.error('Error completing checkout:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (!cart || !cart.lines || cart.lines.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Votre panier est vide</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Checkout Form */}
      <div className="space-y-4 lg:col-span-2">
        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Section 1: Shipping Address */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('shipping')}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                1
              </div>
              <h2 className="text-lg font-bold text-gray-900">Adresse de livraison</h2>
            </div>
            <svg
              className={`h-5 w-5 transition-transform ${expandedSections.shipping ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.shipping && (
            <div className="border-t p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                  <input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      validationErrors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      validationErrors.street ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.street && <p className="mt-1 text-sm text-red-600">{validationErrors.street}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Complément d&apos;adresse (optionnel)</label>
                  <input
                    type="text"
                    value={shippingAddress.street2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street2: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ville</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      validationErrors.city ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.city && <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Code postal</label>
                  <input
                    type="text"
                    value={shippingAddress.zip}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      validationErrors.zip ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.zip && <p className="mt-1 text-sm text-red-600">{validationErrors.zip}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      validationErrors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.phone && <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      validationErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
                </div>

                {user && (
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Enregistrer cette adresse pour mes prochaines commandes</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Delivery Method */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('delivery')}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                2
              </div>
              <h2 className="text-lg font-bold text-gray-900">Mode de livraison</h2>
            </div>
            <svg
              className={`h-5 w-5 transition-transform ${expandedSections.delivery ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.delivery && (
            <div className="border-t p-6">
              {validationErrors.delivery && (
                <p className="mb-4 text-sm text-red-600">{validationErrors.delivery}</p>
              )}
              <div className="space-y-3">
                {deliveryMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all ${
                      selectedDelivery === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={selectedDelivery === method.id}
                        onChange={() => setSelectedDelivery(method.id)}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        {method.description && (
                          <p className="text-sm text-gray-600">{method.description}</p>
                        )}
                      </div>
                    </div>
                    {method.fixed_price !== null && (
                      <p className="font-bold text-primary">
                        {formatPrice(method.fixed_price)}
                      </p>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Payment Method */}
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection('payment')}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                3
              </div>
              <h2 className="text-lg font-bold text-gray-900">Mode de paiement</h2>
            </div>
            <svg
              className={`h-5 w-5 transition-transform ${expandedSections.payment ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.payment && (
            <div className="border-t p-6">
              {validationErrors.payment && (
                <p className="mb-4 text-sm text-red-600">{validationErrors.payment}</p>
              )}
              <div className="space-y-3">
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 ${
                  paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Carte bancaire (Stripe)</p>
                    <p className="text-sm text-gray-600">Paiement sécurisé par carte</p>
                  </div>
                </label>

                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 ${
                  paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">PayPal</p>
                    <p className="text-sm text-gray-600">Payer avec PayPal</p>
                  </div>
                </label>

                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 ${
                  paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Virement bancaire</p>
                    <p className="text-sm text-gray-600">Payer par virement</p>
                  </div>
                </label>
              </div>

              {/* Order Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Notes de commande (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Instructions spéciales pour la livraison..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Order Summary (Sticky) */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Récapitulatif</h2>

          {/* Cart Items */}
          <div className="mb-4 space-y-3 border-b pb-4">
            {cart.lines.map((line) => (
              <div key={line.id} className="flex gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{line.product_name}</p>
                  <p className="text-xs text-gray-600">Quantité: {line.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatPrice(line.price_total || line.price_subtotal || line.subtotal || 0)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Sous-total</span>
              <span>{formatPrice(cart.amount_untaxed || cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>TVA</span>
              <span>{formatPrice(cart.amount_tax || cart.tax_total)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(cart.amount_total || cart.total)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="mt-6 w-full"
          >
            {loading ? 'Traitement...' : 'Finaliser la commande'}
          </Button>

          {/* Security Info */}
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
            <svg className="h-4 w-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p>Paiement 100% sécurisé. Vos données sont protégées.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
