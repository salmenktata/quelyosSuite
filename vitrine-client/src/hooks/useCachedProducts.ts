/**
 * Custom Hook for Cached Product Fetching
 * Uses Redis-cached endpoints when available
 */

import { useState, useEffect } from 'react';
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use regular endpoint - caching is handled transparently by backend
      const _endpoint = '/products';

      const response = await backendClient.getProducts({
        limit,
        offset,
        ...filters,
        sort,
      });

      if (response.success && response.products) {
        setProducts(response.products);
        // Backend doesn't return cached flag, set to false by default
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
  };

  useEffect(() => {
    fetchProducts();
  }, [limit, offset, JSON.stringify(filters), sort, useCache]);

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

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use regular endpoint - caching is handled transparently by backend
      const response = await backendClient.getProduct(productId);

      if (response.success && response.product) {
        setProduct(response.product);
        // Backend doesn't return cached flag, set to false by default
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
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, useCache]);

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
