/**
 * ContinueShoppingSection - Section "Continuer vos achats" pour la homepage
 * Affiche les produits récemment consultés par l&apos;utilisateur
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { formatPrice } from '@/lib/utils/formatting';
import { getProxiedImageUrl } from '@/lib/image-proxy';

export function ContinueShoppingSection() {
  const { products } = useRecentlyViewedStore();

  // Ne rien afficher s&apos;il n'y a pas de produits consultés
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Continuer vos achats
            </h2>
            <p className="text-gray-600 mt-1">
              Reprendre là où vous vous étiez arrêté
            </p>
          </div>
          <Link
            href="/products"
            className="text-primary font-semibold hover:underline hidden sm:block"
          >
            Voir tous les produits →
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.slice(0, 6).map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={getProxiedImageUrl(product.image_url)}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Badge si produit récemment vu */}
                <div className="absolute top-2 left-2">
                  <span className="bg-primary/90 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    Vu récemment
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-primary font-bold mt-1">
                  {formatPrice(product.price, (product as { currency?: { symbol?: string } }).currency?.symbol || 'TND')}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center text-primary font-semibold hover:underline"
          >
            Voir tous les produits
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
