/**
 * Détail Facture Client - Vue complète d'une facture
 *
 * Fonctionnalités :
 * - Affichage informations facture (numéro, client, montant, statut)
 * - Détail des lignes de facture avec quantités et prix unitaires
 * - Calcul automatique totaux HT, TVA et TTC
 * - Actions disponibles : télécharger PDF, envoyer par email, valider
 * - Statuts visuels : brouillon, validée, payée, annulée
 * - Dates de création et d'échéance formatées
 * - Informations client avec contact et adresse
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable, PageNotice } from '@/components/common'
import { Download, Mail, CheckCircle, FileText, AlertCircle, RefreshCw, User, Calendar, CreditCard } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logger } from '@quelyos/logger'
import { financeNotices } from '@/lib/notices/finance-notices'

type InvoiceLine = {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

type Invoice = {
  id: number
  name: string
  customer: {
    id: number
    name: string
    email?: string
  }
  invoiceDate: string
  dueDate?: string
  state: 'draft' | 'posted' | 'cancel'
  paymentState: 'not_paid' | 'in_payment' | 'paid' | 'partial'
  amountUntaxed: number
  amountTax: number
  amountTotal: number
  amountResidual: number
  lines: InvoiceLine[]
  note?: string
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.post<{
        success: boolean;
        data: Invoice;
        error?: string;
      }>(`/finance/invoices/${id}`)
      if (response.data.success && response.data.data) {
        setInvoice(response.data.data)
      } else {
        setError(response.data.error || 'Erreur lors du chargement de la facture')
      }
    } catch (err) {
      logger.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchInvoice()
  }, [id, fetchInvoice])

  const handleCreateCreditNote = async () => {
    const reason = prompt('Raison de l\'avoir (optionnel):')
    if (reason === null) return // Annulé

    if (!confirm(`Créer un avoir total pour la facture ${invoice?.name} ?`)) return

    try {
      const response = await apiClient.post<{
        success: boolean
        data: { creditNote: { id: number; name: string } }
        message?: string
      }>(`/finance/invoices/${id}/create-credit-note`, {
        reason: reason || 'Avoir sur facture',
      })

      if (response.data.success && response.data.data) {
        alert(response.data.message || 'Avoir créé avec succès')
        fetchInvoice() // Refresh
      }
    } catch (err) {
      logger.error('Erreur création avoir:', err)
      alert('Erreur lors de la création de l\'avoir')
    }
  }

  const handlePayNow = async () => {
    if (!invoice) return

    try {
      setLoadingPayment(true)
      const response = await apiClient.post<{
        success: boolean;
        data: {
          paymentUrl: string;
          paymentLinkId: string;
          amount: number;
          currency: string;
        };
        error?: string;
      }>(`/finance/invoices/${invoice.id}/payment-link`)

      if (response.data.success && response.data.data) {
        // Rediriger vers Stripe Checkout
        window.location.href = response.data.data.paymentUrl
      } else {
        alert(`Erreur: ${response.data.error}`)
      }
    } catch (err) {
      logger.error('Erreur génération lien paiement:', err)
      alert('Erreur lors de la génération du lien de paiement')
    } finally {
      setLoadingPayment(false)
    }
  }

  const getStatusBadge = (state: Invoice['state'], paymentState: Invoice['paymentState']) => {
    if (state === 'draft') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
          Brouillon
        </span>
      )
    }

    if (state === 'cancel') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          Annulée
        </span>
      )
    }

    // Facture validée (posted)
    if (paymentState === 'paid') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="h-4 w-4" />
          Payée
        </span>
      )
    }

    if (paymentState === 'partial') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
          Paiement partiel
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
        En attente de paiement
      </span>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <SkeletonTable rows={5} columns={4} />
        </div>
      </Layout>
    )
  }

  if (error || !invoice) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Facturation', href: '/invoicing' },
              { label: 'Factures', href: '/invoicing/invoices' },
              { label: 'Détail' },
            ]}
          />

          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                {error || 'Facture introuvable'}
              </p>
              <button
                onClick={() => fetchInvoice()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Factures', href: '/invoicing/invoices' },
            { label: invoice.name },
          ]}
        />

        <PageNotice config={financeNotices.invoiceDetail} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{invoice.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Facture client • {formatDate(invoice.invoiceDate)}
            </p>
          </div>
          <div>{getStatusBadge(invoice.state, invoice.paymentState)}</div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Bouton Payer (si facture validée et non payée) */}
          {invoice.state === 'posted' && invoice.paymentState !== 'paid' && invoice.amountResidual > 0 && (
            <Button
              variant="primary"
              icon={<CreditCard />}
              onClick={handlePayNow}
              disabled={loadingPayment}
            >
              {loadingPayment ? 'Chargement...' : `Payer ${formatCurrency(invoice.amountResidual, '€')}`}
            </Button>
          )}

          <Button variant="secondary" icon={<Download />}>
            Télécharger PDF
          </Button>
          <Button variant="secondary" icon={<Mail />}>
            Envoyer par email
          </Button>
          {invoice.state === 'draft' && (
            <Button variant="secondary" icon={<CheckCircle />}>
              Valider la facture
            </Button>
          )}
          {invoice.state === 'posted' && (
            <Button variant="secondary" icon={<FileText />} onClick={handleCreateCreditNote}>
              Créer avoir
            </Button>
          )}
        </div>

        {/* Client Info */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Client
          </h2>
          <div className="space-y-2">
            <p className="text-gray-900 dark:text-white font-medium">{invoice.customer.name}</p>
            {invoice.customer.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.customer.email}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de facture</h3>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(invoice.invoiceDate)}
            </p>
          </div>

          {invoice.dueDate && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date d'échéance</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lignes de facture
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prix unitaire
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoice.lines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {line.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(line.unitPrice, '€')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                      {formatCurrency(line.total, '€')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    Total HT
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {formatCurrency(invoice.amountUntaxed, '€')}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    TVA
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {formatCurrency(invoice.amountTax, '€')}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-lg font-bold text-gray-900 dark:text-white text-right">
                    Total TTC
                  </td>
                  <td className="px-4 py-3 text-lg font-bold text-emerald-600 dark:text-emerald-400 text-right">
                    {formatCurrency(invoice.amountTotal, '€')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Note */}
        {invoice.note && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Note</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">{invoice.note}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
