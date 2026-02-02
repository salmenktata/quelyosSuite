/**
 * Mon Abonnement - Vue self-service abonnement client
 *
 * Fonctionnalités :
 * 1. Affichage plan actuel avec statut et dates clés
 * 2. Jauges d'utilisation quotas (utilisateurs, produits, commandes)
 * 3. Plans disponibles pour upgrade avec comparaison
 * 4. Actions : upgrade plan, annuler abonnement
 * 5. État vide si aucun abonnement (invitation à souscrire)
 */

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, Badge } from '@/components/common'
import {
  CreditCard,
  AlertCircle,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  RefreshCw,
  Zap,
  XCircle,
  Crown,
  ArrowUpRight,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { backendRpc } from '@/lib/backend-rpc'
import { logger } from '@quelyos/logger'

interface CurrentSubscription {
  id: number
  name: string
  partner: { id: number; name: string; email: string }
  plan: { id: number; name: string; code: string }
  state: string
  billing_cycle: string
  start_date: string | null
  trial_end_date: string | null
  next_billing_date: string | null
  usage: {
    users: QuotaInfo
    products: QuotaInfo
    orders: QuotaInfo
  }
}

interface QuotaInfo {
  current: number
  limit: number
  percentage: number
  is_limit_reached: boolean
}

interface PlanInfo {
  id: number
  name: string
  code: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_products: number
  max_orders_per_year: number
  support_level: string
  features: string[]
  description: string
  is_popular: boolean
}

const STATE_LABELS: Record<string, string> = {
  trial: 'Essai gratuit',
  active: 'Actif',
  past_due: 'Paiement en retard',
  cancelled: 'Annulé',
  expired: 'Expiré',
}

const STATE_COLORS: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  trial: 'info',
  active: 'success',
  past_due: 'warning',
  cancelled: 'error',
  expired: 'neutral',
}

const CYCLE_LABELS: Record<string, string> = {
  monthly: 'Mensuel',
  yearly: 'Annuel',
}

