'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { backendClient } from '@/lib/backend/client';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@quelyos/types';
import { formatPrice } from '@/lib/utils/formatting';
import { logger } from '@/lib/logger';
import { getProxiedImageUrl } from '@/lib/image-proxy';

interface BundleSuggestionsProps {
  currentProduct: Product;
  className?: string;
}

/**
 * Bundle Suggestions Component
 * Displays "Frequently Bought Together" bundle
 * Features:
 * - Smart product recommendations
 * - Total price calculation with discount
 * - Add all to cart with one click
 * - Individual product toggle
 */
export function BundleSuggestions({ currentProduct, className = '' }: BundleSuggestionsProps) {
  const [bundleProducts, setBundleProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCartStore();

  useEffect(() => {
    const loadBundleProducts = async () => {
      try {
        setIsLoading(true);

        const response = await backendClient.getProducts({
          category_id: currentProduct.category?.id,
          limit: 3,
          offset: 0,
        });

        if (response.success && response.products) {
          const otherProducts = response.products
            .filter(p => p.id !== currentProduct.id)
            .slice(0, 2);

          setBundleProducts(otherProducts);

          const initialSelection = new Set<number>([currentProduct.id]);
          otherProducts.forEach(p => initialSelection.add(p.id));
          setSelectedProducts(initialSelection);
        }
      } catch (error) {
        logger.error('Error loading bundle products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBundleProducts();
  }, [currentProduct.id, currentProduct.category?.id]);

  const toggleProduct = (productId: number) => {
    // Ne pas permettre de désélectionner le produit actuel
    if (productId === currentProduct.id) return;

    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleAddAllToCart = async () => {
    setIsAddingToCart(true);
    try {
      // Ajouter tous les produits sélectionnés au panier
      const selectedProductsList = [currentProduct, ...bundleProducts]
        .filter(p => selectedProducts.has(p.id));

      for (const product of selectedProductsList) {
        await addToCart(product.id, 1);
      }
    } catch (error) {
      logger.error('Error adding bundle to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Calculer le total
  const allProducts = [currentProduct, ...bundleProducts];
  const selectedProductsList = allProducts.filter(p => selectedProducts.has(p.id));
  const total = selectedProductsList.reduce((sum, p) => sum + (p.price || 0), 0);
  const bundleDiscount = 0.05; // 5% de réduction pour l'achat groupé
  const totalWithDiscount = total * (1 - bundleDiscount);
  const savings = total - totalWithDiscount;

  if (isLoading || bundleProducts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Souvent achetés ensemble</h3>
          <p className="text-sm text-gray-600">Économisez {bundleDiscount * 100}% en achetant ces produits ensemble</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Produit actuel */}
        <ProductBundleCard
          product={currentProduct}
          isSelected={selectedProducts.has(currentProduct.id)}
          onToggle={() => toggleProduct(currentProduct.id)}
          isMainProduct={true}
          getProxiedImageUrl={getProxiedImageUrl}
        />

        {/* Produits suggérés */}
        {bundleProducts.map((product, _index) => (
          <React.Fragment key={product.id}>
            {/* Plus icon */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                +
              </div>
            </div>

            <ProductBundleCard
              product={product}
              isSelected={selectedProducts.has(product.id)}
              onToggle={() => toggleProduct(product.id)}
              getProxiedImageUrl={getProxiedImageUrl}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Total and CTA */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-blue-200">
        <div>
          <div className="text-sm text-gray-600 mb-1">Prix total</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-blue-600">
              {formatPrice(totalWithDiscount, currentProduct.currency?.symbol || 'TND')}
            </span>
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(total, currentProduct.currency?.symbol || 'TND')}
            </span>
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{formatPrice(savings, currentProduct.currency?.symbol || 'TND')}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {selectedProductsList.length} {selectedProductsList.length === 1 ? 'produit sélectionné' : 'produits sélectionnés'}
          </p>
        </div>

        <button
          onClick={handleAddAllToCart}
          disabled={isAddingToCart || selectedProductsList.length === 0}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
        >
          {isAddingToCart ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ajout en cours...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Tout ajouter au panier
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Sous-composant pour chaque produit du bundle
function ProductBundleCard({
  product,
  isSelected,
  onToggle,
  isMainProduct = false,
  getProxiedImageUrl
}: {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  isMainProduct?: boolean;
  getProxiedImageUrl: (url: string | undefined) => string;
}) {
  const imageUrl = getProxiedImageUrl(product.images?.[0]?.url || product.image_url);

  return (
    <div
      onClick={!isMainProduct ? onToggle : undefined}
      className={`
        relative bg-white rounded-xl p-4 border-2 transition-all duration-200
        ${isSelected ? 'border-blue-600 shadow-lg' : 'border-gray-200'}
        ${!isMainProduct ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : ''}
      `}
    >
      {/* Checkbox (sauf produit principal) */}
      {!isMainProduct && (
        <div className="absolute top-2 right-2 z-10">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Badge "Ce produit" */}
      {isMainProduct && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md">
          Ce produit
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 150px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <h4 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </h4>
      <div className="text-lg font-bold text-gray-900">
        {formatPrice(product.price || 0, product.currency?.symbol || 'TND')}
      </div>
    </div>
  );
}

export default BundleSuggestions;
