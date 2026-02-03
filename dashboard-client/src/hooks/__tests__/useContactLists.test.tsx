/**
 * Tests - useContactLists hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useContactLists, useCreateContactList, useDeleteContactList } from '../useContactLists'

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

import { api } from '@/lib/api'

const mockContactLists = [
  { id: 1, name: 'VIP Clients', contact_count: 150, list_type: 'static', created_at: '2024-01-15' },
  { id: 2, name: 'Newsletter', contact_count: 1200, list_type: 'dynamic', created_at: '2024-01-10' },
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

describe('useContactLists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches contact lists successfully', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, contact_lists: mockContactLists, total: 2 },
    })

    const { result } = renderHook(() => useContactLists(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.lists).toHaveLength(2)
    expect(result.current.data?.lists[0]!.name).toBe('VIP Clients')  // Safe: length vérifié avant
  })

  it('handles fetch error', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: false, error: 'Server error' },
    })

    const { result } = renderHook(() => useContactLists(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useCreateContactList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates contact list successfully', async () => {
    const newList = { id: 3, name: 'New List', contact_count: 0 }
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, contact_list: newList },
    })

    const { result } = renderHook(() => useCreateContactList(), { wrapper: createWrapper() })

    result.current.mutate({ name: 'New List' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.post).toHaveBeenCalledWith('/api/marketing/contact-lists/create', { name: 'New List' })
  })
})

describe('useDeleteContactList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes contact list successfully', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true },
    })

    const { result } = renderHook(() => useDeleteContactList(), { wrapper: createWrapper() })

    result.current.mutate(1)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.post).toHaveBeenCalledWith('/api/marketing/contact-lists/1/delete', {})
  })
})
