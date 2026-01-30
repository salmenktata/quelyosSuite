/**
 * Tests pour wishlistStore
 */

import { renderHook, act } from '@testing-library/react';
import { useWishlistStore } from '@/store/wishlistStore';

// Mock backendClient
jest.mock('@/lib/backend/client', () => ({
  backendClient: {
    getWishlist: jest.fn().mockResolvedValue({ success: true, wishlist: [] }),
    addToWishlist: jest.fn().mockResolvedValue({ success: true }),
    removeFromWishlist: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe('wishlistStore', () => {
  beforeEach(() => {
    // Reset store state directly
    useWishlistStore.setState({ items: [], isLoading: false, error: null });
    localStorage.clear();
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

    await act(async () => {
      await result.current.addToWishlist(123);
    });

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

    await act(async () => {
      await result.current.addToWishlist(123);
      await result.current.addToWishlist(456);
      await result.current.addToWishlist(789);
    });

    expect(result.current.items.length).toBe(3);

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

    const stored = JSON.parse(
      localStorage.getItem('quelyos-wishlist-storage') || '{}'
    );
    expect(stored.state?.items).toContain(123);
  });
});
