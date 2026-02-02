/**
 * Page liste des commandes
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { LoadingPage } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/utils/formatting';
import { backendClient } from '@/lib/backend/client';
import type { Order } from '@quelyos/types';
import { logger } from '@/lib/logger';

const orderStates = {
  draft: { label: 'Brouillon', color: 'gray' },
  sent: { label: 'Devis envoyé', color: 'blue' },
  sale: { label: 'Bon de commande', color: 'yellow' },
  done: { label: 'Verrouillé', color: 'green' },
  cancel: { label: 'Annulée', color: 'red' },
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/orders');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await backendClient.getOrders();
        if (result.success && result.orders) {
          setOrders(result.orders);
        }
      } catch (_error) {
        logger.error('Erreur chargement commandes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleReorder = async (orderId: number) => {
    setReorderingId(orderId);
    try {
      const result = await backendClient.reorderOrder(orderId);

      if (result.success) {
        // Rafraîchir le panier
        await fetchCart();

        // Afficher le message de succès
        const addedCount = result.added_products?.length || 0;
        const unavailableCount = result.unavailable_products?.length || 0;

        if (unavailableCount > 0) {
          toast.warning(
            `${addedCount} produit(s) ajouté(s). ${unavailableCount} produit(s) non disponible(s).`
          );
        } else {
          toast.success(`${addedCount} produit(s) ajouté(s) au panier !`);
        }

        // Optionnel : rediriger vers le panier
        router.push('/cart');
      } else {
        toast.error(result.error || 'Erreur lors de la recommande');
      }
    } catch (_error) {
      logger.error('Erreur reorder:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setReorderingId(null);
    }
  };

  if (!isAuthenticated) {
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
          <Link href="/account" className="text-gray-600 hover:text-primary">
            Mon compte
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">Mes commandes</span>
        </nav>

        {/* Titre */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Mes commandes</h1>
          <Link href="/account">
            <Button variant="outline" className="rounded-full">
              ← Retour au compte
            </Button>
          </Link>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Aucune commande */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Aucune commande
            </h2>
            <p className="text-gray-500 mb-6">
              Vous n&apos;avez pas encore passé de commande
            </p>
            <Link href="/products">
              <Button variant="primary" size="lg" className="rounded-full">
                Découvrir nos produits
              </Button>
            </Link>
          </div>
        ) : (
          /* Liste des commandes */
          <div className="space-y-4">
            {orders.map((order) => {
              const state = orderStates[order.state as keyof typeof orderStates] || orderStates.draft;
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Infos commande */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            Commande {order.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>
                            📅 {new Date(order.date_order || new Date()).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span>{order.line_count || 0} article(s)</span>
                          <span className="font-semibold text-primary">
                            {formatPrice(order.amount_total || order.total || 0, order.currency?.symbol || '€')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          className="rounded-full"
                          onClick={() => handleReorder(order.id)}
                          disabled={reorderingId === order.id}
                        >
                          {reorderingId === order.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Ajout...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Recommander
                            </span>
                          )}
                        </Button>
                        <Link href={`/account/orders/${order.id}`}>
                          <Button variant="outline" className="rounded-full">
                            Voir détails
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
