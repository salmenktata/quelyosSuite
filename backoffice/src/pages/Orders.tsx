import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useOrders } from '../hooks/useOrders'
import { Badge, Button, Breadcrumbs, SkeletonTable } from '../components/common'

export default function Orders() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const limit = 20

  const { data, isLoading, error } = useOrders({
    limit,
    offset: page * limit,
    status: statusFilter || undefined,
  })

  const getStatusVariant = (state: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (state) {
      case 'sale':
        return 'success'
      case 'sent':
        return 'info'
      case 'done':
        return 'success'
      case 'cancel':
        return 'error'
      case 'draft':
      default:
        return 'neutral'
    }
  }

  const getStatusLabel = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Brouillon'
      case 'sent':
        return 'Envoyé'
      case 'sale':
        return 'Confirmé'
      case 'done':
        return 'Terminé'
      case 'cancel':
        return 'Annulé'
      default:
        return state
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const orders = data?.data?.orders || []
  const total = data?.data?.total || 0

  return (
    <Layout>
      <div className="p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Commandes' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Commandes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gérer et suivre toutes les commandes</p>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut :</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
              >
                <option value="">Tous</option>
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyé</option>
                <option value="sale">Confirmé</option>
                <option value="done">Terminé</option>
                <option value="cancel">Annulé</option>
              </select>

              {statusFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('')
                    setPage(0)
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {total > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {total} commande{total > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des commandes
            </div>
          ) : orders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        N° Commande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(order.date_order)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.customer ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.customer.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {order.customer.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(order.amount_total)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusVariant(order.state)}>
                            {getStatusLabel(order.state)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link to={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              Voir détails
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage {page * limit + 1} à {Math.min((page + 1) * limit, total)} sur{' '}
                    {total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= total}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune commande
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {statusFilter
                  ? `Aucune commande avec le statut "${getStatusLabel(statusFilter)}"`
                  : 'Aucune commande trouvée'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
