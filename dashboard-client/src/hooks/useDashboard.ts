import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Order } from '@quelyos/types'

export interface DashboardStats {
  revenue: {
    total: number
    variation: number // % vs période précédente
  }
  orders: {
    total: number
    variation: number
    pending: number
  }
  customers: {
    total: number
    variation: number
    new_this_month: number
  }
  products: {
    total: number
    low_stock: number
    out_of_stock: number
  }
}

export interface RecentOrder {
  id: number
  name: string
  customer_name: string
  amount_total: number
  state: string
  date_order: string
}

/**
 * Hook pour récupérer les statistiques du dashboard
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Utiliser l'endpoint analytics existant
      const response = await api.getAnalyticsStats()

      if (!response.data) {
        throw new Error('No data received from analytics API')
      }

      const totals = response.data.totals

      // Calculer les statistiques du dashboard
      const stats: DashboardStats = {
        revenue: {
          total: totals?.revenue || 0,
          variation: 0, // TODO: calculer la variation quand endpoint disponible
        },
        orders: {
          total: totals?.orders || 0,
          variation: 0,
          pending: totals?.pending_orders || 0,
        },
        customers: {
          total: totals?.customers || 0,
          variation: 0,
          new_this_month: 0, // TODO: calculer quand endpoint disponible
        },
        products: {
          total: totals?.products || 0,
          low_stock: totals?.low_stock_products || 0,
          out_of_stock: totals?.out_of_stock_products || 0,
        },
      }

      return stats
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Actualiser toutes les 5 minutes
  })
}

/**
 * Hook pour récupérer les commandes récentes
 */
export function useDashboardRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ['dashboard-recent-orders', limit],
    queryFn: async () => {
      const response = await api.getOrders({ limit, offset: 0 })

      if (!response) {
        return []
      }

      const orders = (response.items || response.data || []) as Order[]

      // Vérifier que c'est bien un tableau
      if (!Array.isArray(orders)) {
        return []
      }

      // Mapper les commandes au format RecentOrder
      return orders.map((order) => ({
        id: order.id,
        name: order.name,
        customer_name: order.customer?.name || 'Client inconnu',
        amount_total: order.amount_total,
        state: order.state,
        date_order: order.date_order || '',
      })) as RecentOrder[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
