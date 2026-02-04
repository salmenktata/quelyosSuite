/**
 * Widget Clients à Risque
 *
 * Affiche liste clients avec score risque élevé (>60) :
 * - Badge scoring coloré
 * - Créances en retard
 * - Délai paiement moyen
 * - Actions rapides (voir détails, relancer)
 *
 * Intégration : Dashboard CFO, Page Clients
 */

import { useCustomerRiskScores } from '@/hooks/useCustomerRisk'
import { RiskScoreBadgeWithTooltip } from './RiskScoreBadge'
import { AlertTriangle, ExternalLink, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

interface RiskCustomersWidgetProps {
  minScore?: number
  limit?: number
  className?: string
}

export function RiskCustomersWidget({
  minScore = 60,
  limit = 10,
  className = '',
}: RiskCustomersWidgetProps) {
  const { data, isLoading, error } = useCustomerRiskScores({
    minScore,
    limit,
  })

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              Erreur chargement scores
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.scores.length === 0) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Clients à Risque
        </h3>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aucun client à risque élevé
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Tous vos clients ont un score risque {"<"} {minScore}
          </p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value)

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Clients à Risque Élevé
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.count} client{data.count > 1 ? 's' : ''} avec score ≥ {minScore}
            </p>
          </div>
          <Link
            to="/crm/customers?risk=high"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>Voir tout</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.scores.map((customer) => (
          <div
            key={customer.id}
            className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <RiskScoreBadgeWithTooltip
                  score={customer.score}
                  category={customer.category}
                  size="sm"
                  avgPaymentDelay={customer.avg_payment_delay}
                  latePaymentRate={customer.late_payment_rate}
                  totalOverdue={customer.total_overdue}
                  confidence={customer.confidence}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/crm/customers/${customer.partner_id}`}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                  >
                    {customer.partner_name}
                  </Link>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Délai : {customer.avg_payment_delay.toFixed(0)}j
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Retard : {customer.late_payment_rate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 ml-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(customer.total_overdue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Impayé</p>
                </div>
                <button
                  className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Envoyer relance"
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.count > limit && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-center">
          <Link
            to="/crm/customers?risk=high"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Voir les {data.count - limit} autres clients à risque
          </Link>
        </div>
      )}
    </div>
  )
}
