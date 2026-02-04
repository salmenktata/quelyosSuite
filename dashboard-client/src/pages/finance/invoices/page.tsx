/**
 * Page Liste Factures Clients
 * 
 * Fonctionnalités:
 * - Liste filtrable et triable des factures clients
 * - Filtres: statut, état paiement, client, dates
 * - Actions: créer, modifier, valider, envoyer email, télécharger PDF
 * - Indicateurs: total facturé, payé, en attente
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common'
import { financeNotices } from '@/lib/notices/finance-notices'
import {
  FileText,
  Plus,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Send,
  Zap,
  Search,
  X
} from 'lucide-react'
import { useInvoices } from '@/hooks/useInvoices'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice } from '@/types'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'

type InvoiceStatus = 'draft' | 'posted' | 'cancel' | 'all'
type PaymentState = 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'all'

export default function InvoicesPage() {
  const navigate = useNavigate()

  // Recherche
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Invoice[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Filtres
  const [status, setStatus] = useState<InvoiceStatus>('all')
  const [paymentState, setPaymentState] = useState<PaymentState>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Multi-sélection pour relances
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [sendingReminders, setSendingReminders] = useState(false)

  // Recherche avec debounce
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        performSearch(searchQuery)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setShowSearchResults(false)
      setSearchResults([])
    }
  }, [searchQuery])

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true)
      const response = await apiClient.get<{
        success: boolean
        data: { invoices: Invoice[]; total: number }
      }>('/finance/invoices/search', {
        params: { q: query, limit: 10 },
      })

      if (response.data.success) {
        setSearchResults(response.data.data.invoices)
        setShowSearchResults(true)
      }
    } catch (err) {
      logger.error('Erreur recherche factures:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setShowSearchResults(false)
    setSearchResults([])
  }

  // Données
  const {
    invoices,
    loading,
    error,
    stats,
    sendEmail,
    downloadPDF,
    validate
  } = useInvoices({ status, paymentState, dateFrom, dateTo })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Sélectionner uniquement les factures impayées
      const unpaidIds = invoices
        .filter(inv => inv.state === 'posted' && inv.payment_state !== 'paid')
        .map(inv => inv.id)
      setSelectedIds(unpaidIds)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectInvoice = (invoiceId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, invoiceId])
    } else {
      setSelectedIds(prev => prev.filter(id => id !== invoiceId))
    }
  }

  const handleBulkRemind = async () => {
    if (selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins une facture')
      return
    }

    const confirmed = window.confirm(
      `Envoyer ${selectedIds.length} relance(s) de paiement par email ?`
    )

    if (!confirmed) return

    try {
      setSendingReminders(true)

      const response = await apiClient.post<{
        success: boolean;
        data: {
          sent: number;
          failed: number;
          total: number;
          details: Array<{
            invoiceId: number;
            invoiceName: string;
            status: string;
          }>;
        };
        message?: string;
        error?: string;
      }>('/finance/invoices/bulk-remind', {
        invoiceIds: selectedIds
      })

      if (response.data.success && response.data.data) {
        alert(
          response.data.message ||
          `${response.data.data.sent} relance(s) envoyée(s) avec succès`
        )
        setSelectedIds([]) // Réinitialiser la sélection
      } else {
        alert(`Erreur: ${response.data.error}`)
      }
    } catch (err) {
      logger.error('Erreur envoi relances:', err)
      alert("Erreur lors de l'envoi des relances")
    } finally {
      setSendingReminders(false)
    }
  }

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.state === 'draft') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
          <Clock className="w-3 h-3 mr-1" />
          Brouillon
        </span>
      )
    }

    if (invoice.state === 'cancel') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Annulée
        </span>
      )
    }

    // État paiement pour factures validées
    if (invoice.payment_state === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Payée
        </span>
      )
    }

    if (invoice.payment_state === 'partial') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
          Paiement partiel
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
        En attente
      </span>
    )
  }

  if (error) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Finance', path: '/finance' },
            { label: 'Factures Clients', path: '/invoicing/invoices' },
          ]}
        />
        <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Facturation', path: '/invoicing' },
          { label: 'Factures Clients', path: '/invoicing/invoices' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Factures Clients
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos factures de vente et suivez les paiements
          </p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="secondary"
              icon={<Send />}
              onClick={handleBulkRemind}
              disabled={sendingReminders}
            >
              {sendingReminders
                ? 'Envoi...'
                : `Relancer (${selectedIds.length})`}
            </Button>
          )}
          <Button
            variant="secondary"
            icon={<Zap />}
            onClick={() => navigate('/invoicing/invoices/quick')}
          >
            Création Express
          </Button>
          <Button
            variant="primary"
            icon={<Plus />}
            onClick={() => navigate('/invoicing/invoices/new')}
          >
            Nouvelle Facture
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une facture (numéro, client, montant)..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Résultats recherche */}
        {showSearchResults && (
          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Recherche en cours...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => {
                      navigate(`/finance/invoices/${invoice.id}`)
                      clearSearch()
                    }}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.partner_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(invoice.amount_total, '€')}
                        </p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          {invoice.payment_state === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Payée
                            </span>
                          ) : invoice.payment_state === 'not_paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              <Clock className="h-3 w-3" />
                              Non payée
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Aucun résultat trouvé
              </div>
            )}
          </div>
        )}
      </div>

      <PageNotice config={financeNotices.invoices} />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Facturé</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.totalInvoiced, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Payé</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.totalPaid, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">En Attente</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(stats.totalPending, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">En Retard</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.totalOverdue, '€')}
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="draft">Brouillon</option>
              <option value="posted">Validée</option>
              <option value="cancel">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paiement
            </label>
            <select
              value={paymentState}
              onChange={(e) => setPaymentState(e.target.value as PaymentState)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="not_paid">Non payée</option>
              <option value="partial">Paiement partiel</option>
              <option value="paid">Payée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length ===
                        invoices.filter(
                          inv =>
                            inv.state === 'posted' && inv.payment_state !== 'paid'
                        ).length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Échéance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => {
                const isUnpaid = invoice.state === 'posted' && invoice.payment_state !== 'paid'
                const isSelected = selectedIds.includes(invoice.id)

                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {isUnpaid ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      <div className="text-sm text-gray-900 dark:text-white">
                        {invoice.partner_name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      {formatDate(invoice.invoice_date || '')}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      {formatDate(invoice.invoice_date_due || '')}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-right cursor-pointer"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(invoice.amount_total, '€')}
                      </div>
                      {invoice.amount_residual > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Reste {formatCurrency(invoice.amount_residual, '€')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.state === 'draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            validate(invoice.id)
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          aria-label="Valider la facture"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {invoice.state === 'posted' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              sendEmail(invoice.id)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            aria-label="Envoyer par email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadPDF(invoice.id)
                            }}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                            aria-label="Télécharger PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
