import { Link } from 'react-router-dom'
import { Badge, Skeleton } from '../common'
import { ChevronRight, Clock } from 'lucide-react'
import { formatPrice, formatDate } from '../../lib/utils/formatters'
import { getOrderStatusVariant, getOrderStatusLabel } from '../../lib/utils/order-status'
import type { RecentOrder } from '../../hooks/useDashboard'

interface DashboardRecentOrdersProps {
  orders: RecentOrder[] | undefined
  isLoading: boolean
}

/**
 * Section commandes récentes du dashboard
 * Affiche les 5 dernières commandes avec lien vers détail
 */
export function DashboardRecentOrders({ orders, isLoading }: DashboardRecentOrdersProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" aria-hidden="true" />
          Commandes récentes
        </h3>
        <div className="space-y-3">
          <Skeleton height={80} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" aria-hidden="true" />
          Commandes récentes
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Aucune commande récente</p>
          <Link
            to="/store/orders"
            className="inline-block mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Voir toutes les commandes →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5" aria-hidden="true" />
          Commandes récentes
        </h3>
        <Link
          to="/store/orders"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline hidden sm:inline"
        >
          Voir tout →
        </Link>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.name}</p>
                <Badge variant={getOrderStatusVariant(order.state)} size="sm">
                  {getOrderStatusLabel(order.state)}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{order.customer_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(order.date_order)}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPrice(order.amount_total)}
              </p>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/store/orders"
        className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4 sm:hidden"
      >
        Voir toutes les commandes →
      </Link>
    </div>
  )
}
