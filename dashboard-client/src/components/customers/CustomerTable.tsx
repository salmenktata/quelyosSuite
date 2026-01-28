import { Link } from 'react-router-dom'
import { Badge } from '../common'
import { Eye, ArrowUp, ArrowDown } from 'lucide-react'
import type { CustomerListItem } from '@/types'
import { formatDate, formatPrice } from '../../lib/utils/formatters'

type SortField = 'name' | 'email' | 'orders_count' | 'total_spent' | 'create_date'
type SortOrder = 'asc' | 'desc'

interface CustomerTableProps {
  customers: CustomerListItem[]
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
}

function SortIcon({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) {
  if (sortField !== field) return null
  return sortOrder === 'asc' ? (
    <ArrowUp className="h-4 w-4 inline ml-1" aria-hidden="true" />
  ) : (
    <ArrowDown className="h-4 w-4 inline ml-1" aria-hidden="true" />
  )
}

export function CustomerTable({ customers, sortField, sortOrder, onSort }: CustomerTableProps) {
  const getSortAriaLabel = (field: SortField) => {
    const isCurrentSort = sortField === field
    const nextOrder = isCurrentSort && sortOrder === 'asc' ? 'descendant' : 'ascendant'
    return `Trier par ${field === 'name' ? 'nom' : field === 'email' ? 'contact' : field === 'orders_count' ? 'commandes' : field === 'total_spent' ? 'total dépensé' : 'date d\'inscription'} en ordre ${nextOrder}`
  }

  return (
    <>
      {/* Vue Desktop : Tableau */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                onClick={() => onSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSort('name')}
                aria-label={getSortAriaLabel('name')}
                aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Nom <SortIcon field="name" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th
                scope="col"
                onClick={() => onSort('email')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSort('email')}
                aria-label={getSortAriaLabel('email')}
                aria-sort={sortField === 'email' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Contact <SortIcon field="email" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Adresse
              </th>
              <th
                scope="col"
                onClick={() => onSort('orders_count')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSort('orders_count')}
                aria-label={getSortAriaLabel('orders_count')}
                aria-sort={sortField === 'orders_count' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Commandes <SortIcon field="orders_count" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th
                scope="col"
                onClick={() => onSort('total_spent')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSort('total_spent')}
                aria-label={getSortAriaLabel('total_spent')}
                aria-sort={sortField === 'total_spent' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Total dépensé <SortIcon field="total_spent" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th
                scope="col"
                onClick={() => onSort('create_date')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSort('create_date')}
                aria-label={getSortAriaLabel('create_date')}
                aria-sort={sortField === 'create_date' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Inscrit le <SortIcon field="create_date" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                <td className="px-6 py-4">
                  <Link
                    to={`/crm/customers/${customer.id}`}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded block truncate max-w-xs"
                    title={customer.name}
                  >
                    {customer.name || customer.email || `Client #${customer.id}`}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="text-sm text-gray-900 dark:text-white truncate" title={customer.email || undefined}>
                      {customer.email || '-'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.phone || customer.mobile || '-'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={customer.city ? `${customer.zip || ''} ${customer.city}${customer.country ? `, ${customer.country}` : ''}`.trim() : undefined}>
                    {customer.city ? (
                      <>
                        {customer.zip && `${customer.zip} `}
                        {customer.city}
                        {customer.country && `, ${customer.country}`}
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {(customer.orders_count ?? 0) > 0 ? (
                      <Badge variant="info">{customer.orders_count}</Badge>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {(customer.total_spent ?? 0) > 0 ? (
                      formatPrice(customer.total_spent ?? 0)
                    ) : (
                      <span className="text-gray-400">0,00 €</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(customer.create_date ?? null)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    to={`/crm/customers/${customer.id}`}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
                    aria-label={`Voir les détails de ${customer.name}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Détails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue Mobile : Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <Link
                to={`/crm/customers/${customer.id}`}
                className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                {customer.name}
              </Link>
              {(customer.orders_count ?? 0) > 0 && <Badge variant="info">{customer.orders_count} cmd</Badge>}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email :</span>
                <span className="text-gray-900 dark:text-white">{customer.email || '-'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Téléphone :</span>
                <span className="text-gray-900 dark:text-white">{customer.phone || customer.mobile || '-'}</span>
              </div>

              {customer.city && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ville :</span>
                  <span className="text-gray-900 dark:text-white">
                    {customer.zip && `${customer.zip} `}
                    {customer.city}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total dépensé :</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(customer.total_spent ?? 0) > 0 ? formatPrice(customer.total_spent ?? 0) : '0,00 €'}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Inscrit le :</span>
                <span className="text-gray-600 dark:text-gray-300">{formatDate(customer.create_date ?? null)}</span>
              </div>
            </div>

            <Link
              to={`/crm/customers/${customer.id}`}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label={`Voir les détails de ${customer.name}`}
            >
              <Eye className="h-5 w-5" aria-hidden="true" />
              Voir les détails
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
