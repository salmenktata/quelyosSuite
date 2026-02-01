/**
 * BFR - Besoin en Fonds de Roulement
 *
 * Fonctionnalités :
 * - Calcul du BFR (Créances + Stock - Dettes fournisseurs)
 * - Analyse du cycle d'exploitation (DSO, rotation stock, DPO)
 * - Évolution historique du BFR et ratio BFR/CA
 * - Indicateurs de santé et recommandations d'optimisation
 * - Export des données en CSV
 * - Badge de fiabilité des données
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, SkeletonTable } from '@/components/common'
import { financeNotices } from '@/lib/notices/finance-notices'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Building2,
  Package,
  RefreshCw,
} from 'lucide-react'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { ExportDropdown } from '@/components/finance/reporting/ExportDropdown'
import { ReliabilityBadge } from '@/components/kpis/ReliabilityBadge'
import { reportingClient, type BFRResponse, type BFRHistoryPoint } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { formatDateForExport } from '@/lib/utils/export'
import { TrendChart } from '@/components/finance/charts/TrendChart'

type TimeRange = '7' | '30' | '60' | '90'

export default function BFRReportPage() {
  useRequireAuth()
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency()
  const [timeRange, setTimeRange] = useState<TimeRange>('30')
  const [historyMonths, setHistoryMonths] = useState<number>(6)

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency)
  }

  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<BFRResponse>({
    fetcher: () =>
      reportingClient.bfr({
        days: parseInt(timeRange),
      }),
    cacheKey: `reporting-bfr-${timeRange}`,
    cacheTime: 5 * 60 * 1000,
    deps: [timeRange],
  })

  const error = apiError?.message || null

  const { data: historyData, loading: historyLoading } = useApiData<{
    months: number
    data: BFRHistoryPoint[]
  }>({
    fetcher: () => reportingClient.bfrHistory({ months: historyMonths }),
    cacheKey: `bfr-history-${historyMonths}`,
    cacheTime: 5 * 60 * 1000,
    deps: [historyMonths],
  })

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={4} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'BFR' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/20 p-3">
              <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                BFR - Besoin en Fonds de Roulement
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Working Capital Requirement - Analyse du cycle d&apos;exploitation
              </p>
            </div>
          </div>

          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Notice */}
        <PageNotice config={financeNotices.bfr} />

        {/* Reliability Badge */}
        {apiData?.reliability && (
          <ReliabilityBadge reliability={apiData.reliability} showDetails={true} reportId="bfr" />
        )}

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-100">{error}</p>
              </div>
              <button
                onClick={refetch}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {(['7', '30', '60', '90'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  disabled={loading}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    timeRange === range
                      ? 'bg-amber-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {range}j
                </button>
              ))}
            </div>
            {!loading && apiData && (
              <ExportDropdown
                filename="bfr-report"
                reportTitle="Rapport BFR - Besoin en Fonds de Roulement"
                onExport={() => {
                  const rows = [
                    ['Rapport BFR - Besoin en Fonds de Roulement'],
                    [
                      'Période',
                      `${formatDateForExport(apiData.range.from)} - ${formatDateForExport(apiData.range.to)}`,
                    ],
                    [],
                    ['BFR'],
                    ['BFR Total', formatAmount(apiData.bfr)],
                    ['BFR en Jours', `${apiData.bfrDays} jours`],
                    ['Ratio BFR/CA', `${apiData.ratio.toFixed(1)}%`],
                    ['Trend', apiData.trend],
                    [],
                    ['Composants'],
                    ['Créances Clients', formatAmount(apiData.components.receivables)],
                    ['Stock', formatAmount(apiData.components.inventory)],
                    ['Dettes Fournisseurs', formatAmount(apiData.components.payables)],
                    [],
                    ['Recommandation'],
                    [apiData.recommendation],
                  ]
                  return rows
                }}
              />
            )}
          </div>
        </div>

        {/* KPIs */}
        {!loading && !error && apiData && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">BFR Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(apiData.bfr)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {apiData.bfrDays} jours de CA
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-amber-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Créances clients</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(apiData.components.receivables)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">À encaisser</p>
                  </div>
                  <Users className="h-8 w-8 text-emerald-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Dettes fournisseurs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(apiData.components.payables)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">À payer</p>
                  </div>
                  <Building2 className="h-8 w-8 text-rose-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Stock</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(apiData.components.inventory)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {apiData.components.inventory === 0 ? 'Non tracé' : 'Valeur'}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Historical Trend */}
            {!loading && !error && historyData && (
              <TrendChart
                title="Évolution du BFR"
                subtitle="Besoin en fonds de roulement sur plusieurs mois"
                data={historyData.data}
                lines={[
                  {
                    dataKey: 'bfr',
                    name: 'BFR',
                    color: '#8b5cf6',
                    format: (value) => formatAmount(value),
                  },
                  {
                    dataKey: 'ratio',
                    name: 'BFR/CA (%)',
                    color: '#f59e0b',
                    format: (value) => `${value.toFixed(1)}%`,
                  },
                ]}
                height={250}
                defaultMonths={historyMonths as 3 | 6 | 12}
                onMonthsChange={(months) => setHistoryMonths(months)}
              />
            )}

            {/* Health Indicator */}
            <div
              className={`p-6 rounded-lg border ${
                apiData.bfrDays < 30
                  ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                  : apiData.bfrDays < 60
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {apiData.bfrDays < 30 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : apiData.bfrDays < 60 ? (
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                    {apiData.bfrDays < 30
                      ? '✅ BFR Sain'
                      : apiData.bfrDays < 60
                        ? '⚠️ BFR Modéré'
                        : '❌ BFR Élevé'}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{apiData.recommendation}</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Trend:{' '}
                    {apiData.trend === 'decreasing'
                      ? '↓ En réduction'
                      : apiData.trend === 'increasing'
                        ? '↑ En hausse'
                        : '→ Stable'}
                  </p>
                </div>
              </div>
            </div>

            {/* BFR Formula Breakdown */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Calcul du BFR</h2>
              <div className="space-y-4">
                {/* Receivables */}
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-900/10 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Créances clients</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatAmount(apiData.components.receivables)}
                  </span>
                </div>

                {/* Inventory */}
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 dark:bg-indigo-900/10 p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Stock</span>
                  </div>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    +{formatAmount(apiData.components.inventory)}
                  </span>
                </div>

                {/* Payables */}
                <div className="flex items-center justify-between rounded-lg bg-rose-50 dark:bg-rose-900/10 p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Dettes fournisseurs</span>
                  </div>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    -{formatAmount(apiData.components.payables)}
                  </span>
                </div>

                {/* BFR Result */}
                <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 border-2 border-amber-500 dark:border-amber-600">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      BFR = Créances + Stock - Dettes
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatAmount(apiData.bfr)}
                  </span>
                </div>
              </div>
            </div>

            {/* BFR Metrics */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Métriques BFR</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">BFR en jours de CA</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{apiData.bfrDays}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Nombre de jours de chiffre d&apos;affaires immobilisés
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                      style={{ width: `${Math.min((apiData.bfrDays / 90) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Ratio BFR / CA</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {apiData.ratio.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Pourcentage du CA immobilisé dans le cycle d&apos;exploitation
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                      style={{ width: `${Math.min(apiData.ratio, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cycle Analysis */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Cycle d&apos;exploitation
              </h2>
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 dark:text-white font-medium">1. Achats fournisseurs</span>
                    <span className="text-gray-600 dark:text-gray-400">Délai de paiement DPO</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Temps entre la réception de la facture et le paiement fournisseur
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 dark:text-white font-medium">2. Stock (si applicable)</span>
                    <span className="text-gray-600 dark:text-gray-400">Rotation des stocks</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Temps de détention du stock avant vente
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 dark:text-white font-medium">3. Ventes clients</span>
                    <span className="text-gray-600 dark:text-gray-400">Délai d&apos;encaissement DSO</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Temps entre l&apos;émission de la facture et l&apos;encaissement client
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>BFR = DSO + Rotation stock - DPO</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Plus le cycle est court, moins vous avez besoin de financement pour le faire tourner.
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                💡 Comment optimiser le BFR
              </h2>
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>1. Réduire le DSO</strong> - Relances clients, pénalités de retard, acomptes,
                    facturation immédiate.
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>2. Négocier le DPO</strong> - Allonger les délais de paiement fournisseurs (sans
                    dégrader la relation).
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>3. Optimiser le stock</strong> - Flux tendu, rotation rapide, commandes
                    just-in-time.
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>4. Affacturage</strong> - Céder les créances clients à un factor pour encaisser
                    immédiatement.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
