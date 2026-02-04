/**
 * Composant InvoiceListCursor - Liste Factures avec Cursor Pagination
 *
 * Démonstration infinite scroll haute performance :
 * - Cursor-based pagination (performance constante)
 * - IntersectionObserver pour lazy loading
 * - Loading states (initial, next page)
 * - Empty state, error state
 * - Stats agrégées
 */

import { Loader, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  useInvoicesInfiniteScroll,
  flattenInvoices,
  getTotalLoadedCount,
  calculateInvoiceStats,
  type InvoicesCursorParams,
} from '@/hooks/useInvoicesCursor';

interface InvoiceListCursorProps {
  filters?: InvoicesCursorParams;
  onInvoiceClick?: (invoiceId: number) => void;
}

export function InvoiceListCursor({ filters, onInvoiceClick }: InvoiceListCursorProps) {
  const { data, isLoading, error, sentinelRef, isLoadingMore, allLoaded } =
    useInvoicesInfiniteScroll(filters);

  // Loading initial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Chargement des factures...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Erreur chargement factures
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const invoices = flattenInvoices(data);
  const totalLoaded = getTotalLoadedCount(data);
  const stats = calculateInvoiceStats(invoices);

  // Empty state
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Aucune facture trouvée
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          Modifiez les filtres ou créez une nouvelle facture
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total chargé</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalLoaded}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Montant total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(stats.total_amount)}
            </p>
          </div>

          <div>
            <p className="text-sm text-green-600 dark:text-green-400">Payé</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(stats.total_paid)}
            </p>
          </div>

          <div>
            <p className="text-sm text-red-600 dark:text-red-400">Impayé</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(stats.total_unpaid)}
            </p>
          </div>
        </div>
      </div>

      {/* Liste factures */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => onInvoiceClick?.(invoice.id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.name}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.partner_name}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.invoice_date
                        ? new Date(invoice.invoice_date).toLocaleDateString('fr-FR')
                        : '-'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(invoice.amount_total)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <InvoiceStatusBadge
                      state={invoice.state}
                      paymentState={invoice.payment_state}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sentinel element pour IntersectionObserver */}
        <div ref={sentinelRef} className="py-4 text-center">
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader className="h-5 w-5 animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          )}

          {allLoaded && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              ✓ Toutes les factures sont chargées ({totalLoaded} au total)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface InvoiceStatusBadgeProps {
  state: 'draft' | 'posted' | 'cancel';
  paymentState: 'not_paid' | 'in_payment' | 'paid' | 'partial';
}

function InvoiceStatusBadge({ state, paymentState }: InvoiceStatusBadgeProps) {
  if (state === 'draft') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
        <Clock className="h-3 w-3" />
        Brouillon
      </span>
    );
  }

  if (state === 'cancel') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
        <AlertCircle className="h-3 w-3" />
        Annulée
      </span>
    );
  }

  // État posted
  switch (paymentState) {
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
          <CheckCircle2 className="h-3 w-3" />
          Payée
        </span>
      );

    case 'partial':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
          <Clock className="h-3 w-3" />
          Partiel
        </span>
      );

    case 'in_payment':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          <Clock className="h-3 w-3" />
          En cours
        </span>
      );

    case 'not_paid':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
          <AlertCircle className="h-3 w-3" />
          Impayée
        </span>
      );
  }
}
