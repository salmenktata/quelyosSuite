/**
 * Prédiction Risques Paiement ML - Scoring prédictif retards
 *
 * Fonctionnalités:
 * - Algorithme ML scoring risque retard par client
 * - Analyse historique comportemental (taux retards, délais moyens)
 * - Classification 5 niveaux : minimal, low, medium, high, critical
 * - TOP clients à risque avec recommandations actions
 * - Features : late payment rate, avg delay, overdue amount
 * - Batch prediction pour portefeuille complet
 * - Confiance basée sur volume données historiques
 */
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable } from '@/components/common'
import { AlertTriangle, TrendingUp, Shield, RefreshCw, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { logger } from '@quelyos/logger'

type RiskPrediction = {
  customerId: number
  customerName: string
  riskScore: number
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical'
  latePaymentRate: number
  overdueAmount: number
  avgDelayDays: number
}

export default function PaymentRiskPage() {
  const [predictions, setPredictions] = useState<RiskPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterLevel, setFilterLevel] = useState<string>('medium')
  const [topN, setTopN] = useState<number>(20)

  useEffect(() => {
    fetchPredictions()
  }, [filterLevel, topN])

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post<{
        success: boolean
        data: {
          predictions: RiskPrediction[]
          totalAnalyzed: number
          highRiskCount: number
        }
        error?: string
      }>('/finance/payment-risk/batch-predict', {
        topN,
        minRiskLevel: filterLevel,
      })

      if (response.data.success && response.data.data) {
        setPredictions(response.data.data.predictions)
      } else {
        setError(response.data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      logger.error('Erreur fetch predictions:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (level: string, score: number) => {
    const configs = {
      critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', label: 'Critique', icon: AlertTriangle },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', label: 'Élevé', icon: AlertTriangle },
      medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800', label: 'Moyen', icon: TrendingUp },
      low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'Faible', icon: Shield },
      minimal: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800', label: 'Minimal', icon: Shield },
    }

    const config = configs[level as keyof typeof configs] || configs.medium
    const Icon = config.icon

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {score}/100
        </span>
      </div>
    )
  }

  const getProgressBar = (score: number) => {
    let colorClass = 'bg-green-500'
    if (score >= 70) colorClass = 'bg-red-500'
    else if (score >= 50) colorClass = 'bg-orange-500'
    else if (score >= 30) colorClass = 'bg-yellow-500'

    return (
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <SkeletonTable rows={10} columns={5} />
        </div>
      </Layout>
    )
  }

  const highRiskCount = predictions.filter(p => ['high', 'critical'].includes(p.riskLevel)).length
  const avgScore = predictions.length > 0 ? predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length : 0

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Risques Paiement ML' },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Prédiction Risques Paiement (ML)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Scoring prédictif retards basé sur historique comportemental client
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<RefreshCw />}
            onClick={fetchPredictions}
          >
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Clients à Risque Élevé</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {highRiskCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Score Moyen Portefeuille</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgScore.toFixed(1)}/100
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Clients Analysés</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {predictions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Niveau Minimum
            </label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="minimal">Tous (Minimal+)</option>
              <option value="low">Faible+</option>
              <option value="medium">Moyen+</option>
              <option value="high">Élevé+</option>
              <option value="critical">Critique</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              TOP N
            </label>
            <select
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!error && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Rang
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Score Risque
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Niveau
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Taux Retards
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Délai Moyen
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Impayés
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {predictions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        Aucune prédiction disponible
                      </td>
                    </tr>
                  ) : (
                    predictions.map((pred, index) => (
                      <tr
                        key={pred.customerId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                        onClick={() => window.location.href = `/crm/customers/${pred.customerId}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {pred.customerName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {getProgressBar(pred.riskScore)}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {pred.riskScore.toFixed(0)}/100
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getRiskBadge(pred.riskLevel, pred.riskScore)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-medium ${
                            pred.latePaymentRate >= 50
                              ? 'text-red-600 dark:text-red-400'
                              : pred.latePaymentRate >= 30
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {pred.latePaymentRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {pred.avgDelayDays.toFixed(0)}j
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(pred.overdueAmount, '€')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info ML */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Algorithme ML Scoring
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <li>• <strong>Features</strong> : Taux retards (35%), Délai moyen (25%), Impayés (20%), Montant impayé (15%), Ancienneté (5%)</li>
            <li>• <strong>Classification</strong> : Minimal (0-14), Faible (15-29), Moyen (30-49), Élevé (50-69), Critique (70-100)</li>
            <li>• <strong>Confiance</strong> : High (10+ factures), Medium (5-9), Low (&lt;5) - Nouveaux clients plus risqués</li>
            <li>• <strong>Historique</strong> : Analyse 12 derniers mois de comportement paiement</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
