/**
 * Barre de comparaison flottante
 * Affiche les produits ajoutés à la comparaison
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useComparisonStore } from '@/store/comparisonStore';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Button } from '@/components/common/Button';

export const ComparisonBar: React.FC = () => {
  const router = useRouter();
  const { products, removeProduct, clearComparison, maxProducts } = useComparisonStore();
  const { data: siteConfig } = useSiteConfig();

  // N'afficher que si la fonctionnalité est activée et au moins 1 produit
  if (!siteConfig?.compare_enabled || products.length === 0) {
    return null;
  }

  const handleCompare = () => {
    router.push('/compare');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-2xl z-40 animate-slideUp">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Titre et compteur */}
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <h3 className="font-bold text-gray-900">Comparaison</h3>
              <p className="text-xs text-gray-500">
                {products.length}/{maxProducts} produits
              </p>
            </div>
          </div>

          {/* Produits */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto py-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative flex-shrink-0 group"
              >
                {/* Miniature produit */}
                <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Bouton supprimer */}
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    title="Retirer de la comparaison"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Nom produit (tooltip) */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {product.name.length > 30 ? product.name.slice(0, 30) + '...' : product.name}
                </div>
              </div>
            ))}

            {/* Espaces vides pour les produits manquants */}
            {Array.from({ length: maxProducts - products.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
              >
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={clearComparison}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              title="Vider la comparaison"
            >
              Tout effacer
            </button>
            <Button
              variant="primary"
              onClick={handleCompare}
              disabled={products.length < 2}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparer ({products.length})
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ComparisonBar;
