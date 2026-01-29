/**
 * Gestion des Tenants
 *
 * Fonctionnalités :
 * - Liste paginée des tenants avec filtres
 * - Recherche par nom/domain
 * - Filtres : par plan, par état subscription, par usage quota
 * - Détails tenant (modal) : subscription, usage, features
 * - Actions : Suspendre/Réactiver, Upgrade/Downgrade
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Eye } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { TenantsResponseSchema, validateApiResponse } from '@/lib/validators'
import type { Tenant } from '@/lib/validators'

export function Tenants() {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-tenants', search, planFilter, stateFilter, page],
    queryFn: async () => {
      const response = await api.request<{ data: Tenant[]; total: number }>({
        method: 'GET',
        path: '/api/super-admin/tenants',
        params: {
          search,
          plan: planFilter !== 'all' ? planFilter : undefined,
          state: stateFilter !== 'all' ? stateFilter : undefined,
          page,
          limit: 50,
        },
      })
      return validateApiResponse(TenantsResponseSchema, response.data)
    },
  })

  const tenants = data?.data || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Tenants</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{total} tenants au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
            />
          </div>
        </div>

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
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    État
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Users
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Produits
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    MRR
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {tenant.logo ? (
                          <img src={tenant.logo} alt="" className="w-8 h-8 rounded-lg" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.slogan || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tenant.domain}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                        {tenant.plan_code.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tenant.subscription_state === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : tenant.subscription_state === 'trial'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : tenant.subscription_state === 'past_due'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tenant.subscription_state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                      {tenant.users_count}/{tenant.max_users}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                      {tenant.products_count}/{tenant.max_products}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {tenant.mrr.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} sur {Math.ceil(total / 50)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 50)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Tenant Detail Modal (TODO) */}
      {selectedTenant && (
        <TenantDetailModal tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
      )}
    </div>
  )
}

function TenantDetailModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{tenant.name}</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Informations Générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Domain</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{tenant.domain}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Plan</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{tenant.plan_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">État Subscription</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{tenant.subscription_state}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">MRR</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{tenant.mrr} €</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Usage Quotas</h3>
            <div className="space-y-3">
              <QuotaBar label="Utilisateurs" current={tenant.users_count} max={tenant.max_users} />
              <QuotaBar label="Produits" current={tenant.products_count} max={tenant.max_products} />
              <QuotaBar label="Commandes (annuelles)" current={tenant.orders_count} max={tenant.max_orders_per_year} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Features Activées</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(tenant.features).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatFeatureName(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

function QuotaBar({ label, current, max }: { label: string; current: number; max: number }) {
  const percentage = (current / max) * 100
  const isWarning = percentage > 80
  const isDanger = percentage > 95

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {current} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isDanger
              ? 'bg-red-500'
              : isWarning
                ? 'bg-orange-500'
                : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  )
}

function formatFeatureName(key: string): string {
  return key.replace(/_enabled$/, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
