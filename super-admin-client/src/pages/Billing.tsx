/**
 * Gestion Facturation & Transactions
 *
 * Fonctionnalités :
 * - Liste factures globales avec filtres
 * - Liste transactions paiement
 * - Summary : revenue total, factures impayées, taux succès
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, Mail, Pause, Ban } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { InvoicesResponseSchema, TransactionsResponseSchema, InvoicesSummarySchema, DunningOverviewSchema, validateApiResponse } from '@/lib/validators'
import type { InvoicesResponse, TransactionsResponse, Invoice, Transaction } from '@/lib/validators'
import { z } from 'zod'

type DunningOverview = z.infer<typeof DunningOverviewSchema>

export function Billing() {
  const [view, setView] = useState<'invoices' | 'transactions'>('invoices')

  const { data: invoicesResponse } = useQuery({
    queryKey: ['super-admin-invoices'],
    queryFn: async () => {
      const response = await api.request<InvoicesResponse>({ method: 'GET', path: '/api/super-admin/invoices' })
      return validateApiResponse(InvoicesResponseSchema, response.data)
    },
  })

  const { data: transactionsResponse } = useQuery({
    queryKey: ['super-admin-transactions'],
    queryFn: async () => {
      const response = await api.request<TransactionsResponse>({ method: 'GET', path: '/api/super-admin/transactions' })
      return validateApiResponse(TransactionsResponseSchema, response.data)
    },
  })

  const invoices = invoicesResponse?.data
  const transactions = transactionsResponse?.data

  const { data: summary } = useQuery({
    queryKey: ['super-admin-invoices-summary'],
    queryFn: async () => {
      const response = await api.request<{
        total_revenue: number
        unpaid_invoices: number
        unpaid_amount: number
        success_rate: number
        failed_transactions: number
      }>({ method: 'GET', path: '/api/super-admin/invoices/summary' })
      return validateApiResponse(InvoicesSummarySchema, response.data)
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: dunningOverview } = useQuery({
    queryKey: ['super-admin-dunning-overview'],
    queryFn: async () => {
      const response = await api.request<DunningOverview>({ method: 'GET', path: '/api/super-admin/dunning/overview' })
      return validateApiResponse(DunningOverviewSchema, response.data)
    },
    staleTime: 2 * 60 * 1000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Facturation & Transactions</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Gestion globale des paiements</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Revenue Total (mois)"
            value={`${summary.total_revenue.toLocaleString('fr-FR')} €`}
            icon={DollarSign}
            color="green"
          />
          <SummaryCard
            title="Factures Impayées"
            value={summary.unpaid_invoices.toString()}
            subtitle={`${summary.unpaid_amount.toLocaleString('fr-FR')} €`}
            icon={AlertCircle}
            color="orange"
          />
          <SummaryCard
            title="Taux Succès"
            value={`${summary.success_rate.toFixed(1)}%`}
            icon={CheckCircle}
            color="blue"
          />
          <SummaryCard
            title="Paiements Échoués"
            value={summary.failed_transactions.toString()}
            icon={XCircle}
            color="red"
          />
        </div>
      )}

      {/* Dunning Section */}
      {dunningOverview && dunningOverview.stats.total_past_due > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Relances en cours</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Retard total :</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {dunningOverview.stats.total_amount_due.toLocaleString('fr-FR')} €
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-gray-500 dark:text-gray-400">Récupéré ce mois :</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {dunningOverview.stats.recovered_this_month.toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          </div>

          {dunningOverview.active_collections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Jours retard
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Prochaine action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date prévue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Montant dû
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dunningOverview.active_collections.map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {collection.tenant_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          collection.days_overdue > 7
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : collection.days_overdue > 3
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          J+{collection.days_overdue}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {collection.next_action === 'email_soft' && <Mail className="w-4 h-4 text-blue-500" />}
                          {collection.next_action === 'email_urgent' && <Mail className="w-4 h-4 text-orange-500" />}
                          {collection.next_action === 'suspend' && <Pause className="w-4 h-4 text-red-500" />}
                          {collection.next_action === 'cancel' && <Ban className="w-4 h-4 text-red-700" />}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {collection.next_action === 'email_soft' && 'Email rappel'}
                            {collection.next_action === 'email_urgent' && 'Email urgent'}
                            {collection.next_action === 'suspend' && 'Suspension'}
                            {collection.next_action === 'cancel' && 'Annulation'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {collection.next_action_date
                          ? new Date(collection.next_action_date).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">
                        {collection.amount_due.toLocaleString('fr-FR')} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              Aucune relance en cours
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setView('invoices')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'invoices'
              ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Factures
        </button>
        <button
          onClick={() => setView('transactions')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'transactions'
              ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Content */}
      {view === 'invoices' ? <InvoicesTable invoices={invoices || []} /> : <TransactionsTable transactions={transactions || []} />}
    </div>
  )
}

function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant HT</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant TTC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{invoice.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{invoice.tenant_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                  {invoice.amount_untaxed.toLocaleString('fr-FR')} €
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                  {invoice.amount_total.toLocaleString('fr-FR')} €
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.payment_state === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : invoice.payment_state === 'not_paid'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {invoice.payment_state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Provider</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">État</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{tx.reference}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tx.tenant_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tx.provider}</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                  {tx.amount.toLocaleString('fr-FR')} €
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      tx.state === 'done'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : tx.state === 'error'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {tx.state}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(tx.date).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

function SummaryCard({ title, value, subtitle, icon: Icon, color }: SummaryCardProps) {
  const bgColor = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }[color] || 'bg-gray-500'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}
