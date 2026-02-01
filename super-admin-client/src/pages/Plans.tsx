/**
 * Gestion des Plans Tarifaires
 *
 * Fonctionnalités :
 * - Liste des plans avec tarifs et quotas
 * - Création/Modification/Archivage de plans
 * - Configuration des features par plan
 * - Statistiques d'adoption par plan
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, Edit2, Archive, Check, X, Loader2, Users, ShoppingBag, Receipt, Shield, Clock, Blocks } from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { ModuleGroupSelector } from '@/components/common'
import { useToast } from '@/hooks/useToast'
import { z } from 'zod'
import { validateApiResponse } from '@/lib/validators'

// Schémas Zod pour les groupes de sécurité
const SecurityGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  category: z.string().optional(),
})

const SecurityGroupsResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(SecurityGroupSchema).optional().default([]),
})

type SecurityGroup = z.infer<typeof SecurityGroupSchema>

// Schémas Zod pour les plans
const PlanGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
})

const PlanSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price_monthly: z.number().nonnegative(),
  price_yearly: z.number().nonnegative(),
  max_users: z.number().nonnegative(),
  max_products: z.number().nonnegative(),
  max_orders_per_year: z.number().nonnegative(),
  trial_days: z.number().nonnegative().default(14),
  is_default: z.boolean().optional().default(false),
  is_popular: z.boolean().optional().default(false),
  enabled_modules: z.array(z.string()).optional().default([]),
  features: z.object({
    wishlist_enabled: z.boolean(),
    reviews_enabled: z.boolean(),
    newsletter_enabled: z.boolean(),
    product_comparison_enabled: z.boolean(),
    guest_checkout_enabled: z.boolean(),
    api_access: z.boolean().optional(),
    priority_support: z.boolean().optional(),
    custom_domain: z.boolean().optional(),
  }),
  group_ids: z.array(PlanGroupSchema).optional().default([]),
  is_active: z.boolean(),
  subscribers_count: z.number().nonnegative().optional(),
  created_at: z.string().optional(),
})

const PlansResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
  data: z.array(PlanSchema).optional().default([]),
})

type Plan = z.infer<typeof PlanSchema>

interface PlanFormData {
  code: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_products: number
  max_orders_per_year: number
  trial_days: number
  is_default: boolean
  features: Plan['features']
  group_ids: number[]
}

const DEFAULT_FEATURES: Plan['features'] = {
  wishlist_enabled: false,
  reviews_enabled: false,
  newsletter_enabled: false,
  product_comparison_enabled: false,
  guest_checkout_enabled: true,
  api_access: false,
  priority_support: false,
  custom_domain: false,
}

export function Plans() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: async () => {
      const response = await api.request<{ data: Plan[] }>({
        method: 'GET',
        path: '/api/super-admin/plans',
      })
      return validateApiResponse(PlansResponseSchema, response.data)
    },
  })

  const { data: groupsData, isLoading: isLoadingGroups, error: groupsError } = useQuery({
    queryKey: ['super-admin-security-groups'],
    queryFn: async () => {
      const response = await api.request<{ data: SecurityGroup[] }>({
        method: 'GET',
        path: '/api/super-admin/security-groups',
      })
      return validateApiResponse(SecurityGroupsResponseSchema, response.data)
    },
    retry: 1,
  })

  const securityGroups = groupsData?.data || []

  const plans = data?.data || []

  const savePlan = useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: PlanFormData }) => {
      if (id) {
        return api.request({
          method: 'PUT',
          path: `/api/super-admin/plans/${id}`,
          body: data,
        })
      }
      return api.request({
        method: 'POST',
        path: '/api/super-admin/plans',
        body: data,
      })
    },
    onSuccess: () => {
      toast.success(editingPlan ? 'Plan mis à jour' : 'Plan créé')
      setShowModal(false)
      setEditingPlan(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] })
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde')
    },
  })

  const archivePlan = useMutation({
    mutationFn: async (id: number) => {
      return api.request({
        method: 'DELETE',
        path: `/api/super-admin/plans/${id}`,
      })
    },
    onSuccess: () => {
      toast.success('Plan archivé')
      queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] })
    },
    onError: () => {
      toast.error('Erreur lors de l\'archivage')
    },
  })

  const updatePlanModules = useMutation({
    mutationFn: async ({ id, groupIds }: { id: number; groupIds: number[] }) => {
      return api.request({
        method: 'PUT',
        path: `/api/super-admin/plans/${id}`,
        body: { group_ids: groupIds },
      })
    },
    onSuccess: () => {
      toast.success('Modules mis à jour')
      queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des modules')
    },
  })

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setShowModal(true)
  }

  const openCreate = () => {
    setEditingPlan(null)
    setShowModal(true)
  }

  // Calcul des stats
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscribers_count || 0), 0)
  const totalMRR = plans.reduce((acc, p) => acc + (p.subscribers_count || 0) * p.price_monthly, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plans Tarifaires</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {plans.filter((p) => p.is_active).length} plans actifs • {totalSubscribers} abonnés • {totalMRR.toLocaleString('fr-FR')} € MRR
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau Plan
        </button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun plan tarifaire configuré</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
          >
            Créer le premier plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              securityGroups={securityGroups}
              onEdit={() => openEdit(plan)}
              onArchive={() => archivePlan.mutate(plan.id)}
              onUpdateModules={(groupIds) => updatePlanModules.mutate({ id: plan.id, groupIds })}
              isArchiving={archivePlan.isPending}
              isUpdatingModules={updatePlanModules.isPending}
            />
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <PlanModal
          plan={editingPlan}
          securityGroups={securityGroups}
          isLoadingGroups={isLoadingGroups}
          groupsError={!!groupsError}
          onClose={() => {
            setShowModal(false)
            setEditingPlan(null)
          }}
          onSave={(data) => savePlan.mutate({ id: editingPlan?.id, data })}
          isLoading={savePlan.isPending}
        />
      )}
    </div>
  )
}

// Parse le nom du groupe pour extraire module
function parseQuelyosGroup(group: { name: string; full_name: string }): ModuleKey | null {
  const name = group.name.toLowerCase()
  const fullName = group.full_name.toLowerCase()

  for (const mod of QUELYOS_MODULES) {
    const pattern = new RegExp(`quelyos\\s+${mod.key}\\s+(user|manager)`, 'i')
    if (pattern.test(name) || pattern.test(fullName)) {
      return mod.key
    }
  }
  return null
}

function PlanCard({
  plan,
  securityGroups,
  onEdit,
  onArchive,
  onUpdateModules,
  isArchiving,
  isUpdatingModules,
}: {
  plan: Plan
  securityGroups: SecurityGroup[]
  onEdit: () => void
  onArchive: () => void
  onUpdateModules: (groupIds: number[]) => void
  isArchiving: boolean
  isUpdatingModules: boolean
}) {
  const [showModules, setShowModules] = useState(false)
  const colorMap: Record<string, string> = {
    starter: 'from-green-500 to-emerald-500',
    pro: 'from-blue-500 to-indigo-500',
    enterprise: 'from-purple-500 to-pink-500',
  }
  const gradient = colorMap[plan.code] || 'from-gray-500 to-gray-600'

  // Créer une map groupe -> id pour chaque module (niveau user uniquement)
  const moduleGroupMap: Record<ModuleKey, number | undefined> = {
    home: undefined,
    finance: undefined,
    store: undefined,
    stock: undefined,
    crm: undefined,
    marketing: undefined,
    hr: undefined,
    support: undefined,
    pos: undefined,
  }

  for (const group of securityGroups) {
    const moduleKey = parseQuelyosGroup(group)
    if (moduleKey && group.name.toLowerCase().includes('user')) {
      moduleGroupMap[moduleKey] = group.id
    }
  }

  // Modules actuellement activés pour ce plan
  const activeModuleKeys = new Set<ModuleKey>()
  for (const group of plan.group_ids || []) {
    const moduleKey = parseQuelyosGroup(group)
    if (moduleKey) {
      activeModuleKeys.add(moduleKey)
    }
  }

  // Toggle un module (ajouter/retirer le groupe user)
  const toggleModule = (moduleKey: ModuleKey) => {
    const groupId = moduleGroupMap[moduleKey]
    if (!groupId) return

    const currentGroupIds = plan.group_ids?.map((g) => g.id) || []
    const newGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter((id) => id !== groupId)
      : [...currentGroupIds, groupId]

    onUpdateModules(newGroupIds)
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${
        !plan.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <div className="flex gap-2">
            {plan.is_default && (
              <span className="px-2 py-1 text-xs font-medium bg-white/90 text-gray-800 rounded-full">
                Par défaut
              </span>
            )}
            {plan.is_popular && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-400/90 text-gray-900 rounded-full">
                Populaire
              </span>
            )}
            {!plan.is_active && (
              <span className="px-2 py-1 text-xs font-medium bg-white/20 text-white rounded-full">
                Archivé
              </span>
            )}
          </div>
        </div>
        <p className="text-white/80 text-sm mt-1">{plan.code.toUpperCase()}</p>
      </div>

      {/* Pricing */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {plan.price_monthly}€
          </span>
          <span className="text-gray-500 dark:text-gray-400">/mois</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ou {plan.price_yearly}€/an ({Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% économie)
        </p>
      </div>

      {/* Quotas */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {plan.max_users === 0 ? 'Utilisateurs illimités' : `${plan.max_users} utilisateurs max`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {plan.max_products === 0 ? 'Produits illimités' : `${plan.max_products} produits max`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Receipt className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {plan.max_orders_per_year === 0 ? 'Commandes illimitées' : `${plan.max_orders_per_year} commandes/an`}
          </span>
        </div>

        {/* Trial Period */}
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {plan.trial_days} jour{plan.trial_days > 1 ? 's' : ''} d&apos;essai
          </span>
        </div>

        {plan.group_ids && plan.group_ids.length > 0 && (
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {plan.group_ids.length} groupe{plan.group_ids.length > 1 ? 's' : ''} de sécurité
            </span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="p-4 space-y-2 border-b border-gray-200 dark:border-gray-700">
        {Object.entries(plan.features).map(([key, enabled]) => (
          <div key={key} className="flex items-center gap-2">
            {enabled ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            )}
            <span
              className={`text-sm ${enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {formatFeatureName(key)}
            </span>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowModules(!showModules)}
          disabled={isUpdatingModules}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Modules ({activeModuleKeys.size}/{QUELYOS_MODULES.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isUpdatingModules && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            {showModules ? (
              <X className="w-4 h-4 text-gray-400" />
            ) : (
              <Plus className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>

        {showModules && (
          <div className="p-4 pt-0 space-y-2">
            {QUELYOS_MODULES.map((mod) => {
              const isActive = activeModuleKeys.has(mod.key)
              const groupId = moduleGroupMap[mod.key]
              const canToggle = !!groupId

              return (
                <label
                  key={mod.key}
                  className={`flex items-center gap-3 p-2 rounded transition ${
                    canToggle
                      ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleModule(mod.key)}
                    disabled={!canToggle || isUpdatingModules}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{mod.label}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats & Actions */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {plan.subscribers_count || 0} abonnés
        </span>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {plan.is_active && (
            <button
              onClick={onArchive}
              disabled={isArchiving}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50"
              title="Archiver"
            >
              {isArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanModal({
  plan,
  securityGroups,
  isLoadingGroups,
  groupsError,
  onClose,
  onSave,
  isLoading,
}: {
  plan: Plan | null
  securityGroups: SecurityGroup[]
  isLoadingGroups: boolean
  groupsError: boolean
  onClose: () => void
  onSave: (data: PlanFormData) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState<PlanFormData>({
    code: plan?.code || '',
    name: plan?.name || '',
    description: plan?.description || '',
    price_monthly: plan?.price_monthly || 0,
    price_yearly: plan?.price_yearly || 0,
    max_users: plan?.max_users || 5,
    max_products: plan?.max_products || 100,
    max_orders_per_year: plan?.max_orders_per_year || 1000,
    trial_days: plan?.trial_days || 14,
    is_default: plan?.is_default || false,
    features: plan?.features || DEFAULT_FEATURES,
    group_ids: plan?.group_ids?.map((g) => g.id) || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const toggleFeature = (key: keyof Plan['features']) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {plan ? 'Modifier le Plan' : 'Nouveau Plan Tarifaire'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code (slug) *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="starter"
                disabled={!!plan}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Starter"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Tarification */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tarification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Prix mensuel (€)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price_monthly}
                  onChange={(e) => setForm((prev) => ({ ...prev, price_monthly: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Prix annuel (€)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price_yearly}
                  onChange={(e) => setForm((prev) => ({ ...prev, price_yearly: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Quotas */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quotas <span className="text-xs font-normal text-gray-500">(0 = illimité)</span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Utilisateurs max</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_users}
                  onChange={(e) => setForm((prev) => ({ ...prev, max_users: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Produits max</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_products}
                  onChange={(e) => setForm((prev) => ({ ...prev, max_products: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Commandes/an</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_orders_per_year}
                  onChange={(e) => setForm((prev) => ({ ...prev, max_orders_per_year: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Trial Period */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Période d&apos;essai (jours)
              </label>
              <input
                type="number"
                min={0}
                max={365}
                value={form.trial_days}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  trial_days: parseInt(e.target.value) || 14
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="14"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nombre de jours d&apos;essai gratuit avant facturation (par défaut : 14)
              </p>
            </div>

            {/* Plan par défaut */}
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    is_default: e.target.checked
                  }))}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Marquer comme plan par défaut
                </span>
              </label>
              <p className="mt-1 ml-7 text-xs text-gray-500 dark:text-gray-400">
                Ce plan sera automatiquement assigné aux nouveaux tenants (un seul plan peut être par défaut)
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Features Incluses</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(form.features).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.features[key as keyof Plan['features']]}
                    onChange={() => toggleFeature(key as keyof Plan['features'])}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatFeatureName(key)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Groupes de Sécurité (Modules Quelyos) */}
          <ModuleGroupSelector
            securityGroups={securityGroups}
            selectedGroupIds={form.group_ids}
            onChange={(ids) => setForm((prev) => ({ ...prev, group_ids: ids }))}
            isLoading={isLoadingGroups}
            error={!!groupsError}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatFeatureName(key: string): string {
  const names: Record<string, string> = {
    wishlist_enabled: 'Liste de souhaits',
    reviews_enabled: 'Avis clients',
    newsletter_enabled: 'Newsletter',
    product_comparison_enabled: 'Comparateur produits',
    guest_checkout_enabled: 'Commande invité',
    api_access: 'Accès API',
    priority_support: 'Support prioritaire',
    custom_domain: 'Domaine personnalisé',
  }
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
