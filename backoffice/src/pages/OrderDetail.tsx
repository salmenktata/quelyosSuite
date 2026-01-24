import { Link, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useOrder, useUpdateOrderStatus } from '../hooks/useOrders'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const orderId = parseInt(id || '0', 10)
  const { data, isLoading, error } = useOrder(orderId)
  const updateStatus = useUpdateOrderStatus()

  const handleUpdateStatus = async (action: 'confirm' | 'cancel' | 'done') => {
    if (!orderId) return

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${
          action === 'confirm'
            ? 'confirmer'
            : action === 'cancel'
            ? 'annuler'
            : 'marquer comme terminée'
        } cette commande ?`
      )
    ) {
      try {
        await updateStatus.mutateAsync({ id: orderId, action })
        alert('Statut mis à jour avec succès')
      } catch (err) {
        alert('Erreur lors de la mise à jour du statut')
      }
    }
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'sale':
        return 'bg-green-100 text-green-800'
      case 'done':
        return 'bg-indigo-100 text-indigo-800'
      case 'cancel':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !data?.order) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center text-red-600">
            Erreur lors du chargement de la commande
          </div>
        </div>
      </Layout>
    )
  }

  const order = data.order

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="text-indigo-600 hover:text-indigo-800 flex items-center mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour aux commandes
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Commande {order.name}</h1>
              <p className="text-gray-600 mt-2">Passée le {formatDate(order.date_order)}</p>
            </div>

            <span
              className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                order.state
              )}`}
            >
              {getStatusLabel(order.state)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations client */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations client</h2>
              {order.customer ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm font-medium text-gray-900">{order.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.customer.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.customer.street || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ville</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.customer.zip} {order.customer.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pays</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.customer.country || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune information client</p>
              )}
            </div>

            {/* Lignes de commande */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {line.product.image && (
                            <img
                              src={line.product.image}
                              alt={line.product.name}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {line.product.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPrice(line.price_unit)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{line.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(line.price_total)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé et actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(order.amount_untaxed)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(order.amount_tax)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-base font-bold text-indigo-600">
                    {formatPrice(order.amount_total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

              <div className="space-y-3">
                {order.state === 'draft' && (
                  <button
                    onClick={() => handleUpdateStatus('confirm')}
                    disabled={updateStatus.isPending}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmer la commande
                  </button>
                )}

                {(order.state === 'draft' || order.state === 'sent' || order.state === 'sale') && (
                  <button
                    onClick={() => handleUpdateStatus('cancel')}
                    disabled={updateStatus.isPending}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler la commande
                  </button>
                )}

                {order.state === 'sale' && (
                  <button
                    onClick={() => handleUpdateStatus('done')}
                    disabled={updateStatus.isPending}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Marquer comme terminée
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
