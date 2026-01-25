import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCustomer, useUpdateCustomer } from '../hooks/useCustomerDetail'
import { Badge, Button, Breadcrumbs, Skeleton, Modal } from '../components/common'
import { useToast } from '../hooks/useToast'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const customerId = parseInt(id || '0', 10)
  const { data, isLoading, error } = useCustomer(customerId)
  const updateCustomer = useUpdateCustomer()
  const { addToast } = useToast()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    mobile: '',
    street: '',
    city: '',
    zip: '',
  })

  const customer = data?.customer

  const openEditModal = () => {
    if (customer) {
      setEditForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        street: customer.street || '',
        city: customer.city || '',
        zip: customer.zip || '',
      })
      setIsEditModalOpen(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateCustomer.mutateAsync({ id: customerId, data: editForm })
      addToast('success', 'Client mis à jour avec succès')
      setIsEditModalOpen(false)
    } catch {
      addToast('error', 'Erreur lors de la mise à jour')
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

  const formatDateTime = (dateString: string | null) => {
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

  const getStateVariant = (
    state: string
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (state) {
      case 'sale':
      case 'done':
        return 'success'
      case 'sent':
        return 'info'
      case 'draft':
        return 'neutral'
      case 'cancel':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Brouillon'
      case 'sent':
        return 'Envoye'
      case 'sale':
        return 'Confirme'
      case 'done':
        return 'Termine'
      case 'cancel':
        return 'Annule'
      default:
        return state
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <Skeleton height={32} className="mb-6 max-w-xs" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton height={300} />
            </div>
            <div>
              <Skeleton height={200} />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !customer) {
    return (
      <Layout>
        <div className="p-8">
          <Breadcrumbs
            items={[
              { label: 'Tableau de bord', href: '/dashboard' },
              { label: 'Clients', href: '/customers' },
              { label: 'Erreur' },
            ]}
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center mt-6">
            <svg
              className="w-16 h-16 mx-auto text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Client introuvable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Le client demande n'existe pas ou a ete supprime.
            </p>
            <Link to="/customers">
              <Button variant="primary">Retour aux clients</Button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Clients', href: '/customers' },
            { label: customer.name },
          ]}
        />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {customer.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Client depuis le {formatDate(customer.create_date)}
            </p>
          </div>
          <Button variant="primary" onClick={openEditModal}>
            Modifier
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coordonnees */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Coordonnees
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{customer.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Telephone</label>
                  <p className="text-gray-900 dark:text-white">{customer.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Mobile</label>
                  <p className="text-gray-900 dark:text-white">{customer.mobile || '-'}</p>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Adresse principale
              </h2>
              {customer.street || customer.city ? (
                <div className="text-gray-900 dark:text-white">
                  {customer.street && <p>{customer.street}</p>}
                  {customer.street2 && <p>{customer.street2}</p>}
                  <p>
                    {customer.zip && `${customer.zip} `}
                    {customer.city}
                  </p>
                  {customer.country && <p>{customer.country}</p>}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Aucune adresse renseignee</p>
              )}
            </div>

            {/* Historique des commandes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historique des commandes
                </h2>
              </div>
              {customer.orders && customer.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Commande
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Montant
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {customer.orders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/orders/${order.id}`}
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {order.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDateTime(order.date_order)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStateVariant(order.state)}>
                              {getStateLabel(order.state)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatPrice(order.amount_total)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune commande pour ce client
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Statistiques */}
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistiques
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total depense
                  </span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(customer.total_spent)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Commandes</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {customer.orders_count}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Panier moyen
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {customer.orders_count > 0
                      ? formatPrice(customer.total_spent / customer.orders_count)
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Adresses additionnelles */}
            {customer.addresses && customer.addresses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Autres adresses
                </h2>
                <div className="space-y-3">
                  {customer.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {addr.name}
                        </span>
                        {addr.type && (
                          <Badge variant="neutral" size="sm">
                            {addr.type === 'delivery' ? 'Livraison' : 'Facturation'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {addr.street && `${addr.street}, `}
                        {addr.zip} {addr.city}
                        {addr.country && `, ${addr.country}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Edition */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier le client"
          hideDefaultActions={true}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telephone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mobile
                </label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={editForm.street}
                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  value={editForm.zip}
                  onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" loading={updateCustomer.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  )
}
