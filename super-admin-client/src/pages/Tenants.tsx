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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Eye, Plus, Loader2, X, Pause, Play, ArrowUpDown, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { TenantsResponseSchema, PlansResponseSchema, validateApiResponse } from '@/lib/validators'
import type { Tenant, Plan } from '@/lib/validators'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useToast } from '@/hooks/useToast'

interface CreateTenantForm {
  name: string
  domain: string
  plan_code: 'starter' | 'pro' | 'enterprise'
  admin_email: string
  admin_name: string
}

export function Tenants() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null)
  const [activateTarget, setActivateTarget] = useState<Tenant | null>(null)
  const [changePlanTarget, setChangePlanTarget] = useState<Tenant | null>(null)

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

  const createTenant = useMutation({
    mutationFn: async (formData: CreateTenantForm) => {
      return api.request({
        method: 'POST',
        path: '/api/super-admin/tenants',
        body: formData,
      })
    },
    onSuccess: () => {
      toast.success('Tenant créé avec succès. Le provisioning est en cours.')
      setShowCreateModal(false)
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] })
    },
    onError: () => {
      toast.error('Erreur lors de la création du tenant')
    },
  })

  const suspendTenant = useMutation({
    mutationFn: async ({ tenantId, reason }: { tenantId: number; reason?: string }) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/tenants/${tenantId}/suspend`,
        body: { reason: reason || 'Suspendu par le super admin' },
      })
    },
    onSuccess: () => {
      toast.success('Tenant suspendu avec succès')
      setSuspendTarget(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] })
    },
    onError: () => {
      toast.error('Erreur lors de la suspension du tenant')
    },
  })

  const activateTenant = useMutation({
    mutationFn: async (tenantId: number) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/tenants/${tenantId}/activate`,
      })
    },
    onSuccess: () => {
      toast.success('Tenant réactivé avec succès')
      setActivateTarget(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] })
    },
    onError: () => {
      toast.error('Erreur lors de la réactivation du tenant')
    },
  })

  const { data: plansData } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: async () => {
      const response = await api.request<{ data: Plan[] }>({
        method: 'GET',
        path: '/api/super-admin/plans',
      })
      return validateApiResponse(PlansResponseSchema, response.data)
    },
  })

  const changePlan = useMutation({
    mutationFn: async ({ tenantId, planCode }: { tenantId: number; planCode: string }) => {
      return api.request({
        method: 'PUT',
        path: `/api/super-admin/tenants/${tenantId}/plan`,
        body: { plan_code: planCode },
      })
    },
    onSuccess: (response) => {
      const data = response.data as { message?: string; quota_warnings?: string[] }
      toast.success(data.message || 'Plan modifié avec succès')
      if (data.quota_warnings && data.quota_warnings.length > 0) {
        toast.warning(`Attention quotas dépassés: ${data.quota_warnings.join(', ')}`)
      }
      setChangePlanTarget(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] })
    },
    onError: () => {
      toast.error('Erreur lors du changement de plan')
    },
  })

  const tenants = data?.data || []
  const plans = plansData?.data || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Tenants</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{total} tenants au total</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Créer Tenant
        </button>
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
                        {tenant.plan_code?.toUpperCase() ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {tenant.status === 'suspended' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            SUSPENDU
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            tenant.subscription_state === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : tenant.subscription_state === 'trial'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : tenant.subscription_state === 'past_due'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {tenant.subscription_state || 'N/A'}
                        </span>
                      </div>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedTenant(tenant)}
                          className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setChangePlanTarget(tenant)}
                          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg transition-colors"
                          title="Changer de plan"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                        {tenant.status === 'active' && (
                          <button
                            onClick={() => setSuspendTarget(tenant)}
                            className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 rounded-lg transition-colors"
                            title="Suspendre"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {tenant.status === 'suspended' && (
                          <button
                            onClick={() => setActivateTarget(tenant)}
                            className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 rounded-lg transition-colors"
                            title="Réactiver"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <TenantDetailModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onSuspend={() => setSuspendTarget(selectedTenant)}
          onActivate={() => setActivateTarget(selectedTenant)}
        />
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createTenant.mutate(data)}
          isLoading={createTenant.isPending}
        />
      )}

      {/* Suspend Confirmation Modal */}
      {suspendTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setSuspendTarget(null)}
          onConfirm={() => suspendTenant.mutate({ tenantId: suspendTarget.id })}
          title="Confirmer la suspension"
          message={`Êtes-vous sûr de vouloir suspendre le tenant "${suspendTarget.name}" ? Les utilisateurs ne pourront plus accéder à leur boutique.`}
          confirmText="Suspendre"
          variant="danger"
          isLoading={suspendTenant.isPending}
        />
      )}

      {/* Activate Confirmation Modal */}
      {activateTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setActivateTarget(null)}
          onConfirm={() => activateTenant.mutate(activateTarget.id)}
          title="Confirmer la réactivation"
          message={`Êtes-vous sûr de vouloir réactiver le tenant "${activateTarget.name}" ? Les utilisateurs pourront à nouveau accéder à leur boutique.`}
          confirmText="Réactiver"
          variant="primary"
          isLoading={activateTenant.isPending}
        />
      )}

      {/* Change Plan Modal */}
      {changePlanTarget && (
        <ChangePlanModal
          tenant={changePlanTarget}
          plans={plans}
          onClose={() => setChangePlanTarget(null)}
          onSubmit={(planCode) => changePlan.mutate({ tenantId: changePlanTarget.id, planCode })}
          isLoading={changePlan.isPending}
        />
      )}
    </div>
  )
}

function CreateTenantModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void
  onSubmit: (data: CreateTenantForm) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState<CreateTenantForm>({
    name: '',
    domain: '',
    plan_code: 'starter',
    admin_email: '',
    admin_name: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const updateForm = (field: keyof CreateTenantForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Auto-generate domain from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setForm((prev) => ({ ...prev, domain: slug ? `${slug}.quelyos.com` : '' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Créer un Nouveau Tenant</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du Tenant *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="Ma Boutique"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain *
            </label>
            <input
              type="text"
              required
              value={form.domain}
              onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))}
              placeholder="ma-boutique.quelyos.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan Tarifaire *
            </label>
            <select
              value={form.plan_code}
              onChange={(e) => setForm((prev) => ({ ...prev, plan_code: e.target.value as CreateTenantForm['plan_code'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="starter">Starter - 29€/mois</option>
              <option value="pro">Pro - 79€/mois</option>
              <option value="enterprise">Enterprise - 199€/mois</option>
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Administrateur du Tenant
            </p>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={form.admin_name}
                onChange={(e) => setForm((prev) => ({ ...prev, admin_name: e.target.value }))}
                placeholder="Nom complet *"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="email"
                required
                value={form.admin_email}
                onChange={(e) => setForm((prev) => ({ ...prev, admin_email: e.target.value }))}
                placeholder="Email *"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le Tenant'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TenantDetailModal({
  tenant,
  onClose,
  onSuspend,
  onActivate,
}: {
  tenant: Tenant
  onClose: () => void
  onSuspend?: () => void
  onActivate?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h2>
            {tenant.status === 'suspended' && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                <Pause className="w-3 h-3" />
                SUSPENDU
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

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

        <div className="mt-6 flex gap-3">
          {tenant.status === 'active' && onSuspend && (
            <button
              onClick={() => {
                onClose()
                onSuspend()
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <Pause className="w-4 h-4" />
              Suspendre
            </button>
          )}
          {tenant.status === 'suspended' && onActivate && (
            <button
              onClick={() => {
                onClose()
                onActivate()
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Réactiver
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
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

function ChangePlanModal({
  tenant,
  plans,
  onClose,
  onSubmit,
  isLoading,
}: {
  tenant: Tenant
  plans: Plan[]
  onClose: () => void
  onSubmit: (planCode: string) => void
  isLoading: boolean
}) {
  const [selectedPlan, setSelectedPlan] = useState(tenant.plan_code || '')
  const currentPlan = plans.find((p) => p.code === tenant.plan_code)
  const newPlan = plans.find((p) => p.code === selectedPlan)

  const isUpgrade = newPlan && currentPlan && newPlan.price_monthly > currentPlan.price_monthly
  const isDowngrade = newPlan && currentPlan && newPlan.price_monthly < currentPlan.price_monthly

  // Vérifier si le downgrade dépasse les quotas
  const quotaWarnings: string[] = []
  if (newPlan && isDowngrade) {
    if (newPlan.max_users > 0 && tenant.users_count > newPlan.max_users) {
      quotaWarnings.push(`Utilisateurs: ${tenant.users_count}/${newPlan.max_users}`)
    }
    if (newPlan.max_products > 0 && tenant.products_count > newPlan.max_products) {
      quotaWarnings.push(`Produits: ${tenant.products_count}/${newPlan.max_products}`)
    }
    if (newPlan.max_orders_per_year > 0 && tenant.orders_count > newPlan.max_orders_per_year) {
      quotaWarnings.push(`Commandes: ${tenant.orders_count}/${newPlan.max_orders_per_year}`)
    }
  }

  const mrrDiff = newPlan && currentPlan ? newPlan.price_monthly - currentPlan.price_monthly : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Changer de Plan</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tenant</p>
            <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plan actuel</p>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">
                {currentPlan?.name || tenant.plan_code} - {currentPlan?.price_monthly || 0} €/mois
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouveau plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} - {plan.price_monthly} €/mois
                </option>
              ))}
            </select>
          </div>

          {selectedPlan !== tenant.plan_code && (
            <div className={`p-4 rounded-lg ${isUpgrade ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isUpgrade ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                  {isUpgrade ? 'Upgrade' : 'Downgrade'}
                </span>
                <span className={`font-bold ${isUpgrade ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                  {mrrDiff > 0 ? '+' : ''}{mrrDiff} €/mois
                </span>
              </div>
            </div>
          )}

          {quotaWarnings.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Attention : Dépassement de quotas
                  </p>
                  <ul className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {quotaWarnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                    Le tenant devra réduire son utilisation pour respecter les limites du nouveau plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Annuler
            </button>
            <button
              onClick={() => onSubmit(selectedPlan)}
              disabled={isLoading || selectedPlan === tenant.plan_code}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Modification...
                </>
              ) : (
                'Confirmer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
