/**
 * Page Liste Devis
 *
 * Fonctionnalités:
 * - Liste filtrable des devis (sale.order state=draft/sent)
 * - Actions: créer, modifier, convertir en facture
 * - Indicateurs: total devis, montant
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable } from '@/components/common'
import { Plus, Eye } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { logger } from '@quelyos/logger'

type Quote = {
  id: number
  name: string
  date_order: string
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel'
  amount_total: number
  customer: {
    id: number
    name: string
    email: string
  } | null
}

export default function QuotesPage() {
  const navigate = useNavigate()

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post<{
        success: boolean;
        data: {
          orders: Quote[];
          total: number;
        };
        error?: string;
      }>('/ecommerce/orders', {
        status: 'draft,sent',
        limit: 100,
        offset: 0
      })

      if (response.data.success && response.data.data) {
        setQuotes(response.data.data.orders)
      } else {
        setError(response.data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      logger.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Facturation', path: '/invoicing' },
            { label: 'Devis', path: '/invoicing/quotes' },
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
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', path: '/invoicing' },
            { label: 'Devis', path: '/invoicing/quotes' },
          ]}
        />

        <PageNotice config={financeNotices.quotes} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Devis
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos devis et propositions commerciales
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus />}
          onClick={() => navigate('/invoicing/quotes/new')}
        >
          Nouveau Devis
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={10} columns={5} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Numéro
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Montant
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun devis trouvé
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {quote.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {quote.customer?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(quote.date_order)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(quote.amount_total, '€')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quote.state === 'draft'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      }`}>
                        {quote.state === 'draft' ? 'Brouillon' : 'Envoyé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye />}
                        onClick={() => navigate(`/sales/quotes/${quote.id}`)}
                      >
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </Layout>
  )
}
