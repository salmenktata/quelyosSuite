'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { odooClient } from '@/lib/odoo/client';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/common';
import { logger } from '@/lib/logger';

interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string | null;
  stock_available: boolean;
  added_date: string | null;
}

interface PublicWishlist {
  owner_name: string;
  items: WishlistProduct[];
  total_items: number;
}

/**
 * Public Wishlist Page
 * Displays shared wishlist for public viewing
 * Accessible via share token
 */
export default function PublicWishlistPage() {
  const params = useParams();
  const token = params.token as string;

  const [wishlist, setWishlist] = useState<PublicWishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToCart } = useCartStore();

  useEffect(() => {
    if (token) {
      loadWishlist();
    }
  }, [token]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await odooClient.getPublicWishlist(token);

      if (response.success && response.data?.wishlist) {
        setWishlist(response.data.wishlist);
      } else {
        setError(response.message || 'Failed to load wishlist');
      }
    } catch (err: any) {
      logger.error('Error loading wishlist:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
    } catch (error) {
      logger.error('Error adding to cart:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-gray-600">Chargement de la liste de souhaits...</p>
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
            <h1 className="mb-2 text-2xl font-bold text-red-900">Liste introuvable</h1>
            <p className="mb-6 text-red-800">{error}</p>
            <Link href="/">
              <Button variant="primary">Retour à l'accueil</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <svg
            className="h-8 w-8 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900">
            Liste de souhaits de {wishlist.owner_name}
          </h1>
        </div>
        <p className="text-gray-600">
          {wishlist.total_items} produit{wishlist.total_items > 1 ? 's' : ''} dans cette liste
        </p>
      </div>

      {/* Products Grid */}
      {wishlist.items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.items.map((product) => (
            <div
              key={product.id}
              className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
            >
              {/* Product Image */}
              <Link href={`/products/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        className="h-24 w-24 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              {/* Product Info */}
              <div className="p-4">
                <Link
                  href={`/products/${product.slug}`}
                  className="mb-2 block font-semibold text-gray-900 line-clamp-2 hover:text-primary"
                >
                  {product.name}
                </Link>

                {product.description && (
                  <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>

                  {/* Stock Status */}
                  {product.stock_available ? (
                    <span className="text-xs font-medium text-green-600">
                      En stock
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-red-600">
                      Rupture de stock
                    </span>
                  )}
                </div>

                {/* Added Date */}
                {product.added_date && (
                  <p className="mb-3 text-xs text-gray-500">
                    Ajouté le {new Date(product.added_date).toLocaleDateString('fr-FR')}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={!product.stock_available}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                  >
                    Ajouter au panier
                  </Button>

                  <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                    <Button variant="outline" size="sm">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-lg text-gray-600">Cette liste est vide</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
        <p className="mb-2 text-sm text-gray-700">
          Vous aimez cette liste ? Créez la vôtre !
        </p>
        <Link href="/account/wishlist">
          <Button variant="primary">Créer ma liste de souhaits</Button>
        </Link>
      </div>
    </div>
  );
}
