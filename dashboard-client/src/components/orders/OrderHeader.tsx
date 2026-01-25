import { Badge } from '../common'
import { getOrderStatusVariant, getOrderStatusLabel } from '../../lib/utils/order-status'
import { formatDate } from '../../lib/utils/formatters'

interface OrderHeaderProps {
  orderName: string
  orderDate: string | null
  orderState: string
}

/**
 * En-tête de la page détail commande
 * Affiche le titre, la date et le badge de statut
 */
export function OrderHeader({ orderName, orderDate, orderState }: OrderHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Commande {orderName}
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
            Passée le {formatDate(orderDate)}
          </p>
        </div>

        <Badge variant={getOrderStatusVariant(orderState)} size="lg">
          {getOrderStatusLabel(orderState)}
        </Badge>
      </div>
    </div>
  )
}
