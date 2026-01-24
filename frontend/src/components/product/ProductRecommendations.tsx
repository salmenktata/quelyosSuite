'use client';

import React, { useEffect, useState } from 'react';
import { ProductGrid, ProductCard } from '@/components/product';
import { Loading } from '@/components/common';
import { odooClient } from '@/lib/odoo/client';
import type { Product } from '@/types';

interface ProductRecommendationsProps {
  productId?: number;
  type: 'similar' | 'complementary' | 'recently_viewed' | 'popular';
  title?: string;
  limit?: number;
  excludeIds?: number[];
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  productId,
  type,
  title,
  limit = 4,
  excludeIds = [],
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const defaultTitles = {
    similar: 'Produits similaires',
    complementary: 'Souvent achetés ensemble',
    recently_viewed: 'Récemment consultés',
    popular: 'Produits populaires',
  };

  const displayTitle = title || defaultTitles[type];

  useEffect(() => {
    loadRecommendations();
  }, [productId, type, limit]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      let filters: any = {};

      switch (type) {
        case 'similar':
          if (productId) {
            // Get similar products based on category or tags
            const response = await odooClient.getProducts({
              category_id: productId,
              limit,
            });
            if (response.success) {
              setProducts(response.products.filter(p => !excludeIds.includes(p.id)));
            }
          }
          break;

        case 'complementary':
          // In a real app, this would use purchase history data
          const compResponse = await odooClient.getProducts({
              is_featured: true,
              limit,
          });
          if (compResponse.success) {
            setProducts(compResponse.products.filter(p => !excludeIds.includes(p.id)));
          }
          break;

        case 'recently_viewed':
          // Get from localStorage
          const recentlyViewed = getRecentlyViewedProducts();
          if (recentlyViewed.length > 0) {
            const viewedResponse = await odooClient.getProducts({
              limit,
            });
            if (viewedResponse.success) {
              // Filter products by IDs from recently viewed
              setProducts(viewedResponse.products.filter(p => recentlyViewed.includes(p.id)));
            }
          }
          break;

        case 'popular':
          const popularResponse = await odooClient.getProducts({
            is_bestseller: true,
            limit,
          });
          if (popularResponse.success) {
            setProducts(popularResponse.products.filter(p => !excludeIds.includes(p.id)));
          }
          break;
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecentlyViewedProducts = (): number[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('recently_viewed_products');
    return stored ? JSON.parse(stored) : [];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{displayTitle}</h2>
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{displayTitle}</h2>
        {type === 'similar' && (
          <span className="text-sm text-gray-500">{products.length} produit{products.length > 1 ? 's' : ''}</span>
        )}
      </div>
      <ProductGrid>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductGrid>
    </div>
  );
};

export default ProductRecommendations;
