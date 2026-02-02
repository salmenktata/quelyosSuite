/**
 * Détail Abonnement - Vue complète avec quotas, santé et actions
 *
 * Fonctionnalités :
 * 1. Informations client et plan avec dates clés
 * 2. Jauges d'utilisation quotas (utilisateurs, produits, commandes)
 * 3. Score de santé client avec indicateurs visuels
 * 4. Actions : activer, upgrader, annuler
 * 5. Historique intégration Stripe (IDs)
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, Badge } from '@/components/common'
import {
  ArrowLeft,
  AlertCircle,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Calendar,
  RefreshCw,
  TrendingUp,
  Heart,
  Shield,
  Zap,
  XCircle,
  CheckCircle,
} from 'lucide-react'
import { backendRpc } from '@/lib/backend-rpc'
import { logger } from '@quelyos/logger'

interface SubscriptionDetail {
  id: number
  name: string
  partner: { id: number; name: string; email: string }
  plan: { id: number; name: string; code: string }
  state: string
  billing_cycle: string
  start_date: string | null
  trial_end_date: string | null
  next_billing_date: string | null
  end_date: string | null
  usage: {
    users: QuotaInfo
    products: QuotaInfo
    orders: QuotaInfo
  }
  stripe_subscription_id: string
  stripe_customer_id: string
  health_score?: number
  health_status?: string
  mrr?: number
  churn_risk?: number
}

interface QuotaInfo {
  current: number
  limit: number
  percentage: number
  is_limit_reached: boolean
}

const STATE_LABELS: Record<string, string> = {
  trial: 'Essai',
  active: 'Actif',
  past_due: 'En retard',
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

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await backendRpc<SubscriptionDetail>(
        `/api/ecommerce/subscription/admin/${id}`,
        {}
      )
      if (res.success && res.data) {
        const raw = res.data as unknown as { data: SubscriptionDetail }
        setSubscription(raw.data || (res.data as SubscriptionDetail))
      } else {
        setError(res.error || 'Abonnement non trouvé')
      }
    } catch (_err) {
      logger.error('Erreur fetch subscription detail:', _err)
      setError('Impossible de charger les détails')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const handleAction = async (action: 'cancel') => {
    if (!subscription) return
    setActionLoading(action)
    try {
      const endpoint = `/api/ecommerce/subscription/${action}`
      const res = await backendRpc(endpoint, {})
      if (res.success) {
        await fetchSubscription()
      } else {
        setError(res.error || `Erreur lors de l'action`)
      }
    } catch (_err) {
      logger.error(`Erreur action ${action}:`, _err)
      setError(`Impossible d'exécuter l'action`)
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

  const breadcrumbItems = [
    { label: 'Accueil', href: '/dashboard' },
    { label: 'Abonnements', href: '/dashboard/subscriptions' },
    { label: subscription?.name || `#${id}` },
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  if (error && !subscription) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs items={breadcrumbItems} />
          <div role="alert" className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/dashboard/subscriptions')}>
                Retour à la liste
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!subscription) return null

  const sub = subscription

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/subscriptions')} icon={<ArrowLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sub.name}</h1>
                <Badge variant={STATE_COLORS[sub.state] || 'neutral'}>
                  {STATE_LABELS[sub.state] || sub.state}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {sub.partner.name} — {sub.partner.email}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSubscription} icon={<RefreshCw className="w-4 h-4" />}>
              Actualiser
            </Button>
            {(sub.state === 'active' || sub.state === 'trial') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('cancel')}
                disabled={actionLoading === 'cancel'}
                icon={<XCircle className="w-4 h-4" />}
              >
                {actionLoading === 'cancel' ? 'Annulation...' : 'Annuler'}
              </Button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={CreditCard} label="Plan" value={sub.plan.name} sub={sub.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'} />
          <InfoCard icon={Calendar} label="Début" value={formatDate(sub.start_date)} sub={sub.trial_end_date ? `Essai jusqu'au ${formatDate(sub.trial_end_date)}` : undefined} />
          <InfoCard icon={Calendar} label="Prochaine facture" value={formatDate(sub.next_billing_date)} />
          <InfoCard
            icon={TrendingUp}
            label="MRR"
            value={sub.mrr != null ? `${sub.mrr.toFixed(2)} €` : '—'}
            sub={sub.end_date ? `Fin : ${formatDate(sub.end_date)}` : undefined}
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
              current={sub.usage.users.current}
              limit={sub.usage.users.limit}
              percentage={sub.usage.users.percentage}
              isLimitReached={sub.usage.users.is_limit_reached}
            />
            <QuotaGauge
              icon={Package}
              label="Produits"
              current={sub.usage.products.current}
              limit={sub.usage.products.limit}
              percentage={sub.usage.products.percentage}
              isLimitReached={sub.usage.products.is_limit_reached}
            />
            <QuotaGauge
              icon={ShoppingCart}
              label="Commandes / an"
              current={sub.usage.orders.current}
              limit={sub.usage.orders.limit}
              percentage={sub.usage.orders.percentage}
              isLimitReached={sub.usage.orders.is_limit_reached}
            />
          </div>
        </div>

        {/* Health Score */}
        {sub.health_score != null && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Santé de l&apos;abonnement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <HealthIndicator
                icon={Heart}
                label="Score global"
                value={sub.health_score}
                maxValue={100}
                status={sub.health_status || 'healthy'}
              />
              <HealthIndicator
                icon={Shield}
                label="Risque de churn"
                value={sub.churn_risk || 0}
                maxValue={100}
                status={
                  (sub.churn_risk || 0) > 60 ? 'critical' : (sub.churn_risk || 0) > 30 ? 'at_risk' : 'healthy'
                }
                inverted
              />
              <div className="flex flex-col items-center justify-center p-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                  sub.health_status === 'healthy'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : sub.health_status === 'at_risk'
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {sub.health_status === 'healthy' ? (
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  ) : sub.health_status === 'at_risk' ? (
                    <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {sub.health_status === 'healthy' ? 'Sain' : sub.health_status === 'at_risk' ? 'À risque' : 'Critique'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Statut global</p>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Info */}
        {(sub.stripe_subscription_id || sub.stripe_customer_id) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Intégration paiement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sub.stripe_subscription_id && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Abonnement</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{sub.stripe_subscription_id}</p>
                </div>
              )}
              {sub.stripe_customer_id && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Client</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{sub.stripe_customer_id}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
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
  sub?: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
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

function HealthIndicator({
  icon: Icon,
  label,
  value,
  maxValue,
  status,
  inverted = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  maxValue: number
  status: string
  inverted?: boolean
}) {
  const pct = Math.min((value / maxValue) * 100, 100)
  const isGood = inverted ? value < 30 : value >= 70
  const isWarning = inverted ? value >= 30 && value < 60 : value >= 40 && value < 70
  const color = isGood
    ? 'text-emerald-600 dark:text-emerald-400'
    : isWarning
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'
  const barColor = isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}<span className="text-lg text-gray-400">/{maxValue}</span></p>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