const breadcrumbItems = [
  { label: 'Accueil', href: '/dashboard' },
  { label: 'Mon abonnement' },
]

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showPlans, setShowPlans] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [subRes, plansRes] = await Promise.all([
        backendRpc<{ data: CurrentSubscription | null }>('/api/ecommerce/subscription/current', {}),
        backendRpc<{ data: PlanInfo[] }>('/api/ecommerce/subscription/plans', {}),
      ])

      if (subRes.success) {
        const raw = subRes.data as unknown as { data: CurrentSubscription | null }
        setSubscription(raw.data ?? null)
      } else {
        setError(subRes.error || 'Erreur lors du chargement')
      }

      if (plansRes.success) {
        const rawPlans = plansRes.data as unknown as { data: PlanInfo[] }
        setPlans(rawPlans.data || [])
      }
    } catch (_err) {
      logger.error('Erreur fetch subscription:', _err)
      setError('Impossible de charger les informations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCancel = async () => {
    setActionLoading('cancel')
    try {
      const res = await backendRpc('/api/ecommerce/subscription/cancel', {})
      if (res.success) {
        await fetchData()
      } else {
        setError(res.error || `Erreur lors de l'annulation`)
      }
    } catch (_err) {
      logger.error('Erreur annulation:', _err)
      setError(`Impossible d'annuler l'abonnement`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpgrade = async (planId: number) => {
    setActionLoading(`upgrade-${planId}`)
    try {
      const res = await backendRpc('/api/ecommerce/subscription/upgrade', { plan_id: planId })
      if (res.success) {
        setShowPlans(false)
        await fetchData()
      } else {
        setError(res.error || `Erreur lors de la mise à niveau`)
      }
    } catch (_err) {
      logger.error('Erreur upgrade:', _err)
      setError(`Impossible de mettre à niveau l'abonnement`)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const daysUntil = (dateStr: string | null) => {
    if (!dateStr) return null
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Mon abonnement
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subscription
                ? `Plan ${subscription.plan.name} — ${CYCLE_LABELS[subscription.billing_cycle] || subscription.billing_cycle}`
                : 'Aucun abonnement actif'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Actualiser
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!subscription ? (
          /* No subscription - CTA */
          <NoSubscription plans={plans} onSelectPlan={handleUpgrade} actionLoading={actionLoading} />
        ) : (
          <>
            {/* Trial banner */}
            {subscription.state === 'trial' && subscription.trial_end_date && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {`Période d'essai — ${daysUntil(subscription.trial_end_date)} jour(s) restant(s)`}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {`Fin de l'essai le ${formatDate(subscription.trial_end_date)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Past due warning */}
            {subscription.state === 'past_due' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Votre paiement est en retard. Veuillez régulariser pour éviter la suspension.
                </p>
              </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard
                icon={CreditCard}
                label="Plan actuel"
                value={subscription.plan.name}
                sub={
                  <Badge variant={STATE_COLORS[subscription.state] || 'neutral'}>
                    {STATE_LABELS[subscription.state] || subscription.state}
                  </Badge>
                }
              />
              <InfoCard
                icon={Calendar}
                label="Début"
                value={formatDate(subscription.start_date)}
              />
              <InfoCard
                icon={Calendar}
                label="Prochaine facture"
                value={formatDate(subscription.next_billing_date)}
                sub={
                  subscription.next_billing_date
                    ? <span className="text-xs text-gray-500 dark:text-gray-400">{`Dans ${daysUntil(subscription.next_billing_date)} jour(s)`}</span>
                    : undefined
                }
              />
              <InfoCard
                icon={Zap}
                label="Cycle"
                value={CYCLE_LABELS[subscription.billing_cycle] || subscription.billing_cycle}
              />
            </div>

            {/* Quotas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Utilisation des quotas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <QuotaGauge
                  icon={Users}
                  label="Utilisateurs"
                  current={subscription.usage.users.current}
                  limit={subscription.usage.users.limit}
                  percentage={subscription.usage.users.percentage}
                  isLimitReached={subscription.usage.users.is_limit_reached}
                />
                <QuotaGauge
                  icon={Package}
                  label="Produits"
                  current={subscription.usage.products.current}
                  limit={subscription.usage.products.limit}
                  percentage={subscription.usage.products.percentage}
                  isLimitReached={subscription.usage.products.is_limit_reached}
                />
                <QuotaGauge
                  icon={ShoppingCart}
                  label="Commandes / an"
                  current={subscription.usage.orders.current}
                  limit={subscription.usage.orders.limit}
                  percentage={subscription.usage.orders.percentage}
                  isLimitReached={subscription.usage.orders.is_limit_reached}
                />
              </div>

              {/* Upgrade CTA if quota near limit */}
              {(subscription.usage.users.percentage >= 80 ||
                subscription.usage.products.percentage >= 80 ||
                subscription.usage.orders.percentage >= 80) && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-5 h-5 text-indigo-500" />
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      {`Vous approchez de vos limites. Passez à un plan supérieur pour plus de capacité.`}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowPlans(true)}>
                    Voir les plans
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPlans(!showPlans)}
                icon={<Crown className="w-4 h-4" />}
              >
                {showPlans ? 'Masquer les plans' : 'Changer de plan'}
              </Button>
              {(subscription.state === 'active' || subscription.state === 'trial') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  {actionLoading === 'cancel' ? 'Annulation...' : 'Annuler mon abonnement'}
                </Button>
              )}
            </div>

            {/* Plans upgrade */}
            {showPlans && (
              <PlansGrid
                plans={plans}
                currentPlanId={subscription.plan.id}
                billingCycle={subscription.billing_cycle}
                onUpgrade={handleUpgrade}
                actionLoading={actionLoading}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

/* ─── Sub-components ──────────────────────────────────────────── */

function NoSubscription({
  plans,
  onSelectPlan,
  actionLoading,
}: {
  plans: PlanInfo[]
  onSelectPlan: (planId: number) => void
  actionLoading: string | null
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucun abonnement actif
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {`Choisissez un plan ci-dessous pour commencer avec une période d'essai gratuite.`}
        </p>
      </div>
      {plans.length > 0 && (
        <PlansGrid
          plans={plans}
          currentPlanId={null}
          billingCycle="monthly"
          onUpgrade={onSelectPlan}
          actionLoading={actionLoading}
        />
      )}
    </div>
  )
}

function PlansGrid({
  plans,
  currentPlanId,
  billingCycle,
  onUpgrade,
  actionLoading,
}: {
  plans: PlanInfo[]
  currentPlanId: number | null
  billingCycle: string
  onUpgrade: (planId: number) => void
  actionLoading: string | null
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId
        const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
        return (
          <div
            key={plan.id}
            className={`relative bg-white dark:bg-gray-800 rounded-xl border p-5 flex flex-col ${
              plan.is_popular
                ? 'border-indigo-500 dark:border-indigo-400 ring-1 ring-indigo-500 dark:ring-indigo-400'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {plan.is_popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-500 text-white text-xs font-medium rounded-full">
                Populaire
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 min-h-[2.5rem]">
              {plan.description || '\u00A0'}
            </p>
            <p className="mt-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {price > 0 ? `${price}€` : 'Gratuit'}
              </span>
              {price > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  /{billingCycle === 'yearly' ? 'an' : 'mois'}
                </span>
              )}
            </p>
            <ul className="mt-4 space-y-2 flex-1">
              <PlanLimit label="Utilisateurs" value={plan.max_users} />
              <PlanLimit label="Produits" value={plan.max_products} />
              <PlanLimit label="Commandes/an" value={plan.max_orders_per_year} />
              {plan.features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {isCurrent ? (
                <Button variant="outline" size="sm" disabled className="w-full">
                  Plan actuel
                </Button>
              ) : (
                <Button
                  variant={plan.is_popular ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => onUpgrade(plan.id)}
                  disabled={actionLoading === `upgrade-${plan.id}`}
                >
                  {actionLoading === `upgrade-${plan.id}`
                    ? 'En cours...'
                    : currentPlanId
                      ? 'Passer à ce plan'
                      : 'Commencer'}
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PlanLimit({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="font-medium text-gray-900 dark:text-white">
        {value === 0 ? 'Illimité' : value}
      </span>
      {label}
    </li>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  )
}

function QuotaGauge({
  icon: Icon,
  label,
  current,
  limit,
  percentage,
  isLimitReached,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  current: number
  limit: number
  percentage: number
  isLimitReached: boolean
}) {
  const pct = Math.min(percentage, 100)
  const color = isLimitReached
    ? 'text-red-600 dark:text-red-400'
    : pct >= 80
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400'
  const barColor = isLimitReached ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>
        {current}
        <span className="text-lg text-gray-400 dark:text-gray-500">
          /{limit === 0 ? '∞' : limit}
        </span>
      </p>
      {limit > 0 && (
        <>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pct.toFixed(0)}% utilisé</p>
        </>
      )}
      {limit === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Illimité</p>
      )}
      {isLimitReached && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">Limite atteinte</p>
      )}
    </div>
  )
}
