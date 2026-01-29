/**
 * Gestion des Abonnements
 *
 * Fonctionnalités :
 * - Liste globale subscriptions avec filtres (état, plan, billing cycle)
 * - Métriques : MRR breakdown, Churn analysis
 * - Détails subscription : billing history, actions admin
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { SubscriptionSchema, ChurnAnalysisSchema, MRRBreakdownSchema, validateApiResponse } from '@/lib/validators'
import type { Subscription, ChurnAnalysis, MRRBreakdown } from '@/lib/validators'
import { z } from 'zod'

export function Subscriptions() {
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['super-admin-subscriptions', stateFilter, planFilter],
    queryFn: async () => {
      const response = await api.request<Subscription[]>({
        method: 'GET',
        path: '/api/super-admin/subscriptions',
        params: {
          state: stateFilter !== 'all' ? stateFilter : undefined,
          plan: planFilter !== 'all' ? planFilter : undefined,
        },
      })
      return validateApiResponse(z.array(SubscriptionSchema), response.data)
    },
  })

  const { data: mrrBreakdown } = useQuery({
    queryKey: ['super-admin-mrr-breakdown'],
    queryFn: async () => {
      const response = await api.request<MRRBreakdown>({ method: 'GET', path: '/api/super-admin/subscriptions/mrr-breakdown' })
      return validateApiResponse(MRRBreakdownSchema, response.data)
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: churnAnalysis } = useQuery({
    queryKey: ['super-admin-churn-analysis'],
    queryFn: async () => {
      const response = await api.request<ChurnAnalysis[]>({ method: 'GET', path: '/api/super-admin/subscriptions/churn-analysis' })
      return validateApiResponse(z.array(ChurnAnalysisSchema), response.data)
    },
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Abonnements</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{subscriptions?.length || 0} abonnements actifs</p>
      </div>

      {/* MRR Breakdown */}
      {mrrBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="Starter MRR" value={`${mrrBreakdown.starter.toLocaleString('fr-FR')} €`} color="green" />
          <MetricCard title="Pro MRR" value={`${mrrBreakdown.pro.toLocaleString('fr-FR')} €`} color="blue" />
          <MetricCard
            title="Enterprise MRR"
            value={`${mrrBreakdown.enterprise.toLocaleString('fr-FR')} €`}
            color="purple"
          />
          <MetricCard title="Total MRR" value={`${mrrBreakdown.total.toLocaleString('fr-FR')} €`} color="teal" />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Tous les états</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Tous les plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    État
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cycle
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    MRR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Prochaine Facturation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {subscriptions?.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{sub.tenant_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                        {sub.plan_code.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sub.state === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : sub.state === 'trial'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : sub.state === 'past_due'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {sub.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sub.billing_cycle}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {sub.mrr.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Churn Analysis */}
      {churnAnalysis && churnAnalysis.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analyse Churn (12 mois)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {churnAnalysis.slice(0, 6).map((item) => (
              <div key={item.month} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.month}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{item.churn_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.churned_count} churned</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  const bgColor = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
  }[color] || 'bg-gray-500'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className={`mt-2 h-1 ${bgColor} rounded-full`} />
    </div>
  )
}
