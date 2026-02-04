/**
 * Prédictions ML des KPIs - Machine Learning Forecasting
 *
 * Fonctionnalités :
 * - Prédictions DSO (Days Sales Outstanding) via algorithme Prophet
 * - Prédictions EBITDA Margin avec intervalles de confiance 80% et 95%
 * - Prédictions BFR (Besoin en Fonds de Roulement) à horizon paramétrable
 * - Sélection d'horizon : 30, 60, 90 ou 180 jours
 * - Graphiques interactifs avec données historiques et prévisions
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { financeNotices } from '@/lib/notices/finance-notices'
import { Zap, Info, AlertCircle, RefreshCw } from 'lucide-react'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { ForecastChart } from '@/components/finance/charts/ForecastChart'
import { reportingClient, type KPIForecastResponse } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'

type HorizonDays = 30 | 60 | 90 | 180

export default function KPIForecastsPage() {
  useRequireAuth()
  const { formatAmount } = useCurrency()
  const [horizonDays, setHorizonDays] = useState<HorizonDays>(90)

  const {
    data: dsoForecast,
    loading: dsoLoading,
    error: dsoError,
    refetch: refetchDso,
  } = useApiData<KPIForecastResponse>({
    fetcher: () => reportingClient.dsoForecast({ horizonDays }),
    cacheKey: `dso-forecast-${horizonDays}`,
    cacheTime: 30 * 60 * 1000,
    deps: [horizonDays],
  })

  const {
    data: ebitdaForecast,
    loading: ebitdaLoading,
    error: ebitdaError,
    refetch: refetchEbitda,
  } = useApiData<KPIForecastResponse>({
    fetcher: () => reportingClient.ebitdaForecast({ horizonDays }),
    cacheKey: `ebitda-forecast-${horizonDays}`,
    cacheTime: 30 * 60 * 1000,
    deps: [horizonDays],
  })

  const {
    data: bfrForecast,
    loading: bfrLoading,
    error: bfrError,
    refetch: refetchBfr,
  } = useApiData<KPIForecastResponse>({
    fetcher: () => reportingClient.bfrForecast({ horizonDays }),
    cacheKey: `bfr-forecast-${horizonDays}`,
    cacheTime: 30 * 60 * 1000,
    deps: [horizonDays],
  })

  const hasError = dsoError || ebitdaError || bfrError
  const handleRefetchAll = async () => {
    await Promise.all([refetchDso(), refetchEbitda(), refetchBfr()])
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Prédictions ML' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 dark:bg-purple-900/20 p-3">
            <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prédictions ML des KPIs</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prévisions intelligentes utilisant Prophet (Machine Learning)
            </p>
          </div>
        </div>

        {/* Notice */}
        <PageNotice config={financeNotices.forecasts} />

        {/* Error Message */}
        {hasError && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des prédictions.
              </p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={handleRefetchAll}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">À propos des prédictions</p>
              <p className="text-gray-700 dark:text-gray-300">
                Ces prédictions utilisent <strong>Prophet</strong>, un algorithme de Machine Learning
                développé par Facebook.
              </p>
            </div>
          </div>
        </div>

        {/* Horizon Controls */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Horizon de prédiction:</span>
            <div className="flex gap-2">
              {([30, 60, 90, 180] as HorizonDays[]).map((days) => (
                <button
                  key={days}
                  onClick={() => setHorizonDays(days)}
                  disabled={dsoLoading || ebitdaLoading || bfrLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    horizonDays === days
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {days} jours
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DSO Forecast */}
        <ForecastChart
          historical={dsoForecast?.historical || []}
          forecast={
            dsoForecast?.forecast.map((f) => ({
              date: f.date,
              value: f.dso || 0,
              confidence80: f.confidence80,
              confidence95: f.confidence95,
            })) || []
          }
          title="Prédiction DSO (Délai d'Encaissement)"
          subtitle={`Prédiction sur ${horizonDays} jours basée sur ${dsoForecast?.model?.trainedOn || 0} mois d'historique`}
          valueLabel="DSO (jours)"
          formatValue={(v) => `${v.toFixed(1)} jours`}
          loading={dsoLoading}
          error={dsoError?.message || null}
        />

        {/* EBITDA Forecast */}
        <ForecastChart
          historical={ebitdaForecast?.historical || []}
          forecast={
            ebitdaForecast?.forecast.map((f) => ({
              date: f.date,
              value: f.ebitdaMargin || 0,
              confidence80: f.confidence80,
              confidence95: f.confidence95,
            })) || []
          }
          title="Prédiction EBITDA Margin"
          subtitle={`Prédiction sur ${horizonDays} jours basée sur ${ebitdaForecast?.model?.trainedOn || 0} mois d'historique`}
          valueLabel="Marge EBITDA"
          formatValue={(v) => `${v.toFixed(1)}%`}
          loading={ebitdaLoading}
          error={ebitdaError?.message || null}
        />

        {/* BFR Forecast */}
        <ForecastChart
          historical={bfrForecast?.historical || []}
          forecast={
            bfrForecast?.forecast.map((f) => ({
              date: f.date,
              value: f.bfr || 0,
              confidence80: f.confidence80,
              confidence95: f.confidence95,
            })) || []
          }
          title="Prédiction BFR (Besoin en Fonds de Roulement)"
          subtitle={`Prédiction sur ${horizonDays} jours basée sur ${bfrForecast?.model?.trainedOn || 0} mois d'historique`}
          valueLabel="BFR"
          formatValue={(v) => formatAmount(v)}
          loading={bfrLoading}
          error={bfrError?.message || null}
        />
      </div>
    </Layout>
  )
}
