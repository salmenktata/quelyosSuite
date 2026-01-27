/**
 * Page wishlist (liste de souhaits)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { LoadingPage } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/utils/formatting';
import { odooClient } from '@/lib/odoo/client';
import type { WishlistItem } from '@quelyos/types';
import { logger } from '@/lib/logger';

export default function AccountWishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/wishlist');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const result = await odooClient.getWishlist();
        if (result.success && result.wishlist) {
          setWishlist(result.wishlist);
        }
      } catch (error) {
        logger.error('Erreur chargement wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const handleRemove = async (itemId: number) => {
    if (!confirm('Retirer ce produit de votre wishlist ?')) {
      return;
    }

    setRemovingId(itemId);

    try {
      const result = await odooClient.removeFromWishlist(itemId);

      if (result.success) {
        setWishlist((prev) => prev.filter((item) => item.id !== itemId));
      } else {
        throw new Error(result.error || 'Erreur suppression wishlist');
      }
    } catch (error: any) {
      logger.error('Erreur suppression wishlist:', error);
      alert(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1);
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
          <span className="text-gray-900">Ma wishlist</span>
        </nav>

        {/* Titre */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Ma wishlist</h1>
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
        ) : wishlist.length === 0 ? (
          /* Wishlist vide */
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Votre wishlist est vide
            </h2>
            <p className="text-gray-500 mb-6">
              Ajoutez des produits à votre liste de souhaits pour les retrouver facilement
            </p>
            <Link href="/products">
              <Button variant="primary" size="lg" className="rounded-full">
                Découvrir nos produits
              </Button>
            </Link>
          </div>
        ) : (
          /* Liste wishlist */
          <div>
            <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
              <p className="text-gray-600">
                {wishlist.length} produit{wishlist.length > 1 && 's'} dans votre wishlist
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => {
                const mainImage = item.product.images?.find(img => img.is_main)?.url || item.product.images?.[0]?.url || '/placeholder-product.svg';
                return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Image */}
                  <Link href={`/products/${item.product.slug}`} className="block relative aspect-square">
                    <Image
                      src={mainImage}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {!item.product.in_stock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full">
                          Rupture de stock
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="p-4">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-semibold text-gray-900 hover:text-primary line-clamp-2 mb-2 block"
                    >
                      {item.product.name}
                    </Link>

                    <p className="text-lg font-bold text-primary mb-3">
                      {formatPrice(item.product.price ?? 0, item.product.currency?.symbol ?? 'TND')}
                    </p>

                    <p className="text-xs text-gray-500 mb-4">
                      Ajouté le{' '}
                      {new Date(item.added_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddToCart(item.product.id)}
                        disabled={!item.product.in_stock}
                        className="flex-1 rounded-full"
                      >
                        {item.product.in_stock ? 'Ajouter au panier' : 'Indisponible'}
                      </Button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        title="Retirer de la wishlist"
                      >
                        {removingId === item.id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
