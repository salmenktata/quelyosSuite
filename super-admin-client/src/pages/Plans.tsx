/**
 * Gestion des Plans Tarifaires — Système Modulaire Unifié
 *
 * Fonctionnalités :
 * - Modules individuels (Finance, Boutique, CRM, etc.)
 * - Solutions métier (packs sectoriels à prix réduit)
 * - Pack utilisateurs (+5 users)
 * - Enterprise (sur devis)
 * - CRUD complet avec groupes de sécurité
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package, Plus, Edit2, Archive, Check, X, Loader2, Users,
  Clock, Blocks, Palette, Megaphone, Trash2, Layers,
  DollarSign, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { ModuleGroupSelector } from '@/components/common'
import { useToast } from '@/hooks/useToast'
import { z } from 'zod'
import { validateApiResponse } from '@/lib/validators'
import { QUELYOS_MODULES, type ModuleKey } from '@/config/modules'

// ─── Schemas Zod ────────────────────────────────────────────────────
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

const PlanGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
})

const PLAN_TYPES = ['module', 'solution', 'user_pack', 'enterprise'] as const
type PlanType = typeof PLAN_TYPES[number]

const PlanSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  plan_type: z.enum(PLAN_TYPES).optional().default('module'),
  price_monthly: z.number().nonnegative(),
  price_yearly: z.number().nonnegative(),
  max_users: z.number().nonnegative(),
  max_products: z.number().nonnegative(),
  max_orders_per_year: z.number().nonnegative(),
  trial_days: z.number().nonnegative().default(30),
  is_default: z.boolean().optional().default(false),
  is_popular: z.boolean().optional().default(false),
  original_price: z.number().nonnegative().optional().default(0),
  badge_text: z.string().optional().default(''),
  cta_text: z.string().optional().default('Essai gratuit 30 jours'),
  cta_href: z.string().optional().default('/register'),
  yearly_discount_pct: z.number().nonnegative().optional().default(22),
  features_marketing: z.array(z.string()).optional().default([]),
  icon_name: z.string().optional().default('Layers'),
  color_theme: z.enum(['emerald', 'indigo', 'amber', 'violet']).optional().default('emerald'),
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
  // Nouveaux champs modulaires
  module_key: z.string().nullable().optional(),
  limit_name: z.string().nullable().optional(),
  limit_included: z.number().nonnegative().optional().default(0),
  surplus_price: z.number().nonnegative().optional().default(0),
  surplus_unit: z.number().nonnegative().optional().default(500),
  users_included: z.number().nonnegative().optional().default(5),
  pack_size: z.number().nonnegative().optional().default(5),
  solution_slug: z.string().nullable().optional(),
  solution_modules: z.array(z.string()).optional(),
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
  plan_type: PlanType
  price_monthly: number
  price_yearly: number
  max_users: number
  max_products: number
  max_orders_per_year: number
  trial_days: number
  is_default: boolean
  original_price: number
  badge_text: string
  cta_text: string
  cta_href: string
  yearly_discount_pct: number
  features_marketing: string[]
  icon_name: string
  color_theme: 'emerald' | 'indigo' | 'amber' | 'violet'
  features: Plan['features']
  group_ids: number[]
  module_key: string
  limit_name: string
  limit_included: number
  surplus_price: number
  surplus_unit: number
  users_included: number
  pack_size: number
  solution_slug: string
  solution_modules: string[]
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

const PLAN_TYPE_LABELS: Record<string, string> = {
  module: 'Module',
  solution: 'Solution métier',
  user_pack: 'Pack users',
  enterprise: 'Enterprise',
}

const PLAN_TYPE_COLORS: Record<string, string> = {
  module: 'bg-blue-500',
  solution: 'bg-purple-500',
  user_pack: 'bg-orange-500',
  enterprise: 'bg-amber-500',
}

// ─── Main Component ─────────────────────────────────────────────────

export function Plans() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

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

  const filteredPlans = filterType === 'all'
    ? plans
    : plans.filter((p) => p.plan_type === filterType)

  const savePlan = useMutation({
    mutationFn: async ({ id, data }: { id?: number; data: PlanFormData }) => {
      if (id) {
        return api.request({ method: 'PUT', path: `/api/super-admin/plans/${id}`, body: data })
      }
      return api.request({ method: 'POST', path: '/api/super-admin/plans', body: data })
    },
    onSuccess: () => {
      toast.success(editingPlan ? 'Plan mis à jour' : 'Plan créé')
      setShowModal(false)
      setEditingPlan(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] })
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  })

  const archivePlan = useMutation({
    mutationFn: async (id: number) => api.request({ method: 'DELETE', path: `/api/super-admin/plans/${id}` }),
    onSuccess: () => {
      toast.success('Plan archivé')
      queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] })
    },
    onError: () => toast.error('Erreur lors de l\'archivage'),
  })

  // Stats
  const modulePlans = plans.filter((p) => p.plan_type === 'module')
  const solutionPlans = plans.filter((p) => p.plan_type === 'solution')
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscribers_count || 0), 0)
  const totalMRR = plans.reduce((acc, p) => acc + (p.subscribers_count || 0) * p.price_monthly, 0)

  // Type counts
  const typeCounts: Record<string, number> = {}
  for (const plan of plans) {
    const t = plan.plan_type || 'module'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plans Tarifaires</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {modulePlans.length} modules • {solutionPlans.length} solutions • {totalSubscribers} abonnés • {totalMRR.toLocaleString('fr-FR')}€ MRR
          </p>
        </div>
        <button
          onClick={() => { setEditingPlan(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Modules" value={`${modulePlans.length} actifs`} icon={<Blocks className="w-5 h-5" />} />
        <StatCard label="Solutions métier" value={`${solutionPlans.length} packs`} icon={<Package className="w-5 h-5" />} />
        <StatCard label="Abonnés" value={`${totalSubscribers}`} icon={<Users className="w-5 h-5" />} />
        <StatCard label="MRR Total" value={`${totalMRR.toLocaleString('fr-FR')}€`} icon={<DollarSign className="w-5 h-5" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton label="Tous" count={plans.length} active={filterType === 'all'} onClick={() => setFilterType('all')} />
        {Object.entries(typeCounts).sort().map(([type, count]) => (
          <FilterButton
            key={type}
            label={PLAN_TYPE_LABELS[type] || type}
            count={count}
            active={filterType === type}
            onClick={() => setFilterType(type)}
            color={PLAN_TYPE_COLORS[type]}
          />
        ))}
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun plan trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              securityGroups={securityGroups}
              onEdit={() => { setEditingPlan(plan); setShowModal(true) }}
              onArchive={() => archivePlan.mutate(plan.id)}
              isArchiving={archivePlan.isPending}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlanModal
          plan={editingPlan}
          securityGroups={securityGroups}
          isLoadingGroups={isLoadingGroups}
          groupsError={!!groupsError}
          onClose={() => { setShowModal(false); setEditingPlan(null) }}
          onSave={(data) => savePlan.mutate({ id: editingPlan?.id, data })}
          isLoading={savePlan.isPending}
        />
      )}
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Button ──────────────────────────────────────────────────

function FilterButton({ label, count, active, onClick, color }: {
  label: string; count: number; active: boolean; onClick: () => void; color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        active
          ? 'bg-teal-600 text-white'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {color && <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />}
      {label} ({count})
    </button>
  )
}

// ─── Plan Card ──────────────────────────────────────────────────────

function PlanCard({
  plan,
  securityGroups: _securityGroups,
  onEdit,
  onArchive,
  isArchiving,
}: {
  plan: Plan
  securityGroups: SecurityGroup[]
  onEdit: () => void
  onArchive: () => void
  isArchiving: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const colorMap: Record<string, string> = {
    emerald: 'from-green-500 to-emerald-500',
    indigo: 'from-blue-500 to-indigo-500',
    amber: 'from-amber-500 to-orange-500',
    violet: 'from-purple-500 to-pink-500',
  }
  const gradient = colorMap[plan.color_theme || 'emerald'] || 'from-gray-500 to-gray-600'

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${!plan.is_active ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{plan.name}</h3>
          <div className="flex gap-1.5">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PLAN_TYPE_COLORS[plan.plan_type || 'module']} text-white`}>
              {PLAN_TYPE_LABELS[plan.plan_type || 'module'] || plan.plan_type}
            </span>
            {plan.is_default && (
              <span className="px-2 py-0.5 text-xs font-medium bg-white/90 text-gray-800 rounded-full">Défaut</span>
            )}
          </div>
        </div>
        <p className="text-white/80 text-sm mt-1">{plan.code}</p>
      </div>

      {/* Pricing */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {plan.price_monthly > 0 ? `${plan.price_monthly}€` : 'Sur devis'}
          </span>
          {plan.price_monthly > 0 && <span className="text-gray-500 dark:text-gray-400">/mois</span>}
        </div>
        {plan.price_yearly > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ou {plan.price_yearly}€/an (-{plan.yearly_discount_pct}%)
          </p>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2 border-b border-gray-200 dark:border-gray-700">
        {plan.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
        )}

        {/* Module-specific info */}
        {plan.plan_type === 'module' && plan.module_key && (
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Module: {plan.module_key}</span>
          </div>
        )}

        {/* Limits */}
        {plan.limit_name && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {plan.limit_included} {plan.limit_name} inclus (+{plan.surplus_price}€/{plan.surplus_unit})
            </span>
          </div>
        )}

        {/* Solution modules */}
        {plan.plan_type === 'solution' && plan.solution_modules && (
          <div className="flex flex-wrap gap-1">
            {plan.solution_modules.map((m) => (
              <span key={m} className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                {m}
              </span>
            ))}
          </div>
        )}

        {/* User pack */}
        {plan.plan_type === 'user_pack' && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Pack de {plan.pack_size} utilisateurs</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {plan.trial_days > 0 ? `${plan.trial_days} jours d\u0027essai` : 'Pas d\u0027essai'}
          </span>
        </div>
      </div>

      {/* Expandable features marketing */}
      {plan.features_marketing && plan.features_marketing.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {plan.features_marketing.length} features vitrine
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expanded && (
            <ul className="px-4 pb-3 space-y-1">
              {plan.features_marketing.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="w-3 h-3 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {plan.subscribers_count || 0} abonnés
        </span>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400" title="Modifier">
            <Edit2 className="w-4 h-4" />
          </button>
          {plan.is_active && (
            <button onClick={onArchive} disabled={isArchiving} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50" title="Archiver">
              {isArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Plan Modal ─────────────────────────────────────────────────────

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
    plan_type: (plan?.plan_type as PlanType) || 'module',
    price_monthly: plan?.price_monthly || 0,
    price_yearly: plan?.price_yearly || 0,
    max_users: plan?.max_users || 0,
    max_products: plan?.max_products || 0,
    max_orders_per_year: plan?.max_orders_per_year || 0,
    trial_days: plan?.trial_days || 30,
    is_default: plan?.is_default || false,
    original_price: plan?.original_price || 0,
    badge_text: plan?.badge_text || '',
    cta_text: plan?.cta_text || 'Essai gratuit 30 jours',
    cta_href: plan?.cta_href || '/register',
    yearly_discount_pct: plan?.yearly_discount_pct || 22,
    features_marketing: plan?.features_marketing || [],
    icon_name: plan?.icon_name || 'Layers',
    color_theme: plan?.color_theme || 'emerald',
    features: plan?.features || DEFAULT_FEATURES,
    group_ids: plan?.group_ids?.map((g) => g.id) || [],
    module_key: plan?.module_key || '',
    limit_name: plan?.limit_name || '',
    limit_included: plan?.limit_included || 0,
    surplus_price: plan?.surplus_price || 0,
    surplus_unit: plan?.surplus_unit || 500,
    users_included: plan?.users_included || 5,
    pack_size: plan?.pack_size || 5,
    solution_slug: plan?.solution_slug || '',
    solution_modules: plan?.solution_modules || [],
  })

  const [newFeature, setNewFeature] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const isModuleType = form.plan_type === 'module'
  const isSolutionType = form.plan_type === 'solution'
  const isUserPackType = form.plan_type === 'user_pack'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {plan ? 'Modifier le Plan' : 'Nouveau Plan'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Base info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                disabled={!!plan}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select
                value={form.plan_type}
                onChange={(e) => setForm((p) => ({ ...p, plan_type: e.target.value as PlanType }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {PLAN_TYPES.map((t) => (
                  <option key={t} value={t}>{PLAN_TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Module-specific fields */}
          {isModuleType && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Blocks className="w-4 h-4" /> Module
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Module associé</label>
                  <select
                    value={form.module_key}
                    onChange={(e) => setForm((p) => ({ ...p, module_key: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Aucun</option>
                    {QUELYOS_MODULES.filter((m) => m.key !== 'home').map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Nom limite</label>
                  <input
                    type="text"
                    value={form.limit_name}
                    onChange={(e) => setForm((p) => ({ ...p, limit_name: e.target.value }))}
                    placeholder="products, contacts..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Quantité incluse</label>
                  <input
                    type="number"
                    min={0}
                    value={form.limit_included}
                    onChange={(e) => setForm((p) => ({ ...p, limit_included: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Prix surplus (€/tranche)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.surplus_price}
                    onChange={(e) => setForm((p) => ({ ...p, surplus_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Solution-specific fields */}
          {isSolutionType && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Solution métier
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Slug solution</label>
                  <input
                    type="text"
                    value={form.solution_slug}
                    onChange={(e) => setForm((p) => ({ ...p, solution_slug: e.target.value }))}
                    placeholder="restaurant, commerce..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Modules inclus</label>
                  <div className="flex flex-wrap gap-2">
                    {QUELYOS_MODULES.filter((m) => m.key !== 'home').map((m) => {
                      const selected = form.solution_modules.includes(m.key)
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            setForm((p) => ({
                              ...p,
                              solution_modules: selected
                                ? p.solution_modules.filter((k) => k !== m.key)
                                : [...p.solution_modules, m.key],
                            }))
                          }}
                          className={`px-2 py-1 text-xs rounded-lg transition ${
                            selected
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User pack specific */}
          {isUserPackType && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Pack utilisateurs</h3>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Taille du pack</label>
                <input
                  type="number"
                  min={1}
                  value={form.pack_size}
                  onChange={(e) => setForm((p) => ({ ...p, pack_size: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Tarification */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tarification</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Prix mensuel (€)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price_monthly}
                  onChange={(e) => setForm((p) => ({ ...p, price_monthly: parseFloat(e.target.value) || 0 }))}
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
                  onChange={(e) => setForm((p) => ({ ...p, price_yearly: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Remise annuelle (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={form.yearly_discount_pct}
                  onChange={(e) => setForm((p) => ({ ...p, yearly_discount_pct: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Trial + Default */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Période d&apos;essai (jours)</label>
              <input
                type="number"
                min={0}
                max={365}
                value={form.trial_days}
                onChange={(e) => setForm((p) => ({ ...p, trial_days: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Plan par défaut</span>
              </label>
            </div>
          </div>

          {/* Apparence */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Apparence
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Icône Lucide</label>
                <input
                  type="text"
                  value={form.icon_name}
                  onChange={(e) => setForm((p) => ({ ...p, icon_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Couleur</label>
                <div className="flex gap-3">
                  {(['emerald', 'indigo', 'amber', 'violet'] as const).map((color) => {
                    const colorBgs: Record<string, string> = { emerald: 'bg-emerald-500', indigo: 'bg-indigo-500', amber: 'bg-amber-500', violet: 'bg-violet-500' }
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, color_theme: color }))}
                        className={`w-8 h-8 rounded-full ${colorBgs[color]} transition-all ${form.color_theme === color ? 'ring-2 ring-offset-2 ring-teal-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Marketing */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Marketing
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Badge</label>
                <input
                  type="text"
                  value={form.badge_text}
                  onChange={(e) => setForm((p) => ({ ...p, badge_text: e.target.value }))}
                  placeholder="Ex: -28% vs modules"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Texte CTA</label>
                <input
                  type="text"
                  value={form.cta_text}
                  onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Features marketing list */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400">Features vitrine ({form.features_marketing.length})</label>
              {form.features_marketing.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const updated = [...form.features_marketing]
                      updated[index] = e.target.value
                      setForm((p) => ({ ...p, features_marketing: updated }))
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, features_marketing: p.features_marketing.filter((_, i) => i !== index) }))}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFeature.trim()) {
                      e.preventDefault()
                      setForm((p) => ({ ...p, features_marketing: [...p.features_marketing, newFeature.trim()] }))
                      setNewFeature('')
                    }
                  }}
                  placeholder="Ajouter une feature..."
                  className="flex-1 px-3 py-1.5 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newFeature.trim()) {
                      setForm((p) => ({ ...p, features_marketing: [...p.features_marketing, newFeature.trim()] }))
                      setNewFeature('')
                    }
                  }}
                  className="p-1.5 text-teal-600 hover:text-teal-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Security Groups */}
          <ModuleGroupSelector
            securityGroups={securityGroups}
            selectedGroupIds={form.group_ids}
            onChange={(ids) => setForm((p) => ({ ...p, group_ids: ids }))}
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
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</> : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
