/**
 * Custom Hook for Cached Product Fetching
 * Uses Redis-cached endpoints when available
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { backendClient } from '@/lib/backend/client';
import type { Product } from '@quelyos/types';

interface UseCachedProductsOptions {
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
  sort?: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popularity';
  useCache?: boolean; // Enable/disable cache
}

interface UseCachedProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  cached: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch products with optional Redis caching
 */
export function useCachedProducts(
  options: UseCachedProductsOptions = {}
): UseCachedProductsReturn {
  const {
    limit = 20,
    offset = 0,
    filters = {},
    sort = 'name',
    useCache = true,
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendClient.getProducts({
        limit,
        offset,
        ...filtersRef.current,
        sort,
      });

      if (response.success && response.products) {
        setProducts(response.products);
        setCached(false);
      } else {
        setError('Failed to fetch products');
      }
    } catch (_err: unknown) {
      const err = _err as Error;
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [limit, offset, sort]);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, filtersKey, useCache]);

  return {
    products,
    loading,
    error,
    cached,
    refetch: fetchProducts,
  };
}

/**
 * Hook to fetch a single product with optional Redis caching
 */
export function useCachedProduct(
  productId: number,
  useCache = true
): {
  product: Product | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
  refetch: () => void;
} {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendClient.getProduct(productId);

      if (response.success && response.product) {
        setProduct(response.product);
        setCached(false);
      } else {
        setError('Product not found');
      }
    } catch (_err: unknown) {
      const err = _err as Error;
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, useCache, fetchProduct]);

  return {
    product,
    loading,
    error,
    cached,
    refetch: fetchProduct,
  };
}

/**
 * Example usage:
 *
 * ```tsx
 * function ProductList() {
 *   const { products, loading, error, cached } = useCachedProducts({
 *     limit: 20,
 *     filters: { category_id: 5 },
 *     useCache: true,
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       {cached && <span>⚡ Cached</span>}
 *       {products.map((product) => (
 *         <ProductCard key={product.id} product={product} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
