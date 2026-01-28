import { Users, Euro, BarChart3 } from 'lucide-react'
import { formatPrice } from '../../lib/utils/formatters'

interface CustomerStatsProps {
  totalCustomers: number
  totalRevenue: number
  avgBasket: number
}

export function CustomerStats({ totalCustomers, totalRevenue, avgBasket }: CustomerStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total clients</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {totalCustomers}
            </p>
          </div>
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenu total</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {formatPrice(totalRevenue)}
            </p>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Euro className="h-6 w-6 md:h-8 md:w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Panier moyen</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {formatPrice(avgBasket)}
            </p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
