/**
 * Hook pour la synchronisation offline POS
 */

import { useEffect, useCallback, useState } from 'react'
import { usePOSOfflineStore, syncOfflineOrders } from '../../stores/pos'
import { usePOSSessionStore } from '../../stores/pos'
import { api } from '../../lib/api'
import type { OfflineOrder } from '../../types/pos'

// ============================================================================
// NETWORK STATUS HOOK
// ============================================================================

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// ============================================================================
// SYNC HOOK
// ============================================================================

interface UsePOSSyncOptions {
  autoSync?: boolean
  syncInterval?: number // in ms
}

export function usePOSSync(options: UsePOSSyncOptions = {}) {
  const { autoSync = true, syncInterval = 30000 } = options

  const isOnline = useNetworkStatus()
  const { setConnectionStatus } = usePOSSessionStore()
  const {
    orders: _orders,
    isSyncing,
    lastSyncAt,
    syncErrors,
    loadFromIDB,
    getPendingCount,
    clearSynced,
  } = usePOSOfflineStore()

  // Update connection status in session store
  useEffect(() => {
    setConnectionStatus(isOnline ? 'online' : 'offline')
  }, [isOnline, setConnectionStatus])

  // Load offline orders on mount
  useEffect(() => {
    loadFromIDB()
  }, [loadFromIDB])

  // Sync function
  const syncOrder = useCallback(async (order: OfflineOrder) => {
    try {
      const response = await api.post('/api/pos/sync', {
        orders: [{
          offline_id: order.id,
          session_id: order.sessionId,
          customer_id: order.customerId,
          lines: order.lines.map((line) => ({
            offline_line_id: line.offlineLineId,
            product_id: line.productId,
            quantity: line.quantity,
            price_unit: line.priceUnit,
            discount: line.discount,
            tax_ids: line.taxIds,
            note: line.note,
          })),
          payments: order.payments.map((p) => ({
            payment_method_id: p.paymentMethodId,
            amount: p.amount,
          })),
          discount_type: order.discountType,
          discountvalue: order.discountValue,
          note: order.note,
        }],
      })

      if (response.data.success && response.data.data?.synced?.[0]) {
        return {
          success: true,
          serverId: response.data.data.synced[0].server_id,
        }
      }

      return {
        success: false,
        error: response.data.error || 'Sync failed',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }, [])

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return { synced: 0, failed: 0 }
    return syncOfflineOrders(syncOrder)
  }, [isOnline, isSyncing, syncOrder])

  // Auto sync when coming back online
  useEffect(() => {
    if (isOnline && autoSync && getPendingCount() > 0) {
      triggerSync()
    }
  }, [isOnline, autoSync, getPendingCount, triggerSync])

  // Periodic sync
  useEffect(() => {
    if (!autoSync || !isOnline) return

    const interval = setInterval(() => {
      if (getPendingCount() > 0) {
        triggerSync()
      }
    }, syncInterval)

    return () => clearInterval(interval)
  }, [autoSync, isOnline, syncInterval, getPendingCount, triggerSync])

  return {
    isOnline,
    isSyncing,
    lastSyncAt,
    pendingCount: getPendingCount(),
    syncErrors,
    triggerSync,
    clearSynced,
  }
}

// ============================================================================
// OFFLINE ORDER CREATION HOOK
// ============================================================================

export function useOfflineOrder() {
  const { addOfflineOrder } = usePOSOfflineStore()
  const { session } = usePOSSessionStore()
  const isOnline = useNetworkStatus()

  const createOfflineOrder = useCallback(
    async (orderData: {
      customerId: number | null
      lines: OfflineOrder['lines']
      payments: OfflineOrder['payments']
      discountType: OfflineOrder['discountType']
      discountValue: number
      total: number
      note?: string
    }) => {
      if (!session) {
        throw new Error('No active session')
      }

      const offlineId = await addOfflineOrder({
        sessionId: session.id,
        customerId: orderData.customerId,
        lines: orderData.lines,
        payments: orderData.payments,
        discountType: orderData.discountType,
        discountValue: orderData.discountValue,
        total: orderData.total,
        note: orderData.note,
        isPaid: true,
      })

      return offlineId
    },
    [session, addOfflineOrder]
  )

  return {
    createOfflineOrder,
    isOnline,
    canCreateOffline: !isOnline && session !== null,
  }
}
