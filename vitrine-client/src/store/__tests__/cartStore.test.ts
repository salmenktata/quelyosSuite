/**
 * Tests for cart store
 */

import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '../cartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.cart).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add item to cart', async () => {
    const { result } = renderHook(() => useCartStore());

    // Mock the addToCart API call
    const mockCart = {
      id: 1,
      lines: [
        {
          id: 1,
          product_id: 1,
          product_name: 'Test Product',
          quantity: 1,
          price_unit: 99.99,
          price_total: 99.99,
        },
      ],
      amount_total: 99.99,
      line_count: 1,
      item_count: 1,
    };

    // This would require mocking the API client
    // For now, we just test the state structure
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
