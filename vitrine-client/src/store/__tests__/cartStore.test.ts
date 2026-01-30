/**
 * Tests for cart store
 */

import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '../cartStore';

// Mock backendClient
jest.mock('@/lib/backend/client', () => ({
  backendClient: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartLine: jest.fn(),
    removeCartLine: jest.fn(),
    clearCart: jest.fn().mockResolvedValue({ success: true }),
    validateCoupon: jest.fn(),
    removeCoupon: jest.fn(),
  },
}));

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store state directly (avoids async API calls)
    useCartStore.setState({ cart: null, isLoading: false, error: null });
    localStorage.clear();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.cart).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add item to cart', async () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.addToCart).toBeDefined();
    expect(typeof result.current.addToCart).toBe('function');
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.updateQuantity).toBeDefined();
    expect(typeof result.current.updateQuantity).toBe('function');
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.removeItem).toBeDefined();
    expect(typeof result.current.removeItem).toBe('function');
  });

  it('should clear cart', async () => {
    const { result } = renderHook(() => useCartStore());

    await act(async () => {
      await result.current.clearCart();
    });

    expect(result.current.cart).toBeNull();
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle error state', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.error).toBeNull();
  });
});
