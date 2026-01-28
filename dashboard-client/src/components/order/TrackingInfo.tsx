import { useShippingTracking } from '../../hooks/useOrders'
import { Button } from '../common'
import { Truck, AlertCircle } from 'lucide-react'

interface TrackingInfoProps {
  orderId: number
}

export function TrackingInfo({ orderId }: TrackingInfoProps) {
  const { data, isLoading } = useShippingTracking(orderId)

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Suivi de livraison
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!data?.data || data.data.status === 'no_tracking') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Suivi de livraison
        </h3>
        <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <AlertCircle className="h-6 w-6 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {data?.data?.message || 'Aucun suivi disponible pour cette commande'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tracking = data.data

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5" />
        Suivi de livraison
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Transporteur</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {tracking.carrier_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Numéro de suivi</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 font-mono">
              {tracking.tracking_ref}
            </p>
          </div>
        </div>

        {tracking.shipment_date && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Date d'expédition</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {new Date(tracking.shipment_date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {tracking.tracking_url && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href={tracking.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" className="w-full">
                Suivre le colis
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
