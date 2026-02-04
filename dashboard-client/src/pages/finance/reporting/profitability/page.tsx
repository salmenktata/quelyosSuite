/**
 * Rentabilité - Marges, Ratios et Coûts par Catégorie
 *
 * Fonctionnalités :
 * - Calcul et suivi marges brutes, opérationnelles et nettes
 * - Identification catégories revenus avec meilleures marges
 * - Analyse coûts par catégorie pour repérer dérapages
 * - Comparaison ratios de rentabilité aux benchmarks sectoriels
 * - Priorisation actions sur leviers à fort impact (prix, mix, productivité)
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import {
  Target,
  TrendingUp,
  DollarSign,
  Percent,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { GlassPanel, GlassCard } from '@/components/ui/glass'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { reportingClient, type ProfitabilityResponse } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { financeNotices } from '@/lib/notices/finance-notices'

type TimeRange = "7" | "30" | "60" | "90";

export default function ProfitabilityReportPage() {
  useRequireAuth();
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency();
  const [timeRange, setTimeRange] = useState<TimeRange>("30");

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency);
  };

  // Fetch data from API with automatic caching
  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<ProfitabilityResponse>({
    fetcher: () => reportingClient.profitability({
      days: parseInt(timeRange),
    }),
    cacheKey: `reporting-profitability-${timeRange}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  const benchmarks = {
    grossMargin: 55,
    operatingMargin: 20,
    netMargin: 15,
  };

  return (
    <LazyMotion features={domAnimation}>
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Rentabilité' },
          ]}
        />

        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="![animation:none] flex items-center gap-3">
            <div className="![animation:none] rounded-full bg-gradient-to-br from-rose-500 to-pink-600 p-3 shadow-lg shadow-rose-500/30 dark:shadow-rose-500/20">
              <Target className="![animation:none] h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="![animation:none] text-3xl font-bold text-gray-900 dark:text-white">
                Analyse de rentabilité
              </h1>
              <p className="![animation:none] text-sm text-gray-500 dark:text-gray-400">
                Marges brutes et nettes, ratios clés et structure des coûts
              </p>
            </div>
          </div>
        </m.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.profitability} className="![animation:none] mb-6" />

        {/* Controls */}
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="![animation:none] mb-6"
        >
          <GlassPanel className="![animation:none] p-4">
            <div className="![animation:none] flex items-center gap-4">
              <div className="![animation:none] flex gap-2">
                {(["7", "30", "60", "90"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={loading}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      timeRange === range
                        ? "bg-rose-500 text-gray-900 dark:text-white"
                        : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {range}j
                  </button>
                ))}
              </div>
            </div>
          </GlassPanel>
        </m.div>

        {/* Loading State */}
        {loading && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="![animation:none] mb-6"
          >
            <GlassCard className="![animation:none] p-8">
              <div className="![animation:none] flex items-center justify-center gap-3 text-indigo-300">
                <Loader2 className="![animation:none] h-5 w-5 animate-spin" />
                <span>Chargement des données...</span>
              </div>
            </GlassCard>
          </m.div>
        )}

        {/* Error State */}
        {error && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="![animation:none] mb-6"
            role="alert"
          >
            <GlassCard className="![animation:none] border-red-400/40 bg-red-500/10 p-4">
              <div className="![animation:none] flex items-center gap-3">
                <AlertCircle className="![animation:none] h-5 w-5 text-red-400" aria-hidden="true" />
                <div className="![animation:none] flex-1">
                  <p className="![animation:none] font-semibold text-red-100">{error}</p>
                </div>
                <button
                  onClick={refetch}
                  className="![animation:none] rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-100 hover:bg-red-500/30 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </GlassCard>
          </m.div>
        )}

        {/* KPIs */}
        {!loading && !error && apiData && (
        <>
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="![animation:none] mb-6 grid gap-4 md:grid-cols-3"
        >
          <GlassCard className="![animation:none] p-4" gradient="emerald">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-emerald-200">Marge brute</p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.grossMargin.toFixed(1)}%
                </p>
                <p className="![animation:none] text-xs text-emerald-300 mt-1">
                  {formatAmount(apiData.grossProfit)}
                </p>
              </div>
              <Percent className="![animation:none] h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="![animation:none] p-4" gradient="indigo">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-indigo-200">
                  Marge opérationnelle
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.operatingMargin.toFixed(1)}%
                </p>
                <p className="![animation:none] text-xs text-indigo-300 mt-1">
                  {formatAmount(apiData.operatingProfit)}
                </p>
              </div>
              <TrendingUp className="![animation:none] h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>

          <GlassCard className="![animation:none] p-4" gradient="rose">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-rose-200">Marge nette</p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.netMargin.toFixed(1)}%
                </p>
                <p className="![animation:none] text-xs text-rose-300 mt-1">
                  {formatAmount(apiData.netProfit)}
                </p>
              </div>
              <Target className="![animation:none] h-8 w-8 text-rose-300" />
            </div>
          </GlassCard>
        </m.div>

        {/* Waterfall P&L */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="![animation:none] mb-6"
        >
          <GlassPanel className="![animation:none] p-6">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Compte de résultat (waterfall)
            </h2>
            <div className="![animation:none] space-y-4">
              {/* Revenue */}
              <div className="![animation:none] flex items-center justify-between rounded-lg bg-emerald-500/10 p-4">
                <div className="![animation:none] flex items-center gap-3">
                  <DollarSign className="![animation:none] h-5 w-5 text-emerald-400" />
                  <span className="![animation:none] font-medium text-gray-900 dark:text-white">
                    Chiffre d&apos;affaires
                  </span>
                </div>
                <span className="![animation:none] text-xl font-bold text-emerald-400">
                  {formatAmount(apiData.revenue)}
                </span>
              </div>

              {/* COGS */}
              <div className="![animation:none] ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                <span className="![animation:none] text-gray-900 dark:text-white">Coût des ventes</span>
                <span className="![animation:none] font-semibold text-rose-400">
                  -{formatAmount(apiData.cogs)}
                </span>
              </div>

              {/* Gross Profit */}
              <div className="![animation:none] flex items-center justify-between rounded-lg bg-cyan-500/10 p-4">
                <div>
                  <span className="![animation:none] font-medium text-gray-900 dark:text-white">Marge brute</span>
                  <p className="![animation:none] text-xs text-cyan-400">
                    {apiData.grossMargin.toFixed(1)}% du CA
                  </p>
                </div>
                <span className="![animation:none] text-xl font-bold text-cyan-400">
                  {formatAmount(apiData.grossProfit)}
                </span>
              </div>

              {/* Operating Expenses */}
              <div className="![animation:none] ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                <span className="![animation:none] text-gray-900 dark:text-white">Charges opérationnelles</span>
                <span className="![animation:none] font-semibold text-rose-400">
                  -{formatAmount(apiData.operatingExpenses)}
                </span>
              </div>

              {/* Operating Profit */}
              <div className="![animation:none] flex items-center justify-between rounded-lg bg-indigo-500/10 p-4">
                <div>
                  <span className="![animation:none] font-medium text-gray-900 dark:text-white">
                    Résultat opérationnel
                  </span>
                  <p className="![animation:none] text-xs text-indigo-400">
                    {apiData.operatingMargin.toFixed(1)}% du CA
                  </p>
                </div>
                <span className="![animation:none] text-xl font-bold text-indigo-400">
                  {formatAmount(apiData.operatingProfit)}
                </span>
              </div>

              {/* Other Income/Expenses */}
              {(apiData.otherIncome > 0 || apiData.otherExpenses > 0) && (
                <div className="![animation:none] ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                  <span className="![animation:none] text-gray-900 dark:text-white">Autres revenus & charges</span>
                  <span className="![animation:none] font-semibold text-rose-400">
                    {apiData.otherIncome > 0 && `+${formatAmount(apiData.otherIncome)} `}
                    {apiData.otherExpenses > 0 && `-${formatAmount(apiData.otherExpenses)}`}
                  </span>
                </div>
              )}

              {/* Net Profit */}
              <div
                className={`flex items-center justify-between rounded-lg p-4 ${
                  apiData.netProfit >= 0
                    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5"
                    : "bg-gradient-to-r from-rose-500/20 to-rose-500/5"
                }`}
              >
                <div>
                  <span className="![animation:none] font-semibold text-gray-900 dark:text-white">Résultat net</span>
                  <p
                    className={`text-xs ${
                      apiData.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {apiData.netMargin.toFixed(1)}% du CA
                  </p>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    apiData.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatAmount(apiData.netProfit)}
                </span>
              </div>
            </div>
          </GlassPanel>
        </m.div>

        <div className="![animation:none] grid gap-6 md:grid-cols-2">
          {/* Benchmark Comparison */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassPanel className="![animation:none] p-6">
              <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Comparaison benchmarks sectoriels
              </h2>
              <div className="![animation:none] space-y-4">
                {/* Gross Margin */}
                <div>
                  <div className="![animation:none] mb-2 flex items-center justify-between">
                    <span className="![animation:none] text-sm text-slate-400">Marge brute</span>
                    <span className="![animation:none] text-sm font-medium text-gray-900 dark:text-white">
                      {apiData.grossMargin.toFixed(1)}% vs {benchmarks.grossMargin}
                      %
                    </span>
                  </div>
                  <div className="![animation:none] relative h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="![animation:none] absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{
                        width: `${Math.min(
                          (apiData.grossMargin / benchmarks.grossMargin) * 100,
                          100
                        )}%`,
                      }}
                    />
                    <div
                      className="![animation:none] absolute inset-y-0 border-l-2 border-gray-200 dark:border-gray-7000"
                      style={{ left: "100%" }}
                    />
                  </div>
                  {apiData.grossMargin < benchmarks.grossMargin && (
                    <p className="![animation:none] mt-1 text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="![animation:none] h-3 w-3" />
                      En dessous du benchmark sectoriel
                    </p>
                  )}
                </div>

                {/* Operating Margin */}
                <div>
                  <div className="![animation:none] mb-2 flex items-center justify-between">
                    <span className="![animation:none] text-sm text-slate-400">
                      Marge opérationnelle
                    </span>
                    <span className="![animation:none] text-sm font-medium text-gray-900 dark:text-white">
                      {apiData.operatingMargin.toFixed(1)}% vs{" "}
                      {benchmarks.operatingMargin}%
                    </span>
                  </div>
                  <div className="![animation:none] relative h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="![animation:none] absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-400"
                      style={{
                        width: `${Math.min(
                          (apiData.operatingMargin / benchmarks.operatingMargin) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  {apiData.operatingMargin < benchmarks.operatingMargin && (
                    <p className="![animation:none] mt-1 text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="![animation:none] h-3 w-3" />
                      En dessous du benchmark sectoriel
                    </p>
                  )}
                </div>

                {/* Net Margin */}
                <div>
                  <div className="![animation:none] mb-2 flex items-center justify-between">
                    <span className="![animation:none] text-sm text-slate-400">Marge nette</span>
                    <span className="![animation:none] text-sm font-medium text-gray-900 dark:text-white">
                      {apiData.netMargin.toFixed(1)}% vs {benchmarks.netMargin}%
                    </span>
                  </div>
                  <div className="![animation:none] relative h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="![animation:none] absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-rose-400"
                      style={{
                        width: `${Math.min(
                          (apiData.netMargin / benchmarks.netMargin) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  {apiData.netMargin < benchmarks.netMargin && (
                    <p className="![animation:none] mt-1 text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="![animation:none] h-3 w-3" />
                      En dessous du benchmark sectoriel
                    </p>
                  )}
                </div>
              </div>
            </GlassPanel>
          </m.div>

          {/* Summary Breakdown */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassPanel className="![animation:none] p-6">
              <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Récapitulatif
              </h2>
              <div className="![animation:none] space-y-4">
                <div className="![animation:none] flex items-center justify-between rounded-lg bg-emerald-500/10 p-4">
                  <span className="![animation:none] text-gray-900 dark:text-white">Total revenus</span>
                  <span className="![animation:none] text-lg font-bold text-emerald-400">
                    {formatAmount(apiData.breakdown.totalIncome)}
                  </span>
                </div>
                <div className="![animation:none] flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                  <span className="![animation:none] text-gray-900 dark:text-white">Total dépenses</span>
                  <span className="![animation:none] text-lg font-bold text-rose-400">
                    {formatAmount(apiData.breakdown.totalExpenses)}
                  </span>
                </div>
                <div className="![animation:none] flex items-center justify-between rounded-lg bg-indigo-500/10 p-4">
                  <span className="![animation:none] text-gray-900 dark:text-white">Transactions analysées</span>
                  <span className="![animation:none] text-lg font-bold text-indigo-400">
                    {apiData.breakdown.transactionCount}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </m.div>
        </div>
        </>
        )}
      </div>
    </Layout>
    </LazyMotion>
    );
}
