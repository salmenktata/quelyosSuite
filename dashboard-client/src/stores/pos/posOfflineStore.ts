/**
 * Store pour la gestion des commandes offline POS
 * Utilise IndexedDB pour la persistance et sync automatique
 */

import { create } from 'zustand'
import type { OfflineOrder } from '../../types/pos'
import { logger } from '../../lib/logger'

// ============================================================================
// INDEXEDDB SETUP
// ============================================================================

const DB_NAME = 'quelyos-pos-offline'
const DB_VERSION = 1
const STORE_NAME = 'offline-orders'

let dbInstance: IDBDatabase | null = null

async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('syncStatus', 'syncStatus', { unique: false })
        store.createIndex('sessionId', 'sessionId', { unique: false })
      }
    }
  })
}

async function saveOrderToIDB(order: OfflineOrder): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(order)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function getOrdersFromIDB(): Promise<OfflineOrder[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function _getPendingOrdersFromIDB(): Promise<OfflineOrder[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('syncStatus')
    const request = index.getAll('pending')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function deleteOrderFromIDB(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function clearSyncedOrdersFromIDB(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('syncStatus')
    const request = index.openCursor(IDBKeyRange.only('synced'))

    request.onerror = () => reject(request.error)
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }
  })
}

// ============================================================================
// TYPES
// ============================================================================

interface OfflineState {
  // State
  orders: OfflineOrder[]
  isSyncing: boolean
  lastSyncAt: string | null
  syncErrors: { orderId: string; error: string }[]

  // Actions
  addOfflineOrder: (order: Omit<OfflineOrder, 'id' | 'createdAt' | 'syncStatus'>) => Promise<string>
  updateOrderStatus: (id: string, status: OfflineOrder['syncStatus'], error?: string, serverId?: number) => Promise<void>
  removeOrder: (id: string) => Promise<void>
  loadFromIDB: () => Promise<void>
  clearSynced: () => Promise<void>

  // Sync
  setSyncing: (isSyncing: boolean) => void
  setLastSyncAt: (date: string) => void
  getPendingOrders: () => OfflineOrder[]
  getPendingCount: () => number
}

// ============================================================================
// HELPERS
// ============================================================================

const generateOfflineId = (): string => {
  return `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// ============================================================================
// STORE
// ============================================================================

export const usePOSOfflineStore = create<OfflineState>()((set, get) => ({
  // Initial state
  orders: [],
  isSyncing: false,
  lastSyncAt: null,
  syncErrors: [],

  // Add a new offline order
  addOfflineOrder: async (orderData) => {
    const id = generateOfflineId()
    const order: OfflineOrder = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    }

    // Save to IndexedDB
    await saveOrderToIDB(order)

    // Update state
    set((state) => ({
      orders: [...state.orders, order],
    }))

    return id
  },

  // Update order sync status
  updateOrderStatus: async (id, status, error, serverId) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? {
              ...order,
              syncStatus: status,
              syncError: error,
              serverId,
            }
          : order
      ),
      syncErrors:
        status === 'error'
          ? [...state.syncErrors, { orderId: id, error: error || 'Unknown error' }]
          : state.syncErrors.filter((e) => e.orderId !== id),
    }))

    // Update in IndexedDB
    const order = get().orders.find((o) => o.id === id)
    if (order) {
      await saveOrderToIDB(order)
    }
  },

  // Remove an order
  removeOrder: async (id) => {
    await deleteOrderFromIDB(id)
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      syncErrors: state.syncErrors.filter((e) => e.orderId !== id),
    }))
  },

  // Load orders from IndexedDB
  loadFromIDB: async () => {
    try {
      const orders = await getOrdersFromIDB()
      set({ orders })
    } catch (_error) {
      logger.error('Failed to load offline orders:', error)
    }
  },

  // Clear synced orders
  clearSynced: async () => {
    await clearSyncedOrdersFromIDB()
    set((state) => ({
      orders: state.orders.filter((o) => o.syncStatus !== 'synced'),
    }))
  },

  // Sync state
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),

  // Getters
  getPendingOrders: () => get().orders.filter((o) => o.syncStatus === 'pending'),
  getPendingCount: () => get().orders.filter((o) => o.syncStatus === 'pending').length,
}))

// ============================================================================
// SYNC SERVICE
// ============================================================================

export async function syncOfflineOrders(
  syncFn: (order: OfflineOrder) => Promise<{ success: boolean; serverId?: number; error?: string }>
): Promise<{ synced: number; failed: number }> {
  const store = usePOSOfflineStore.getState()
  const pendingOrders = store.getPendingOrders()

  if (pendingOrders.length === 0) {
    return { synced: 0, failed: 0 }
  }

  store.setSyncing(true)
  let synced = 0
  let failed = 0

  for (const order of pendingOrders) {
    await store.updateOrderStatus(order.id, 'syncing')

    try {
      const result = await syncFn(order)

      if (result.success) {
        await store.updateOrderStatus(order.id, 'synced', undefined, result.serverId)
        synced++
      } else {
        await store.updateOrderStatus(order.id, 'error', result.error)
        failed++
      }
    } catch (_error) {
      await store.updateOrderStatus(
        order.id,
        'error',
        error instanceof Error ? error.message : 'Sync failed'
      )
      failed++
    }
  }

  store.setSyncing(false)
  store.setLastSyncAt(new Date().toISOString())

  return { synced, failed }
}

// ============================================================================
// SELECTORS
// ============================================================================

export const selectPendingOrders = (state: OfflineState) =>
  state.orders.filter((o) => o.syncStatus === 'pending')

export const selectSyncedOrders = (state: OfflineState) =>
  state.orders.filter((o) => o.syncStatus === 'synced')

export const selectFailedOrders = (state: OfflineState) =>
  state.orders.filter((o) => o.syncStatus === 'error')

export const selectHasPendingOrders = (state: OfflineState) =>
  state.orders.some((o) => o.syncStatus === 'pending')
