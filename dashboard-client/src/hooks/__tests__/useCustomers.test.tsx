/**
 * Tests - useCustomers hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCustomers } from '../useCustomers'

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    getCustomers: vi.fn(),
  },
}))

import { api } from '@/lib/api'

const mockCustomers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+33612345678' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+33698765432' },
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useCustomers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches customers successfully', async () => {
    vi.mocked(api.getCustomers).mockResolvedValue({
      data: { customers: mockCustomers, total: 2 },
    })

    const { result } = renderHook(() => useCustomers(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.data?.customers).toHaveLength(2)
    expect(result.current.data?.data?.customers[0].name).toBe('John Doe')
  })

  it('handles fetch error', async () => {
    vi.mocked(api.getCustomers).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useCustomers(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Server error')
  })

  it('passes pagination params', async () => {
    vi.mocked(api.getCustomers).mockResolvedValue({ data: { customers: [], total: 0 } })

    renderHook(() => useCustomers({ limit: 20, offset: 40 }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(api.getCustomers).toHaveBeenCalledWith({ limit: 20, offset: 40 })
    })
  })

  it('passes search param', async () => {
    vi.mocked(api.getCustomers).mockResolvedValue({ data: { customers: mockCustomers, total: 2 } })

    renderHook(() => useCustomers({ search: 'john' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(api.getCustomers).toHaveBeenCalledWith({ search: 'john' })
    })
  })
})
