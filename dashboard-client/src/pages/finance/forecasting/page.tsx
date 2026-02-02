/**
 * Page ML Cash Flow Forecasting (Prophet)
 */

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { apiClient } from '@/lib/api'
import { TrendingUp, Brain } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { logger } from '@quelyos/logger';

interface ForecastPrediction {
  date: string
  predicted: number
  lowerBound: number
  upperBound: number
}

interface ForecastPeriodSummary {
  avgCashFlow: number
}

interface ForecastSummary {
  trend: string
  avgPredicted: number
  confidence: number
  days30: ForecastPeriodSummary
  days60: ForecastPeriodSummary
  days90: ForecastPeriodSummary
}

export default function ForecastingPage() {
  const [predictions, setPredictions] = useState<ForecastPrediction[]>([])
  const [summary, setSummary] = useState<ForecastSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPredictions()
  }, [])

  const loadPredictions = async () => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          predictions: ForecastPrediction[];
          summary: ForecastSummary;
        };
      }>('/finance/forecasting/predict', { days_ahead: 90 })
      if (response.data.success && response.data.data) {
        setPredictions(response.data.data.predictions)
        setSummary(response.data.data.summary)
      }
    } catch (error) {
      logger.error("Erreur:", error);
      // Error handled
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Prédictions ML', path: '/finance/forecasting' },
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Prédictions Trésorerie ML
        </h1>
        <Button variant="primary">
          <Brain className="w-4 h-4 mr-2" />
          Ré-entraîner
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">30 Jours</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.days30.avgCashFlow, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">60 Jours</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.days60.avgCashFlow, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">90 Jours</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.days90.avgCashFlow, '€')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prévu</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Min</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {predictions.slice(0, 30).map((pred, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{pred.date}</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                  {formatCurrency(pred.predicted, '€')}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(pred.lowerBound, '€')}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(pred.upperBound, '€')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
