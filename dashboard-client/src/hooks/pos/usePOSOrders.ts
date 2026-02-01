/**
 * Hook pour les commandes POS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { usePOSCartStore, usePOSSessionStore } from '../../stores/pos'
import type { POSOrder, POSOrderSummary } from '../../types/pos'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const posOrderKeys = {
  all: ['pos-orders'] as const,
  list: (sessionId?: number) => [...posOrderKeys.all, 'list', sessionId] as const,
  detail: (id: number) => [...posOrderKeys.all, 'detail', id] as const,
}

// ============================================================================
// TYPES
// ============================================================================

interface CreateOrderParams {
  sessionId: number
  lines: {
    product_id: number
    quantity: number
    price_unit: number
    discount: number
    tax_ids: number[]
    note?: string
    offline_line_id?: string
  }[]
  partnerId?: number | null
  discountType?: 'percent' | 'fixed' | null
  discountValue?: number
  note?: string
  offlineId?: string
}

interface PayOrderParams {
  orderId: number
  payments: {
    payment_method_id: number
    amount: number
  }[]
}

interface OrdersParams {
  sessionId?: number
  limit?: number
  offset?: number
}

interface OrdersResponse {
  orders: POSOrderSummary[]
  total: number
}

// ============================================================================
// FETCHERS
// ============================================================================

async function fetchOrders(params: OrdersParams): Promise<OrdersResponse> {
  const response = await api.post<{ success: boolean; error?: string; data: OrdersResponse }>('/api/pos/orders', {
    session_id: params.sessionId,
    limit: params.limit || 50,
    offset: params.offset || 0,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du chargement des commandes')
  }
  return response.data.data!
}

async function fetchOrder(id: number): Promise<POSOrder> {
  const response = await api.post<{ success: boolean; error?: string; data: POSOrder }>(`/api/pos/order/${id}`, {})
  if (!response.data.success) {
    throw new Error(response.data.error || 'Commande non trouvée')
  }
  return response.data.data!
}

async function createOrder(params: CreateOrderParams): Promise<POSOrder> {
  const response = await api.post<{ success: boolean; error?: string; data: POSOrder }>('/api/pos/order/create', {
    session_id: params.sessionId,
    lines: params.lines,
    partner_id: params.partnerId,
    discount_type: params.discountType,
    discountvalue: params.discountValue,
    note: params.note,
    offline_id: params.offlineId,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors de la création de la commande')
  }
  return response.data.data!
}

async function payOrder(params: PayOrderParams): Promise<POSOrder> {
  const response = await api.post<{ success: boolean; error?: string; data: POSOrder }>(`/api/pos/order/${params.orderId}/pay`, {
    payments: params.payments,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors du paiement')
  }
  return response.data.data!
}

async function cancelOrder(orderId: number): Promise<void> {
  const response = await api.post(`/api/pos/order/${orderId}/cancel`, {})
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erreur lors de l\'annulation')
  }
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePOSOrders(params: OrdersParams = {}) {
  return useQuery({
    queryKey: posOrderKeys.list(params.sessionId),
    queryFn: () => fetchOrders(params),
  })
}

export function usePOSOrder(id: number | null) {
  return useQuery({
    queryKey: posOrderKeys.detail(id!),
    queryFn: () => fetchOrder(id!),
    enabled: id !== null,
  })
}

export function useCreatePOSOrder() {
  const queryClient = useQueryClient()
  const { clearCart: _clearCart } = usePOSCartStore()
  const { session, updateSessionTotals } = usePOSSessionStore()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: posOrderKeys.list(session?.id) })

      // Update session totals
      if (session) {
        updateSessionTotals({
          orderCount: (session.orderCount || 0) + 1,
          totalAmount: (session.totalAmount || 0) + order.amountTotal,
        })
      }
    },
  })
}

export function usePayPOSOrder() {
  const queryClient = useQueryClient()
  const { clearCart } = usePOSCartStore()
  const { session, updateSessionTotals } = usePOSSessionStore()

  return useMutation({
    mutationFn: payOrder,
    onSuccess: (order) => {
      // Clear the cart after successful payment
      clearCart()

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: posOrderKeys.list(session?.id) })
      queryClient.invalidateQueries({ queryKey: posOrderKeys.detail(order.id) })

      // Update session payment totals
      if (session) {
        const cashPayment = order.payments.find(p => p.methodCode === 'cash')
        const cardPayment = order.payments.find(p => p.methodCode === 'card')

        updateSessionTotals({
          totalCash: (session.totalCash || 0) + (cashPayment?.amount || 0),
          totalCard: (session.totalCard || 0) + (cardPayment?.amount || 0),
        })
      }
    },
  })
}

export function useCancelPOSOrder() {
  const queryClient = useQueryClient()
  const { session } = usePOSSessionStore()

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posOrderKeys.list(session?.id) })
    },
  })
}

// Combined hook for the full checkout flow
export function usePOSCheckout() {
  const { toOrderData } = usePOSCartStore()
  const { session } = usePOSSessionStore()
  const createOrderMutation = useCreatePOSOrder()
  const payOrderMutation = usePayPOSOrder()

  const checkout = async (payments: { payment_method_id: number; amount: number }[]) => {
    if (!session) {
      throw new Error('Aucune session active')
    }

    const orderData = toOrderData()

    // Create order
    const order = await createOrderMutation.mutateAsync({
      sessionId: session.id,
      lines: orderData.lines,
      partnerId: orderData.partner_id,
      discountType: orderData.discount_type,
      discountValue: orderData.discountvalue,
      note: orderData.note || undefined,
    })

    // Pay order
    const paidOrder = await payOrderMutation.mutateAsync({
      orderId: order.id,
      payments,
    })

    return paidOrder
  }

  return {
    checkout,
    isLoading: createOrderMutation.isPending || payOrderMutation.isPending,
    error: createOrderMutation.error || payOrderMutation.error,
  }
}
