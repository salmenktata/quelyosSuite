/**
 * Tests - useProducts hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProducts, useCreateProduct, useDeleteProduct } from '../useProducts'

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}))

import { api } from '@/lib/api'

const mockProducts = [
  { id: 1, name: 'Product A', sku: 'SKU-001', price: 29.99, stock_quantity: 100 },
  { id: 2, name: 'Product B', sku: 'SKU-002', price: 49.99, stock_quantity: 50 },
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches products successfully', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      data: { products: mockProducts, total: 2 },
    })

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.data?.products).toHaveLength(2)
    expect(result.current.data?.data?.products[0].name).toBe('Product A')
  })

  it('handles fetch error', async () => {
    vi.mocked(api.getProducts).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Network error')
  })

  it('passes query params to API', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ data: { products: [], total: 0 } })

    renderHook(() => useProducts({ limit: 10, search: 'test' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(api.getProducts).toHaveBeenCalledWith({ limit: 10, search: 'test' })
    })
  })
})

describe('useCreateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates product successfully', async () => {
    const newProduct = { id: 3, name: 'New Product', price: 19.99 }
    vi.mocked(api.createProduct).mockResolvedValue(newProduct)

    const { result } = renderHook(() => useCreateProduct(), { wrapper: createWrapper() })

    result.current.mutate({ name: 'New Product', price: 19.99 } as any)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.createProduct).toHaveBeenCalledWith({ name: 'New Product', price: 19.99 })
  })
})

describe('useDeleteProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes product with optimistic update', async () => {
    vi.mocked(api.deleteProduct).mockResolvedValue({ success: true })

    const { result } = renderHook(() => useDeleteProduct(), { wrapper: createWrapper() })

    result.current.mutate(1)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.deleteProduct).toHaveBeenCalledWith(1)
  })
})
