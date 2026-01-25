import { Skeleton } from '../common'
import { ClockIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../lib/utils/formatters'

interface TrackingValue {
  field_desc: string
  old_value: string | null
  new_value: string | null
}

interface HistoryItem {
  id: number
  author: string
  date: string | null
  body?: string | null
  tracking_values?: TrackingValue[]
  subtype?: string | null
  message_type?: string | null
}

interface OrderHistoryProps {
  history: HistoryItem[]
  isLoading: boolean
}

/**
 * Historique chronologique de la commande
 * Affiche les modifications avec ancien/nouveau valeurs
 */
export function OrderHistory({ history, isLoading }: OrderHistoryProps) {
  if (isLoading) {
    return <Skeleton height={300} />
  }

  if (!history || history.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ClockIcon className="h-5 w-5" aria-hidden="true" />
        Historique
      </h2>
      <div className="space-y-4 max-h-96 overflow-y-auto" role="log" aria-label="Historique des modifications">
        {history.map((item) => (
          <div key={item.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 pb-4">
            <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.author}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.date ? formatDate(item.date) : '-'}</p>
            </div>

            {item.tracking_values && item.tracking_values.length > 0 ? (
              <div className="space-y-1">
                {item.tracking_values.map((tracking, idx) => (
                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{tracking.field_desc} : </span>
                    <span className="line-through text-red-600 dark:text-red-400">
                      {tracking.old_value || '(vide)'}
                    </span>
                    {' → '}
                    <span className="text-green-600 dark:text-green-400">{tracking.new_value || '(vide)'}</span>
                  </div>
                ))}
              </div>
            ) : item.body ? (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {/* Nettoyer le HTML et tronquer à 200 caractères */}
                {item.body.replace(/<[^>]*>/g, '').substring(0, 200)}
                {item.body.length > 200 && '...'}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {item.subtype || item.message_type}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
