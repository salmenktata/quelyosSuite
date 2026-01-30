import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { usePaymentTransactions, useRefundTransaction, PaymentTransaction } from '../hooks/usePayments'
import { Badge, Button, Breadcrumbs, SkeletonTable, Modal, PageNotice } from '../components/common'
import { crmNotices } from '@/lib/notices'
import { RefreshCw } from 'lucide-react'

export default function Payments() {
  const [page, setPage] = useState(0)
  const [stateFilter, setStateFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [refundAmount, setRefundAmount] = useState<string>('')
  const [refundReason, setRefundReason] = useState<string>('')
  const limit = 20

  const { data, isLoading, error } = usePaymentTransactions({
    limit,
    offset: page * limit,
    state: stateFilter || undefined,
    search: search || undefined,
  })

  const refundMutation = useRefundTransaction()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleOpenRefundModal = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction)
    setRefundAmount(transaction.amount.toString())
    setRefundReason('')
    setRefundModalOpen(true)
  }

  const handleCloseRefundModal = () => {
    setRefundModalOpen(false)
    setSelectedTransaction(null)
    setRefundAmount('')
    setRefundReason('')
  }

  const handleRefund = async () => {
    if (!selectedTransaction) return

    try {
      await refundMutation.mutateAsync({
        transactionId: selectedTransaction.id,
        amount: parseFloat(refundAmount) || undefined,
        reason: refundReason || undefined,
      })

      alert(`Remboursement de ${formatPrice(parseFloat(refundAmount), selectedTransaction.currency)} effectué avec succès !`)
      handleCloseRefundModal()
    } catch (error) {
      alert("Erreur lors du remboursement : " + (error as Error).message)
    }
  }

  const getStateVariant = (
    state: string
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (state) {
      case 'done':
        return 'success'
      case 'pending':
      case 'authorized':
        return 'warning'
      case 'error':
      case 'cancel':
        return 'error'
      case 'draft':
      default:
        return 'neutral'
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

  const formatPrice = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const transactions = data?.data?.transactions || []
  const total = data?.data?.total || 0
  const stats = data?.data?.stats

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Paiements' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paiements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visualiser et suivre toutes les transactions de paiement
          </p>
        </div>

        <PageNotice config={crmNotices.payments} className="mb-6" />

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completees</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.done}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Echouees</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">CA total</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatPrice(stats.total_amount)}
              </p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par reference ou client..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <Button type="submit" variant="primary">
                Rechercher
              </Button>
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch('')
                    setSearchInput('')
                    setPage(0)
                  }}
                >
                  Reset
                </Button>
              )}
            </form>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
                Statut :
              </label>
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value)
                  setPage(0)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Tous</option>
                <option value="draft">Brouillon</option>
                <option value="pending">En attente</option>
                <option value="authorized">Autorise</option>
                <option value="done">Complete</option>
                <option value="error">Erreur</option>
                <option value="cancel">Annule</option>
              </select>

              {stateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStateFilter('')
                    setPage(0)
                  }}
                >
                  Reinitialiser
                </Button>
              )}
            </div>
          </div>

          {total > 0 && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {total} transaction{total > 1 ? 's' : ''}
              {search && ` pour "${search}"`}
              {stateFilter && ` avec statut "${stateFilter}"`}
            </div>
          )}
        </div>

        {/* Liste des transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des transactions
            </div>
          ) : transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Reference
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
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Commande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.reference}
                          </div>
                          {transaction.provider_reference && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {transaction.provider_reference.substring(0, 20)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(transaction.create_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.partner.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.partner.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPrice(transaction.amount, transaction.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {transaction.provider.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStateVariant(transaction.state)}>
                            {transaction.state_label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.order ? (
                            <Link
                              to={`/orders/${transaction.order.id}`}
                              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {transaction.order.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.state === 'done' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenRefundModal(transaction)}
                              icon={<RefreshCw className="h-4 w-4" />}
                            >
                              Rembourser
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
                    Affichage {page * limit + 1} a {Math.min((page + 1) * limit, total)} sur {total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Precedent
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune transaction
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {search || stateFilter
                  ? 'Aucune transaction ne correspond a vos criteres.'
                  : 'Les transactions de paiement apparaitront ici.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal de remboursement */}
        <Modal
          isOpen={refundModalOpen}
          onClose={handleCloseRefundModal}
          onConfirm={handleRefund}
          title="Rembourser la transaction"
          description={
            selectedTransaction
              ? `Remboursement de la transaction ${selectedTransaction.reference}`
              : ''
          }
          confirmText="Confirmer le remboursement"
          cancelText="Annuler"
          variant="danger"
          loading={refundMutation.isPending}
          size="md"
        >
          <div className="space-y-4">
            {selectedTransaction && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Montant à rembourser
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedTransaction.amount}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Montant"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTransaction.currency}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Montant maximum : {formatPrice(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                    Raison du remboursement
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    placeholder="Optionnel : expliquez la raison du remboursement..."
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-amber-600 dark:text-amber-400"
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
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                        Attention
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        Cette action changera l'état de la transaction à "Annulée" et annulera les commandes associées non terminées. Le remboursement réel doit être effectué manuellement via votre système de paiement.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
