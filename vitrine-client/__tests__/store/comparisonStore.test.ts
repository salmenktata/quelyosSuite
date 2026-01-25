/**
 * Tests pour comparisonStore
 */

import { renderHook, act } from '@testing-library/react';
import { useComparisonStore } from '@/store/comparisonStore';
import type { Product } from '@/types';

// Mock du localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock product data
const mockProduct1: Product = {
  id: 1,
  name: 'Product 1',
  slug: 'product-1',
  description: 'Test product 1',
  list_price: 100,
  currency: { id: 1, code: 'EUR', symbol: '€', name: 'EUR' },
  in_stock: true,
  stock_qty: 10,
  images: [],
  category: null,
  seo: { meta_title: '', meta_description: '', meta_keywords: '' },
  is_featured: false,
  is_new: false,
  is_bestseller: false,
  view_count: 0,
};

const mockProduct2: Product = {
  ...mockProduct1,
  id: 2,
  name: 'Product 2',
  slug: 'product-2',
};

const mockProduct3: Product = {
  ...mockProduct1,
  id: 3,
  name: 'Product 3',
  slug: 'product-3',
};

const mockProduct4: Product = {
  ...mockProduct1,
  id: 4,
  name: 'Product 4',
  slug: 'product-4',
};

const mockProduct5: Product = {
  ...mockProduct1,
  id: 5,
  name: 'Product 5',
  slug: 'product-5',
};

describe('comparisonStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    const { result } = renderHook(() => useComparisonStore());
    act(() => {
      result.current.clearComparison();
    });
  });

  it('should initialize with empty products', () => {
    const { result } = renderHook(() => useComparisonStore());
    expect(result.current.products).toEqual([]);
  });

  it('should add product to comparison', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      const success = result.current.addProduct(mockProduct1);
      expect(success).toBe(true);
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe(1);
    expect(result.current.isInComparison(1)).toBe(true);
  });

  it('should not add more than maxProducts', () => {
    const { result } = renderHook(() => useComparisonStore());

    // Ajouter 4 produits (max)
    act(() => {
      result.current.addProduct(mockProduct1);
      result.current.addProduct(mockProduct2);
      result.current.addProduct(mockProduct3);
      result.current.addProduct(mockProduct4);
    });

    expect(result.current.products).toHaveLength(4);

    // Essayer d'ajouter un 5ème
    act(() => {
      const success = result.current.addProduct(mockProduct5);
      expect(success).toBe(false);
    });

    expect(result.current.products).toHaveLength(4);
  });

  it('should remove product from comparison', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProduct(mockProduct1);
      result.current.addProduct(mockProduct2);
    });

    expect(result.current.products).toHaveLength(2);

    act(() => {
      result.current.removeProduct(1);
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe(2);
    expect(result.current.isInComparison(1)).toBe(false);
  });

  it('should check if can add more products', () => {
    const { result } = renderHook(() => useComparisonStore());

    expect(result.current.canAddMore()).toBe(true);

    act(() => {
      result.current.addProduct(mockProduct1);
      result.current.addProduct(mockProduct2);
      result.current.addProduct(mockProduct3);
      result.current.addProduct(mockProduct4);
    });

    expect(result.current.canAddMore()).toBe(false);
  });

  it('should clear all comparison products', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProduct(mockProduct1);
      result.current.addProduct(mockProduct2);
      result.current.addProduct(mockProduct3);
    });

    expect(result.current.products).toHaveLength(3);

    act(() => {
      result.current.clearComparison();
    });

    expect(result.current.products).toHaveLength(0);
  });

  it('should check if product is in comparison', () => {
    const { result } = renderHook(() => useComparisonStore());

    expect(result.current.isInComparison(1)).toBe(false);

    act(() => {
      result.current.addProduct(mockProduct1);
    });

    expect(result.current.isInComparison(1)).toBe(true);
    expect(result.current.isInComparison(2)).toBe(false);
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useComparisonStore());

    act(() => {
      result.current.addProduct(mockProduct1);
    });

    const stored = JSON.parse(
      localStorageMock.getItem('quelyos-comparison-storage') || '{}'
    );
    expect(stored.state?.products).toHaveLength(1);
    expect(stored.state?.products[0].id).toBe(1);
  });
});
