/**
 * Page Prévisionnel CA par Client
 *
 * Fonctionnalités:
 * - Tableau clients avec CA historique vs prévu
 * - Détection tendance (hausse/baisse/stable)
 * - Score fiabilité basé sur régularité paiements
 * - Filtres: période (3/6/12 mois), top N clients
 * - Graphique évolution + projection
 */

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable } from '@/components/common'
import { TrendingUp, TrendingDown, Minus, Download, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'
import { formatCurrency } from '@/lib/utils'

type Forecast = {
  customerId: number
  customerName: string
  historicalRevenue: number
  avgMonthly: number
  forecastNextMonth: number
  forecastQuarter: number
  forecastYear: number
  trend: 'up' | 'down' | 'stable'
  trendLabel: string
  reliabilityScore: number
  invoiceCount: number
  paidCount: number
  unpaidCount: number
}

export default function RevenueForecastPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [periodMonths, setPeriodMonths] = useState(6)
  const [topN, setTopN] = useState(20)

  useEffect(() => {
    fetchForecasts()
  }, [periodMonths, topN])

  const fetchForecasts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<{
        success: boolean
        data: {
          forecasts: Forecast[]
          periodMonths: number
          totalCustomers: number
        }
      }>('/finance/analytics/revenue-forecast', {
        params: {
          period: periodMonths,
          top_n: topN,
        },
      })

      if (response.data.success) {
        setForecasts(response.data.data.forecasts)
      } else {
        setError('Erreur lors du chargement des prévisions')
      }
    } catch (err) {
      logger.error('Erreur chargement prévisions:', err)
      setError('Erreur lors du chargement des prévisions')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = [
      'Client',
      'CA Historique',
      'Moy. Mensuelle',
      'Prévu Mois Prochain',
      'Prévu Trimestre',
      'Prévu Année',
      'Tendance',
      'Fiabilité %',
      'Nb Factures',
    ]

    const rows = forecasts.map((f) => [
      f.customerName,
      f.historicalRevenue,
      f.avgMonthly,
      f.forecastNextMonth,
      f.forecastQuarter,
      f.forecastYear,
      f.trendLabel,
      f.reliabilityScore,
      f.invoiceCount,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `previsions_ca_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
    return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  }

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  if (error) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Analytics', href: '/finance/analytics' },
            { label: 'Prévisionnel CA' },
          ]}
        />
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Analytics', href: '/finance/analytics' },
            { label: 'Prévisionnel CA' },
          ]}
        />
        <SkeletonTable />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Analytics', href: '/finance/analytics' },
            { label: 'Prévisionnel CA' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Prévisionnel CA par Client
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Prédictions basées sur l&apos;historique des {periodMonths} derniers mois
            </p>
          </div>
          <Button variant="secondary" icon={<Download />} onClick={exportCSV}>
            Export CSV
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Période historique
            </label>
            <select
              value={periodMonths}
              onChange={(e) => setPeriodMonths(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={3}>3 mois</option>
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de clients
            </label>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Algorithme :</strong> Moyenne mobile simple sur la période sélectionnée.
              La tendance compare la première moitié avec la seconde moitié de la période.
              Le score de fiabilité est basé sur le taux de paiement des factures.
            </p>
          </div>
        </div>

        {/* Tableau */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CA Historique
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Moy. Mensuelle
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prévu Mois
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prévu Trimestre
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prévu Année
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tendance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fiabilité
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {forecasts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Aucune donnée disponible pour générer des prévisions
                    </td>
                  </tr>
                ) : (
                  forecasts.map((forecast) => (
                    <tr
                      key={forecast.customerId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {forecast.customerName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {forecast.invoiceCount} facture{forecast.invoiceCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(forecast.historicalRevenue)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">
                        {formatCurrency(forecast.avgMonthly)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">
                        {formatCurrency(forecast.forecastNextMonth)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">
                        {formatCurrency(forecast.forecastQuarter)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">
                        {formatCurrency(forecast.forecastYear)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(forecast.trend)}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {forecast.trendLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getReliabilityColor(
                            forecast.reliabilityScore
                          )}`}
                        >
                          {forecast.reliabilityScore.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
