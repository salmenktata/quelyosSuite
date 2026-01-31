import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useInvoices, useSendInvoiceEmail, useDownloadInvoicePDF } from '../hooks/useInvoices'
import { Badge, Button, Breadcrumbs, SkeletonTable, PageNotice } from '../components/common'
import { crmNotices } from '@/lib/notices'
import { FileTextIcon, DownloadIcon, MailIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@quelyos/logger';

export default function Invoices() {
  const [page, setPage] = useState(0)
  const [stateFilter, setStateFilter] = useState<string>('')
  const [paymentStateFilter, setPaymentStateFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const limit = 20

  const { data, isLoading, error } = useInvoices({
    limit,
    offset: page * limit,
    state: stateFilter || undefined,
    payment_state: paymentStateFilter || undefined,
    search: search || undefined,
  })

  const sendEmailMutation = useSendInvoiceEmail()
  const downloadPDFMutation = useDownloadInvoicePDF()

  const getStateVariant = (
    state: string
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (state) {
      case 'posted':
        return 'info'
      case 'cancel':
        return 'error'
      case 'draft':
      default:
        return 'neutral'
    }
  }

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Brouillon'
      case 'posted':
        return 'Comptabilisé'
      case 'cancel':
        return 'Annulé'
      default:
        return state
    }
  }

  const getPaymentStateVariant = (
    paymentState: string
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (paymentState) {
      case 'paid':
        return 'success'
      case 'in_payment':
      case 'partial':
        return 'warning'
      case 'not_paid':
        return 'error'
      case 'reversed':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  const getPaymentStateLabel = (paymentState: string) => {
    switch (paymentState) {
      case 'not_paid':
        return 'Non payé'
      case 'in_payment':
        return 'En cours'
      case 'paid':
        return 'Payé'
      case 'partial':
        return 'Partiel'
      case 'reversed':
        return 'Remboursé'
      default:
        return paymentState
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleResetFilters = () => {
    setStateFilter('')
    setPaymentStateFilter('')
    setSearch('')
    setSearchInput('')
    setPage(0)
  }

  const handleSendEmail = async (invoiceId: number, invoiceName: string) => {
    try {
      await sendEmailMutation.mutateAsync(invoiceId)
      toast.success(`Facture ${invoiceName} envoyée par email`)
    } catch (err) {
      logger.error("Erreur:", err);
      toast.error(`Erreur lors de l'envoi de la facture: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  const handleDownloadPDF = async (invoiceId: number, invoiceName: string) => {
    try {
      await downloadPDFMutation.mutateAsync({ invoiceId, invoiceName })
      toast.success(`Facture ${invoiceName} téléchargée`)
    } catch (err) {
      logger.error("Erreur:", err);
      toast.error(`Erreur lors du téléchargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  const hasActiveFilters = stateFilter || paymentStateFilter || search

  const invoices = data?.data?.invoices || []
  const total = data?.data?.total || 0
  const stats = data?.data?.stats

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Factures' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Factures</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérer et suivre toutes les factures clients
          </p>
        </div>

        <PageNotice config={crmNotices.invoices} className="mb-6" />

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total factures</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payées</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.paid}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <XCircleIcon className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Brouillon</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.draft}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FileTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(stats.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="space-y-4">
            {/* Ligne 1 : Recherche */}
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher par numéro de facture ou nom client..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <Button type="submit" variant="primary">
                Rechercher
              </Button>
            </form>

            {/* Ligne 2 : Filtres */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Filtre par état */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
                  État :
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
                  <option value="posted">Comptabilisé</option>
                  <option value="cancel">Annulé</option>
                </select>
              </div>

              {/* Filtre par paiement */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
                  Paiement :
                </label>
                <select
                  value={paymentStateFilter}
                  onChange={(e) => {
                    setPaymentStateFilter(e.target.value)
                    setPage(0)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Tous</option>
                  <option value="not_paid">Non payé</option>
                  <option value="in_payment">En cours</option>
                  <option value="paid">Payé</option>
                  <option value="partial">Partiel</option>
                  <option value="reversed">Remboursé</option>
                </select>
              </div>

              {/* Bouton Reset */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleResetFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {error && (
            <div className="p-6 text-center" role="alert">
              <p className="text-red-600 dark:text-red-400">
                Erreur lors du chargement des factures
              </p>
            </div>
          )}

          {isLoading && <SkeletonTable rows={10} columns={7} />}

          {!isLoading && !error && (
            <>
              {invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <FileTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune facture trouvée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {hasActiveFilters
                      ? 'Essayez de modifier vos filtres de recherche.'
                      : 'Les factures apparaîtront ici une fois créées.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Numéro
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Montant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Reste
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            État
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Paiement
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {invoices.map((invoice) => (
                          <tr
                            key={invoice.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                to={`/invoices/${invoice.id}`}
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                              >
                                {invoice.name}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {invoice.partner?.name || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(invoice.invoice_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(invoice.amount_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {invoice.amount_residual > 0 ? (
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  {formatPrice(invoice.amount_residual)}
                                </span>
                              ) : (
                                <span className="text-green-600 dark:text-green-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getStateVariant(invoice.state)}>
                                {getStateLabel(invoice.state)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getPaymentStateVariant(invoice.payment_state)}>
                                {getPaymentStateLabel(invoice.payment_state)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDownloadPDF(invoice.id, invoice.name)}
                                  disabled={downloadPDFMutation.isPending}
                                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                                  title="Télécharger PDF"
                                >
                                  <DownloadIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleSendEmail(invoice.id, invoice.name)}
                                  disabled={sendEmailMutation.isPending}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                                  title="Envoyer par email"
                                >
                                  <MailIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
                      Affichage de {page * limit + 1} à {Math.min((page + 1) * limit, total)} sur{' '}
                      {total} factures
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
                        Page {page + 1} sur {Math.ceil(total / limit)}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={(page + 1) * limit >= total}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
