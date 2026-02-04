/**
 * Widget Cash Flow Forecasting ML + DSO
 *
 * Affiche prédictions trésorerie 30/60/90 jours avec :
 * - Timeline graphique encaissements vs décaissements
 * - Breakdown hebdomadaire détaillé
 * - Alertes semaines à risque (balance négative)
 * - DSO (Days Sales Outstanding) avec benchmark industrie
 *
 * Technologie : ML Régression Linéaire + Random Forest
 * Précision cible : 85%+ (RMSE < 5%)
 */

import { useState } from 'react'
import { useCashFlowForecast, useDSO } from '@/hooks/useCashFlow'
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type HorizonDays = 30 | 60 | 90

export function CashFlowWidget() {
  const [horizon, setHorizon] = useState<HorizonDays>(30)

  const { data: forecast, isLoading, error } = useCashFlowForecast({ horizonDays: horizon })
  const { data: dso, isLoading: dsoLoading } = useDSO()

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4"
        role="alert"
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              Erreur chargement prévisions
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
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  if (!forecast) return null

  // Formater données pour Recharts
  const chartData = forecast.weeks.map((week) => ({
    date: new Date(week.week_start).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    }),
    encaissements: Math.round(week.predicted_inflow),
    decaissements: Math.round(week.predicted_outflow),
    solde: Math.round(week.predicted_balance),
  }))

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value)

  const atRiskWeeks = forecast.weeks.filter((w) => w.is_at_risk)

  return (
    <div className="space-y-6">
      {/* Header avec sélection horizon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Prévision Trésorerie
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Prédictions ML basées sur historique et tendances
          </p>
        </div>

        <div className="flex space-x-2">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setHorizon(days as HorizonDays)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                horizon === days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {days} jours
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Encaissements prévus</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(forecast.predicted_inflow)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Confiance : {Math.round(forecast.confidence_score)}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Décaissements prévus</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(forecast.predicted_outflow)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Solde prévu</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  forecast.predicted_balance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(forecast.predicted_balance)}
              </p>
            </div>
            {forecast.predicted_balance < 0 && (
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            )}
          </div>
        </div>
      </div>

      {/* Alertes semaines à risque */}
      {atRiskWeeks.length > 0 && (
        <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                {atRiskWeeks.length} semaine{atRiskWeeks.length > 1 ? 's' : ''} à risque
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Solde négatif prévu. Anticipez vos besoins de trésorerie.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Graphique Timeline */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Évolution hebdomadaire
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
            <Line
              type="monotone"
              dataKey="encaissements"
              stroke="#10B981"
              strokeWidth={2}
              name="Encaissements"
            />
            <Line
              type="monotone"
              dataKey="decaissements"
              stroke="#EF4444"
              strokeWidth={2}
              name="Décaissements"
            />
            <Line
              type="monotone"
              dataKey="solde"
              stroke="#6366F1"
              strokeWidth={2}
              name="Solde"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* DSO Metric */}
      {!dsoLoading && dso && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                DSO (Days Sales Outstanding)
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {dso.dso.toFixed(1)} jours
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Créances : {formatCurrency(dso.receivables)} / CA :{' '}
                {formatCurrency(dso.revenue)}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  dso.benchmark.status === 'good'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : dso.benchmark.status === 'warning'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}
              >
                {dso.benchmark.status === 'good'
                  ? '✓ Bon'
                  : dso.benchmark.status === 'warning'
                    ? '⚠ Attention'
                    : '✗ Critique'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Moyenne secteur : {dso.benchmark.industry_avg.toFixed(0)}j
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tableau détaillé semaines */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Détail hebdomadaire
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Semaine
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Encaissements
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Décaissements
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Solde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {forecast.weeks.map((week, index) => (
                <tr key={index} className={week.is_at_risk ? 'bg-orange-50 dark:bg-orange-900/10' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(week.week_start).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(week.predicted_inflow)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(week.predicted_outflow)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                      week.predicted_balance >= 0
                        ? 'text-gray-900 dark:text-white'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(week.predicted_balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {week.is_at_risk ? (
                      <span className="inline-flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Risque</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-500">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
