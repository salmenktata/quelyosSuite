/**
 * Trésorerie - Analyse des flux de trésorerie et prévisions
 *
 * Fonctionnalités :
 * - Visualisation des flux de trésorerie (revenus vs dépenses)
 * - Évolution du solde bancaire avec graphique interactif
 * - Prévisions de trésorerie à 30 jours avec zone forecast
 * - Alertes automatiques sur tension de trésorerie
 * - Sélection de période d'analyse (7j, 30j, 60j, 90j)
 * - Détail quotidien des 10 derniers jours avec flux nets
 * - Indicateurs clés : revenus, dépenses, flux net, solde actuel
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, SkeletonTable } from '@/components/common'
import { financeNotices } from '@/lib/notices/finance-notices'
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { reportingClient, type CombinedResponse, type DailyPoint } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'

type TimeRange = '7' | '30' | '60' | '90'

type CashflowDataPoint = {
  date: string
  dateLabel: string
  income: number
  expense: number
  net: number
  balance: number
  isForecast: boolean
}

export default function CashflowReportPage() {
  useRequireAuth()
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency()
  const [timeRange, setTimeRange] = useState<TimeRange>('30')

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency)
  }

  // Fetch data from API with automatic caching
  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<CombinedResponse>({
    fetcher: () =>
      reportingClient.combined({
        days: parseInt(timeRange),
        horizonDays: 30, // 30 days forecast
      }),
    cacheKey: `reporting-cashflow-${timeRange}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [timeRange],
  })

  const error = apiError?.message || null

  // Transform API data to chart format
  const data: CashflowDataPoint[] =
    apiData?.daily.map((d: DailyPoint) => {
      const dateObj = new Date(d.date)
      return {
        date: d.date,
        dateLabel: dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        income: d.credit + (d.plannedCredit || 0),
        expense: d.debit + (d.plannedDebit || 0),
        net: d.credit - d.debit + ((d.plannedCredit || 0) - (d.plannedDebit || 0)),
        balance: d.projectedBalance || d.balance || 0,
        isForecast: !!d.projectedBalance && !d.balance,
      }
    }) || []

  const realData = data.filter((d) => !d.isForecast)
  const forecastData = data.filter((d) => d.isForecast)

  const totalIncome = realData.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = realData.reduce((sum, d) => sum + d.expense, 0)
  const netFlow = totalIncome - totalExpense
  const currentBalance = apiData?.currentBalance || 0
  const forecastedBalance = apiData?.landingBalance || currentBalance

  const maxIncome = Math.max(...data.map((d) => d.income), 0)
  const maxExpense = Math.max(...data.map((d) => d.expense), 0)
  const maxValue = Math.max(maxIncome, maxExpense, 1) * 1.1

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="![animation:none] p-4 md:p-8 space-y-6">
          <div className="![animation:none] h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="![animation:none] h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={4} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Trésorerie' },
          ]}
        />

        {/* Header */}
        <div className="![animation:none] flex items-center justify-between">
          <div className="![animation:none] flex items-center gap-3">
            <div className="![animation:none] rounded-lg bg-emerald-100 dark:bg-emerald-900/20 p-3">
              <DollarSign className="![animation:none] h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">Trésorerie</h1>
              <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">
                Analyse des flux, balance et prévisions sur 90 jours
              </p>
            </div>
          </div>

          <button
            onClick={refetch}
            disabled={loading}
            className="![animation:none] inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Notice */}
        <PageNotice config={financeNotices.cashflow} className="![animation:none]" />

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="![animation:none] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="![animation:none] flex items-center gap-3">
              <AlertTriangle className="![animation:none] h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="![animation:none] flex-1">
                <p className="![animation:none] font-semibold text-red-900 dark:text-red-100">{error}</p>
              </div>
              <button
                onClick={refetch}
                className="![animation:none] px-3 py-1 text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="![animation:none] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="![animation:none] flex items-center gap-4">
            <Calendar className="![animation:none] h-4 w-4 text-gray-600 dark:text-gray-400" />
            <div className="![animation:none] flex gap-2">
              {(['7', '30', '60', '90'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  disabled={loading}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    timeRange === range
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {range}j
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        {!loading && !error && apiData && (
          <>
            <div className="![animation:none] grid gap-4 md:grid-cols-4">
              <div className="![animation:none] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="![animation:none] flex items-center justify-between">
                  <div>
                    <p className="![animation:none] mb-1 text-sm text-gray-600 dark:text-gray-400">Revenus</p>
                    <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(totalIncome)}
                    </p>
                  </div>
                  <ArrowUpCircle className="![animation:none] h-8 w-8 text-emerald-500" />
                </div>
              </div>

              <div className="![animation:none] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="![animation:none] flex items-center justify-between">
                  <div>
                    <p className="![animation:none] mb-1 text-sm text-gray-600 dark:text-gray-400">Dépenses</p>
                    <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(totalExpense)}
                    </p>
                  </div>
                  <ArrowDownCircle className="![animation:none] h-8 w-8 text-rose-500" />
                </div>
              </div>

              <div className="![animation:none] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="![animation:none] flex items-center justify-between">
                  <div>
                    <p className="![animation:none] mb-1 text-sm text-gray-600 dark:text-gray-400">Flux net</p>
                    <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(netFlow)}
                    </p>
                  </div>
                  <TrendingUp className="![animation:none] h-8 w-8 text-cyan-500" />
                </div>
              </div>

              <div className="![animation:none] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="![animation:none] flex items-center justify-between">
                  <div>
                    <p className="![animation:none] mb-1 text-sm text-gray-600 dark:text-gray-400">Solde actuel</p>
                    <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAmount(currentBalance)}
                    </p>
                  </div>
                  <DollarSign className="![animation:none] h-8 w-8 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Waterfall Chart */}
            <div className="![animation:none] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Évolution de la trésorerie (réel + prévisions 30j)
              </h2>
              <div className="![animation:none] h-96">
                <svg viewBox="0 0 1000 400" className="![animation:none] h-full w-full">
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = (i / 4) * 350 + 25
                    return (
                      <line
                        key={i}
                        x1="50"
                        y1={y}
                        x2="950"
                        y2={y}
                        stroke="currentColor"
                        className="![animation:none] text-gray-300 dark:text-gray-600"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    )
                  })}

                  {/* Balance line */}
                  <path
                    d={
                      data.length > 1
                        ? `M ${data
                            .map((d, i) => {
                              const x = 50 + (i / (data.length - 1)) * 900
                              const minBalance = Math.min(...data.map((x) => x.balance))
                              const maxBalance = Math.max(...data.map((x) => x.balance))
                              const balanceRange = maxBalance - minBalance
                              const normalizedBalance =
                                balanceRange > 0 ? (d.balance - minBalance) / balanceRange : 0.5
                              const y = 375 - normalizedBalance * 350
                              return `${i === 0 ? '' : 'L '}${x} ${y}`
                            })
                            .join(' ')}`
                        : 'M 50 200'
                    }
                    fill="none"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Forecast zone */}
                  {data.length > 1 && forecastData.length > 0 && (
                    <rect
                      x={50 + ((realData.length - 1) / (data.length - 1)) * 900}
                      y={25}
                      width={(forecastData.length / data.length) * 900}
                      height={350}
                      fill="rgb(139, 92, 246)"
                      opacity="0.1"
                    />
                  )}

                  {/* Income/Expense bars */}
                  {data.length > 0 &&
                    data
                      .filter((_, i) => i % Math.ceil(data.length / 30) === 0)
                      .map((d, i, arr) => {
                        const originalIndex = data.indexOf(d)
                        const x = data.length > 1 ? 50 + (originalIndex / (data.length - 1)) * 900 : 500
                        const barWidth = arr.length > 0 ? 900 / arr.length / 3 : 20

                        const incomeHeight = Math.max(0, (d.income / maxValue) * 100)
                        const expenseHeight = Math.max(0, (d.expense / maxValue) * 100)

                        return (
                          <g key={i}>
                            {/* Income bar */}
                            <rect
                              x={x - barWidth / 2}
                              y={375 - incomeHeight}
                              width={barWidth / 2 - 1}
                              height={incomeHeight}
                              fill={d.isForecast ? 'rgb(52, 211, 153)' : 'rgb(16, 185, 129)'}
                              opacity={d.isForecast ? 0.6 : 0.8}
                            />
                            {/* Expense bar */}
                            <rect
                              x={x}
                              y={375 - expenseHeight}
                              width={barWidth / 2 - 1}
                              height={expenseHeight}
                              fill={d.isForecast ? 'rgb(251, 146, 60)' : 'rgb(244, 63, 94)'}
                              opacity={d.isForecast ? 0.6 : 0.8}
                            />
                          </g>
                        )
                      })}

                  {/* Axis labels */}
                  {data.length > 0 && (
                    <>
                      <text x="10" y="30" className="![animation:none] fill-gray-600 dark:fill-gray-400" fontSize="12">
                        {formatAmount(Math.max(...data.map((d) => d.balance), 0))}
                      </text>
                      <text x="10" y="380" className="![animation:none] fill-gray-600 dark:fill-gray-400" fontSize="12">
                        {formatAmount(Math.min(...data.map((d) => d.balance), 0))}
                      </text>
                    </>
                  )}

                  {/* Legend */}
                  <g transform="translate(750, 15)">
                    <rect x="0" y="0" width="15" height="15" fill="rgb(99, 102, 241)" />
                    <text x="20" y="12" className="![animation:none] fill-gray-900 dark:fill-white" fontSize="12">
                      Solde
                    </text>

                    <rect x="0" y="20" width="15" height="15" fill="rgb(16, 185, 129)" />
                    <text x="20" y="32" className="![animation:none] fill-gray-900 dark:fill-white" fontSize="12">
                      Revenus
                    </text>

                    <rect x="0" y="40" width="15" height="15" fill="rgb(244, 63, 94)" />
                    <text x="20" y="52" className="![animation:none] fill-gray-900 dark:fill-white" fontSize="12">
                      Dépenses
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Forecast Alert */}
            {forecastedBalance < currentBalance * 0.7 && (
              <div className="![animation:none] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="![animation:none] flex items-center gap-3">
                  <AlertTriangle className="![animation:none] h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="![animation:none] font-semibold text-gray-900 dark:text-white">
                      Alerte prévision trésorerie
                    </p>
                    <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">
                      Votre solde prévisionnel à 30j ({formatAmount(forecastedBalance)}) est inférieur de{' '}
                      {((1 - forecastedBalance / currentBalance) * 100).toFixed(0)}% à votre solde actuel.
                      Anticipez vos flux entrants.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Daily breakdown */}
            <div className="![animation:none] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Détail par jour (derniers 10 jours)
              </h2>
              <div className="![animation:none] space-y-3">
                {realData
                  .slice(-10)
                  .reverse()
                  .map((d, i) => (
                    <div
                      key={i}
                      className="![animation:none] flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4"
                    >
                      <div>
                        <p className="![animation:none] font-medium text-gray-900 dark:text-white">{d.dateLabel}</p>
                        <p className="![animation:none] text-xs text-gray-600 dark:text-gray-400">
                          Solde: {formatAmount(d.balance)}
                        </p>
                      </div>
                      <div className="![animation:none] flex gap-6 text-sm">
                        <div className="![animation:none] text-right">
                          <p className="![animation:none] text-emerald-600 dark:text-emerald-400">+{formatAmount(d.income)}</p>
                          <p className="![animation:none] text-xs text-gray-600 dark:text-gray-400">Revenus</p>
                        </div>
                        <div className="![animation:none] text-right">
                          <p className="![animation:none] text-rose-600 dark:text-rose-400">-{formatAmount(d.expense)}</p>
                          <p className="![animation:none] text-xs text-gray-600 dark:text-gray-400">Dépenses</p>
                        </div>
                        <div className="![animation:none] text-right">
                          <p
                            className={`font-semibold ${
                              d.net >= 0
                                ? 'text-cyan-600 dark:text-cyan-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {d.net >= 0 ? '+' : ''}
                            {formatAmount(d.net)}
                          </p>
                          <p className="![animation:none] text-xs text-gray-600 dark:text-gray-400">Net</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
