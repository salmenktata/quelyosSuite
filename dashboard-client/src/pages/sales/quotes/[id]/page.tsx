/**
 * Détail Devis - Vue complète d'un devis avec conversion facture
 *
 * Fonctionnalités :
 * - Affichage informations devis (numéro, client, montant, statut)
 * - Détail des lignes avec quantités et prix unitaires
 * - Action : Transformer en facture (convert-to-invoice)
 * - Redirection automatique vers facture créée
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable, PageNotice } from '@/components/common'
import { FileText, AlertCircle, RefreshCw, User, Calendar, FileText } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logger } from '@quelyos/logger'
import { financeNotices } from '@/lib/notices/finance-notices'

type QuoteLine = {
  id: number
  product: {
    id: number
    name: string
  }
  quantity: number
  price_unit: number
  price_subtotal: number
  price_total: number
}

type Quote = {
  id: number
  name: string
  date_order: string
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel'
  amount_untaxed: number
  amount_tax: number
  amount_total: number
  customer: {
    id: number
    name: string
    email: string
    phone: string
  } | null
  lines: QuoteLine[]
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)

  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.post<{
        success: boolean;
        order: Quote;
        error?: string;
      }>(`/ecommerce/orders/${id}`)
      if (response.data.success && response.data.order) {
        setQuote(response.data.order)
      } else {
        setError(response.data.error || 'Erreur lors du chargement du devis')
      }
    } catch (err) {
      logger.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchQuote()
  }, [id, fetchQuote])

  const handleConvertToInvoice = async () => {
    if (!quote) return

    const confirmed = window.confirm(
      `Voulez-vous transformer le devis ${quote.name} en facture ?\n\n` +
      `Cette action va :\n` +
      `1. Confirmer le devis (état "Vente")\n` +
      `2. Créer une facture\n` +
      `3. Vous rediriger vers la facture créée`
    )

    if (!confirmed) return

    try {
      setConverting(true)

      const response = await apiClient.post<{
        success: boolean;
        data: {
          invoice: {
            id: number;
            name: string;
            state: string;
            amountTotal: number;
          };
          order: {
            id: number;
            name: string;
            state: string;
          };
        };
        error?: string;
        error_code?: string;
      }>(`/sales/orders/${quote.id}/convert-to-invoice`)

      if (response.data.success && response.data.data) {
        const invoiceId = response.data.data.invoice.id
        const invoiceName = response.data.data.invoice.name

        alert(`Facture ${invoiceName} créée avec succès !`)

        // Rediriger vers la facture
        navigate(`/finance/invoices/${invoiceId}`)
      } else {
        if (response.data.error_code === 'INVOICE_ALREADY_EXISTS') {
          alert(`Une facture existe déjà pour ce devis.`)
        } else {
          alert(`Erreur: ${response.data.error}`)
        }
      }
    } catch (err) {
      logger.error('Erreur conversion:', err)
      alert('Erreur lors de la conversion en facture')
    } finally {
      setConverting(false)
    }
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

  if (error || !quote) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Facturation', href: '/invoicing' },
              { label: 'Devis', href: '/invoicing/quotes' },
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
                {error || 'Devis introuvable'}
              </p>
              <button
                onClick={() => fetchQuote()}
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

  const canConvert = quote.state === 'draft' || quote.state === 'sent'

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Devis', href: '/invoicing/quotes' },
            { label: quote.name },
          ]}
        />

        <PageNotice config={financeNotices.quoteDetail} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{quote.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Devis • {formatDate(quote.date_order)}
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              quote.state === 'draft'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                : quote.state === 'sent'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : quote.state === 'sale'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}>
              {quote.state === 'draft' ? 'Brouillon' : quote.state === 'sent' ? 'Envoyé' : quote.state === 'sale' ? 'Confirmé' : quote.state}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {canConvert && (
            <Button
              variant="primary"
              icon={<FileText />}
              onClick={handleConvertToInvoice}
              disabled={converting}
            >
              {converting ? 'Conversion...' : 'Transformer en facture'}
            </Button>
          )}
          {!canConvert && quote.state === 'sale' && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              Ce devis est déjà confirmé. Une facture a peut-être déjà été créée.
            </div>
          )}
        </div>

        {/* Client Info */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Client
          </h2>
          <div className="space-y-2">
            <p className="text-gray-900 dark:text-white font-medium">{quote.customer?.name || '-'}</p>
            {quote.customer?.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{quote.customer.email}</p>
            )}
            {quote.customer?.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{quote.customer.phone}</p>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date du devis</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDate(quote.date_order)}
          </p>
        </div>

        {/* Lines */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lignes du devis
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Prix unitaire
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {quote.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {line.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(line.price_unit, '€')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                      {formatCurrency(line.price_total, '€')}
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
                    {formatCurrency(quote.amount_untaxed, '€')}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    TVA
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {formatCurrency(quote.amount_tax, '€')}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-lg font-bold text-gray-900 dark:text-white text-right">
                    Total TTC
                  </td>
                  <td className="px-4 py-3 text-lg font-bold text-emerald-600 dark:text-emerald-400 text-right">
                    {formatCurrency(quote.amount_total, '€')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
