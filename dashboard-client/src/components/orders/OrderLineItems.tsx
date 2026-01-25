import { formatPrice } from '../../lib/utils/formatters'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'

interface OrderLine {
  id: number
  product: {
    name: string
    image?: string | null
  }
  quantity: number
  price_unit: number
  price_total: number
}

interface OrderLineItemsProps {
  lines: OrderLine[]
}

/**
 * Section articles de la commande
 * Responsive : tableau sur desktop (lg+), cards sur mobile
 */
export function OrderLineItems({ lines }: OrderLineItemsProps) {
  if (!lines || lines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <ShoppingBagIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun article</h3>
        <p className="text-gray-600 dark:text-gray-400">Cette commande ne contient aucun article.</p>
      </div>
    )
  }

  return (
    <>
      {/* Vue Desktop : Tableau */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Articles</h2>
        </div>

        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Produit
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Prix unitaire
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Quantité
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {line.product.image ? (
                      <img
                        src={line.product.image}
                        alt={line.product.name}
                        className="w-12 h-12 rounded-lg object-cover mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                        <ShoppingBagIcon className="w-6 h-6 text-gray-400" aria-hidden="true" />
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{line.product.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{formatPrice(line.price_unit)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{line.quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPrice(line.price_total)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue Mobile : Cards */}
      <div className="lg:hidden space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white px-1">Articles</h2>
        {lines.map((line) => (
          <div
            key={line.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-4">
              {line.product.image ? (
                <img
                  src={line.product.image}
                  alt={line.product.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <ShoppingBagIcon className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{line.product.name}</p>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Prix unitaire :</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(line.price_unit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantité :</span>
                    <span className="font-medium text-gray-900 dark:text-white">{line.quantity}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 mt-2">
                    <span className="font-semibold">Total :</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatPrice(line.price_total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
