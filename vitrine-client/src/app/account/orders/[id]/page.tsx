/**
 * Page détail d&apos;une commande
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { LoadingPage } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/utils/formatting';
import { backendClient } from '@/lib/backend/client';
import type { OrderDetail } from '@quelyos/types';
import { logger } from '@/lib/logger';

const orderStates = {
  draft: { label: 'Brouillon', color: 'gray' },
  sent: { label: 'Devis envoyé', color: 'blue' },
  sale: { label: 'Bon de commande', color: 'yellow' },
  done: { label: 'Verrouillé', color: 'green' },
  cancel: { label: 'Annulée', color: 'red' },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/orders/' + orderId);
    }
  }, [isAuthenticated, router, orderId]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const result = await backendClient.getOrder(parseInt(orderId));
        if (result.success && result.data) {
          setOrder(result.data.order as OrderDetail);
        } else {
          setOrder(null);
        }
      } catch (error) {
        logger.error('Erreur lors du chargement de la commande:', error);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrder();
    }
  }, [orderId, isAuthenticated]);

  if (!isAuthenticated) {
    return <LoadingPage />;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Commande introuvable</h1>
            <p className="text-gray-600 mb-6">
              La commande #{orderId} n'existe pas ou vous n'y avez pas accès.
            </p>
            <Link href="/account/orders">
              <Button variant="primary" className="rounded-full">
                ← Retour aux commandes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const state = orderStates[order.state as keyof typeof orderStates] || orderStates.draft;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-600 hover:text-primary">
            Accueil
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/account" className="text-gray-600 hover:text-primary">
            Mon compte
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/account/orders" className="text-gray-600 hover:text-primary">
            Mes commandes
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">Commande {order.name}</span>
        </nav>

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Commande {order.name}</h1>
            <p className="text-gray-600">
              Passée le{' '}
              {new Date(order.date_order || new Date()).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                state.color === 'green'
                  ? 'bg-green-100 text-green-800'
                  : state.color === 'yellow'
                  ? 'bg-yellow-100 text-yellow-800'
                  : state.color === 'blue'
                  ? 'bg-blue-100 text-blue-800'
                  : state.color === 'red'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {state.label}
            </span>
            <Link href="/account/orders">
              <Button variant="outline" className="rounded-full">
                ← Retour
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Articles */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Articles commandés</h2>
              <div className="divide-y">
                {order.lines?.map((line) => (
                  <div key={line.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    {/* Image */}
                    <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={line.image_url || line.product?.image_url || '/placeholder.jpg'}
                        alt={line.product_name || line.product?.name || 'Product'}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {line.product_name}
                      </h3>
                      <p className="text-sm text-gray-600">Quantité: {line.quantity}</p>
                      <p className="text-sm text-gray-600">
                        Prix unitaire: {formatPrice(line.price_unit, order.currency?.symbol || '€')}
                      </p>
                    </div>

                    {/* Prix */}
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatPrice(line.price_total, order.currency?.symbol || '€')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adresse de livraison */}
            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Adresse de livraison</h2>
                <div className="text-gray-700">
                  <p className="font-semibold">{order.shipping_address.name}</p>
                  <p>{order.shipping_address.street}</p>
                  {order.shipping_address.street2 && <p>{order.shipping_address.street2}</p>}
                  <p>
                    {order.shipping_address.zip} {order.shipping_address.city}
                  </p>
                  <p>{order.shipping_address.country_name || order.shipping_address.country_id}</p>
                </div>
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Récapitulatif</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{formatPrice(order.amount_untaxed || order.subtotal || 0, order.currency?.symbol || '€')}</span>
                </div>

                {((order.amount_tax || order.tax_total || 0) > 0) && (
                  <div className="flex justify-between text-gray-600">
                    <span>TVA</span>
                    <span>{formatPrice(order.amount_tax || order.tax_total || 0, order.currency?.symbol || '€')}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(order.amount_total || order.total, order.currency?.symbol || '€')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Button variant="primary" size="lg" className="w-full rounded-full">
                  Télécharger la facture
                </Button>
                <Button variant="outline" size="lg" className="w-full rounded-full">
                  Besoin d&apos;aide ?
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
