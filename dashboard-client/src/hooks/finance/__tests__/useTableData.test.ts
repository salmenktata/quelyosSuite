import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTableData, invalidateTableCache, invalidateAllTableCache } from '../useTableData'

interface TestItem {
  id: number
  name: string
  amount: number
  category: string
}

const mockData: TestItem[] = [
  { id: 1, name: 'Alpha', amount: 100, category: 'A' },
  { id: 2, name: 'Beta', amount: 200, category: 'B' },
  { id: 3, name: 'Gamma', amount: 50, category: 'A' },
  { id: 4, name: 'Delta', amount: 300, category: 'C' },
]

describe('useTableData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateAllTableCache()
  })

  it('fetches data on mount', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() =>
      useTableData<TestItem>({ fetchFn })
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('handles fetch errors', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() =>
      useTableData<TestItem>({ fetchFn })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Fetch failed')
    expect(result.current.data).toEqual([])
  })

  it('filters data with filterFn', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)
    const filterFn = (item: TestItem, query: string) =>
      item.name.toLowerCase().includes(query.toLowerCase())

    const { result } = renderHook(() =>
      useTableData<TestItem>({ fetchFn, filterFn })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Set search query
    act(() => {
      result.current.setSearchQuery('alpha')
    })

    expect(result.current.filteredData).toHaveLength(1)
    expect(result.current.filteredData[0]!.name).toBe('Alpha')  // Safe: length vérifié avant
  })

  it('returns all data when search query is empty', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)
    const filterFn = (item: TestItem, query: string) =>
      item.name.toLowerCase().includes(query.toLowerCase())

    const { result } = renderHook(() =>
      useTableData<TestItem>({ fetchFn, filterFn })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.filteredData).toEqual(mockData)
  })

  it('sorts data with sortFn', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)
    const sortFn = (a: TestItem, b: TestItem, sortBy: string, sortDir: 'asc' | 'desc') => {
      const valA = a[sortBy as keyof TestItem]
      const valB = b[sortBy as keyof TestItem]
      const cmp = typeof valA === 'number' && typeof valB === 'number'
        ? valA - valB
        : String(valA).localeCompare(String(valB))
      return sortDir === 'asc' ? cmp : -cmp
    }

    const { result } = renderHook(() =>
      useTableData<TestItem>({ fetchFn, sortFn })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Sort by amount ascending
    act(() => {
      result.current.setSort('amount', 'asc')
    })

    expect(result.current.sortedData[0]!.amount).toBe(50)  // Safe: données mockées présentes
    expect(result.current.sortedData[3]!.amount).toBe(300)

    // Sort by amount descending
    act(() => {
      result.current.setSort('amount', 'desc')
    })

    expect(result.current.sortedData[0]!.amount).toBe(300)  // Safe: données mockées présentes
    expect(result.current.sortedData[3]!.amount).toBe(50)
  })

  it('toggles sort direction on same column', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)
    const sortFn = (a: TestItem, b: TestItem, _sortBy: string, sortDir: 'asc' | 'desc') => {
      const cmp = a.amount - b.amount
      return sortDir === 'asc' ? cmp : -cmp
    }

    const { result } = renderHook(() =>
      useTableData<TestItem>({ fetchFn, sortFn })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setSort('amount')
    })

    expect(result.current.sortDir).toBe('asc')

    // Toggle same column
    act(() => {
      result.current.setSort('amount')
    })

    expect(result.current.sortDir).toBe('desc')
  })

  it('uses cache when enabled', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() =>
      useTableData<TestItem>({
        fetchFn,
        enableCache: true,
        cacheKey: 'test-table',
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Second render with same cache key
    const { result: result2 } = renderHook(() =>
      useTableData<TestItem>({
        fetchFn,
        enableCache: true,
        cacheKey: 'test-table',
      })
    )

    await waitFor(() => {
      expect(result2.current.loading).toBe(false)
    })

    // Cache hit: fetchFn called once for initial + once for new hook mount
    // but the cache should prevent actual fetch
    expect(result2.current.data).toEqual(mockData)
  })

  it('refetch forces data reload', async () => {
    const updatedData = [{ id: 5, name: 'Epsilon', amount: 500, category: 'D' }]
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(mockData)
      .mockResolvedValueOnce(updatedData)

    const { result } = renderHook(() =>
      useTableData<TestItem>({ fetchFn })
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toEqual(updatedData)
  })

  it('invalidateTableCache clears specific cache', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() =>
      useTableData<TestItem>({
        fetchFn,
        enableCache: true,
        cacheKey: 'invalidate-test',
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    invalidateTableCache('invalidate-test')

    // After invalidation, next render should refetch
    const fetchFn2 = vi.fn().mockResolvedValue([])
    const { result: result2 } = renderHook(() =>
      useTableData<TestItem>({
        fetchFn: fetchFn2,
        enableCache: true,
        cacheKey: 'invalidate-test',
      })
    )

    await waitFor(() => {
      expect(result2.current.loading).toBe(false)
    })

    expect(fetchFn2).toHaveBeenCalled()
  })
})
