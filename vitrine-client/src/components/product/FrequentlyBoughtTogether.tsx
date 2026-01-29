/**
 * FrequentlyBoughtTogether - Section "Souvent achetés ensemble"
 * Affiche les produits fréquemment achetés avec le produit actuel
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { backendClient } from '@/lib/backend/client';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/utils/formatting';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { logger } from '@/lib/logger';

interface FrequentlyBoughtProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  co_purchase_count: number;
}

interface FrequentlyBoughtTogetherProps {
  productId: number;
  productName: string;
  productPrice: number;
  productImage?: string;
  currency?: string;
}

export function FrequentlyBoughtTogether({
  productId,
  productName,
  productPrice,
  productImage,
  currency = 'TND',
}: FrequentlyBoughtTogetherProps) {
  const [products, setProducts] = useState<FrequentlyBoughtProduct[]>([]);
  const [bundleData, setBundleData] = useState<{
    total: number;
    discount: number;
    price: number;
  } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addToCart } = useCartStore();
  const toast = useToast();

  useEffect(() => {
    fetchFrequentlyBought();
  }, [productId]);

  const fetchFrequentlyBought = async () => {
    try {
      const response = await backendClient.getFrequentlyBoughtTogether(productId);
      if (response.success && response.data) {
        setProducts(response.data.products);
        setBundleData({
          total: response.data.bundle_total,
          discount: response.data.bundle_discount,
          price: response.data.bundle_price,
        });
        // Sélectionner tous les produits par défaut
        setSelectedProducts(new Set(response.data.products.map((p: FrequentlyBoughtProduct) => p.id)));
      }
    } catch (error) {
      logger.error('Error fetching frequently bought together:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProduct = (productIdToToggle: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productIdToToggle)) {
        newSet.delete(productIdToToggle);
      } else {
        newSet.add(productIdToToggle);
      }
      return newSet;
    });
  };

  const calculateSelectedTotal = () => {
    const selectedProductsArray = products.filter(p => selectedProducts.has(p.id));
    const productsTotal = selectedProductsArray.reduce((sum, p) => sum + p.price, 0);
    return productPrice + productsTotal;
  };

  const handleAddBundleToCart = async () => {
    setIsAddingToCart(true);
    try {
      // Ajouter le produit principal
      await addToCart(productId, 1);

      // Ajouter les produits sélectionnés
      for (const id of selectedProducts) {
        await addToCart(id, 1);
      }

      toast.success(`${1 + selectedProducts.size} produit(s) ajouté(s) au panier !`);
    } catch (error) {
      logger.error('Error adding bundle to cart:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Ne pas afficher si pas de produits ou en chargement
  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-50 rounded-xl p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gray-200 rounded"></div>
          <div className="w-24 h-24 bg-gray-200 rounded"></div>
          <div className="w-24 h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const selectedTotal = calculateSelectedTotal();
  const hasDiscount = bundleData && bundleData.discount > 0 && selectedProducts.size >= 2;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 my-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900">Souvent achetés ensemble</h3>
      </div>

      {/* Products row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Produit principal (toujours inclus) */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 bg-white rounded-lg border-2 border-primary overflow-hidden shadow-sm">
            {productImage ? (
              <Image
                src={getProxiedImageUrl(productImage)}
                alt={productName}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <span className="text-xs text-gray-600 mt-1 text-center line-clamp-1 max-w-20">
            Ce produit
          </span>
        </div>

        {/* Symbole + */}
        <span className="text-2xl text-gray-400 font-light">+</span>

        {/* Produits fréquemment achetés */}
        {products.map((product, index) => (
          <React.Fragment key={product.id}>
            <button
              onClick={() => toggleProduct(product.id)}
              className={`flex flex-col items-center transition-all ${
                selectedProducts.has(product.id) ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div className={`relative w-20 h-20 bg-white rounded-lg border-2 overflow-hidden shadow-sm ${
                selectedProducts.has(product.id) ? 'border-green-500' : 'border-gray-200'
              }`}>
                {product.image_url ? (
                  <Image
                    src={getProxiedImageUrl(product.image_url)}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {selectedProducts.has(product.id) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-600 mt-1 text-center line-clamp-1 max-w-20">
                {formatPrice(product.price, currency)}
              </span>
            </button>

            {index < products.length - 1 && (
              <span className="text-2xl text-gray-400 font-light">+</span>
            )}
          </React.Fragment>
        ))}

        {/* Égal et total */}
        <span className="text-2xl text-gray-400 font-light">=</span>

        <div className="flex flex-col items-center">
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(selectedTotal, currency)}
            </span>
          )}
          <span className="text-2xl font-bold text-primary">
            {formatPrice(hasDiscount ? selectedTotal * 0.95 : selectedTotal, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              -5% bundle
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        className="w-full"
        onClick={handleAddBundleToCart}
        disabled={isAddingToCart || selectedProducts.size === 0}
      >
        {isAddingToCart ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Ajout en cours...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Ajouter {1 + selectedProducts.size} article{selectedProducts.size > 0 ? 's' : ''} au panier
          </span>
        )}
      </Button>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center mt-3">
        Cliquez sur un produit pour le sélectionner/désélectionner
      </p>
    </div>
  );
}
