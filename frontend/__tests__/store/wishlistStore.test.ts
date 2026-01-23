/**
 * Tests pour wishlistStore
 */

import { renderHook, act } from '@testing-library/react';
import { useWishlistStore } from '@/store/wishlistStore';

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

describe('wishlistStore', () => {
  beforeEach(() => {
    // Nettoyer le localStorage avant chaque test
    localStorageMock.clear();
    // Réinitialiser le store
    const { result } = renderHook(() => useWishlistStore());
    act(() => {
      result.current.clearWishlist();
    });
  });

  it('should initialize with empty items', () => {
    const { result } = renderHook(() => useWishlistStore());
    expect(result.current.items).toEqual([]);
  });

  it('should add product to wishlist', async () => {
    const { result } = renderHook(() => useWishlistStore());

    await act(async () => {
      const success = await result.current.addToWishlist(123);
      expect(success).toBe(true);
    });

    expect(result.current.items).toContain(123);
    expect(result.current.isInWishlist(123)).toBe(true);
  });

  it('should remove product from wishlist', async () => {
    const { result } = renderHook(() => useWishlistStore());

    // Ajouter d'abord
    await act(async () => {
      await result.current.addToWishlist(123);
    });

    // Puis retirer
    await act(async () => {
      await result.current.removeFromWishlist(123);
    });

    expect(result.current.items).not.toContain(123);
    expect(result.current.isInWishlist(123)).toBe(false);
  });

  it('should check if product is in wishlist', async () => {
    const { result } = renderHook(() => useWishlistStore());

    expect(result.current.isInWishlist(123)).toBe(false);

    await act(async () => {
      await result.current.addToWishlist(123);
    });

    expect(result.current.isInWishlist(123)).toBe(true);
  });

  it('should clear all wishlist items', async () => {
    const { result } = renderHook(() => useWishlistStore());

    // Ajouter plusieurs produits
    await act(async () => {
      await result.current.addToWishlist(123);
      await result.current.addToWishlist(456);
      await result.current.addToWishlist(789);
    });

    expect(result.current.items.length).toBe(3);

    // Vider
    act(() => {
      result.current.clearWishlist();
    });

    expect(result.current.items.length).toBe(0);
  });

  it('should persist to localStorage', async () => {
    const { result } = renderHook(() => useWishlistStore());

    await act(async () => {
      await result.current.addToWishlist(123);
    });

    // Vérifier que c'est dans localStorage
    const stored = JSON.parse(
      localStorageMock.getItem('quelyos-wishlist-storage') || '{}'
    );
    expect(stored.state?.items).toContain(123);
  });
});
