'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { odooClient } from '@/lib/odoo/client';
import { Button } from '@/components/common';
import { Product } from '@quelyos/types';
import { logger } from '@/lib/logger';

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  onAddToCart?: (productId: number) => void;
}

/**
 * Upsell Modal
 * Shows after adding product to cart
 * Suggests higher-tier products for upselling
 */
export function UpsellModal({
  isOpen,
  onClose,
  productId,
  productName,
  onAddToCart,
}: UpsellModalProps) {
  const [upsellProducts, setUpsellProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen) {
      fetchUpsellProducts();
      setCountdown(5);
    }
  }, [isOpen, productId]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || countdown === 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, countdown]);

  const fetchUpsellProducts = async () => {
    try {
      setLoading(true);

      const response = await odooClient.getUpsellProducts(productId, 3);

      if (response.success && response.products) {
        setUpsellProducts(response.products);
      }
    } catch (error) {
      logger.error('Error fetching upsell products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpsell = async (upsellProductId: number) => {
    if (onAddToCart) {
      await onAddToCart(upsellProductId);
    }
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-green-600"
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
                <h2 className="text-xl font-bold text-gray-900">
                  Produit ajouté au panier !
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {productName}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Fermer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Countdown Timer */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="h-4 w-4 animate-pulse text-orange-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Offre spéciale disponible pendant{' '}
              <strong className="text-orange-600">{countdown}s</strong>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse gap-4 rounded-lg border p-4"
                >
                  <div className="h-24 w-24 rounded-lg bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="h-8 w-24 rounded bg-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : upsellProducts.length > 0 ? (
            <>
              <div className="mb-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-100 p-4">
                <h3 className="mb-1 text-lg font-bold text-gray-900">
                  🎁 Profitez d'un upgrade maintenant
                </h3>
                <p className="text-sm text-gray-700">
                  Passez à un produit supérieur et bénéficiez d'une meilleure qualité
                </p>
              </div>

              <div className="space-y-3">
                {upsellProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-4 rounded-lg border-2 border-primary/20 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    {/* Product Image */}
                    <Link href={`/products/${product.slug}`} onClick={onClose} className="relative h-24 w-24 flex-shrink-0">
                      <Image
                        src={product.image_url || product.images?.[0]?.url || '/placeholder-product.png'}
                        alt={product.name}
                        fill
                        className="rounded-lg object-cover"
                        sizes="96px"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={onClose}
                          className="font-semibold text-gray-900 hover:text-primary"
                        >
                          {product.name}
                        </Link>

                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(product.list_price ?? product.price ?? 0)}
                          </p>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddUpsell(product.id)}
                        >
                          Choisir ce produit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
              <svg
                className="mx-auto mb-3 h-12 w-12 text-gray-400"
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
              <p className="text-gray-600">
                Aucune suggestion d'upgrade disponible
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-gray-50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={onClose}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Non merci, continuer mes achats
            </button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Voir mon panier
              </Button>

              <Link href="/checkout">
                <Button variant="primary" onClick={onClose}>
                  Passer commande
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
