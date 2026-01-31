import { formatPrice } from '../../lib/utils/formatters'

interface OrderSummaryProps {
  amountUntaxed: number
  amountTax: number
  amountTotal: number
}

/**
 * Résumé financier de la commande
 * Affiche sous-total, TVA et total
 */
export function OrderSummary({ amountUntaxed, amountTax, amountTotal }: OrderSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé</h2>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatPrice(amountUntaxed)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">TVA</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatPrice(amountTax)}</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
          <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
          <span className="text-base md:text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {formatPrice(amountTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}
