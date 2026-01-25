'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompareStore } from '@/store/compareStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils/formatting';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Compare Drawer Component
 * Displays comparison table for up to 4 products
 * Features:
 * - Side-by-side comparison
 * - Key specs highlighted
 * - Add to cart from comparison
 * - Remove individual products
 */
export function CompareDrawer({ isOpen, onClose }: CompareDrawerProps) {
  const { products, removeProduct, clearAll } = useCompareStore();
  const { addToCart } = useCartStore();

  if (!isOpen) return null;

  const hasProducts = products.length > 0;

  // Helper function pour proxy des images Odoo
  const getProxiedImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('/api/image')) return url;
    if (url.startsWith('/') && !url.includes('/web/image')) return url;

    const isOdooImage = url.includes('/web/image') ||
      url.includes('localhost:8069') ||
      url.includes('odoo:8069');

    if (isOdooImage) {
      return `/api/image?url=${encodeURIComponent(url)}`;
    }

    return url;
  };

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end bg-black bg-opacity-50 backdrop-blur-sm">
      {/* Drawer */}
      <div className="relative w-full md:w-[90vw] max-w-6xl h-[90vh] md:h-full md:max-h-[90vh] bg-white rounded-t-2xl md:rounded-l-2xl md:rounded-r-none shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comparateur de produits</h2>
            <p className="text-sm text-gray-600 mt-1">
              {products.length} {products.length === 1 ? 'produit' : 'produits'} en comparaison (max 4)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasProducts && (
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Tout effacer
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              aria-label="Fermer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-88px)] overflow-auto p-6">
          {!hasProducts ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit à comparer</h3>
              <p className="text-gray-600 mb-6">
                Ajoutez des produits à la comparaison pour voir un tableau comparatif détaillé
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
              >
                Parcourir les produits
              </button>
            </div>
          ) : (
            // Comparison Table
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-10 p-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200 w-48">
                      Caractéristiques
                    </th>
                    {products.map((product) => (
                      <th key={product.id} className="p-4 border-b-2 border-gray-200 min-w-[250px]">
                        <div className="relative">
                          {/* Remove button */}
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors z-10"
                            aria-label="Retirer"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>

                          {/* Product Image */}
                          <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3">
                            {product.images?.[0] || product.image_url ? (
                              <Image
                                src={getProxiedImageUrl(product.images?.[0]?.url || product.image_url)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="150px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Product Name */}
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                            {product.name}
                          </h4>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Prix */}
                  <tr className="border-b border-gray-100">
                    <td className="sticky left-0 bg-gray-50 p-4 font-medium text-gray-700">Prix</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(product.price || product.list_price || 0, product.currency?.symbol || 'TND')}
                        </div>
                        {product.compare_at_price && product.compare_at_price > (product.price || 0) && (
                          <div className="text-sm text-gray-400 line-through">
                            {formatPrice(product.compare_at_price, product.currency?.symbol || 'TND')}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Disponibilité */}
                  <tr className="border-b border-gray-100">
                    <td className="sticky left-0 bg-gray-50 p-4 font-medium text-gray-700">Disponibilité</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.in_stock ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            En stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Rupture
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Catégorie */}
                  <tr className="border-b border-gray-100">
                    <td className="sticky left-0 bg-gray-50 p-4 font-medium text-gray-700">Catégorie</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-gray-700">
                        {product.category?.name || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Référence */}
                  <tr className="border-b border-gray-100">
                    <td className="sticky left-0 bg-gray-50 p-4 font-medium text-gray-700">Référence</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-gray-600 font-mono text-sm">
                        {product.default_code || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Description */}
                  <tr className="border-b border-gray-100">
                    <td className="sticky left-0 bg-gray-50 p-4 font-medium text-gray-700">Description</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-sm text-gray-600">
                        <div className="line-clamp-3">
                          {product.description || 'Aucune description disponible'}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="sticky left-0 bg-gray-50 p-4 font-medium text-gray-700">Actions</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleAddToCart(product.id)}
                            disabled={!product.in_stock}
                            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Ajouter au panier
                          </button>
                          <Link
                            href={`/products/${product.slug || product.id}`}
                            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
                            onClick={onClose}
                          >
                            Voir le produit
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompareDrawer;
