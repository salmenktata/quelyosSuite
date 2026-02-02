/**
 * EBITDA - Rentabilité Opérationnelle
 *
 * Fonctionnalités :
 * - Calcul EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)
 * - Marge EBITDA et comparaison aux benchmarks sectoriels
 * - Décomposition du résultat d'exploitation (revenus - charges)
 * - Évolution historique de la rentabilité opérationnelle
 * - Recommandations d'optimisation de la marge
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import {
  TrendingUp,
  DollarSign,
  Percent,
  AlertCircle,
  Loader2,
  Minus,
  Plus,
} from 'lucide-react'
import { GlassPanel, GlassCard } from '@/components/ui/glass'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { ExportDropdown } from '@/components/finance/reporting/ExportDropdown'
import { ReliabilityBadge } from '@/components/kpis/ReliabilityBadge'
import { reportingClient, type EBITDAResponse, type EBITDAHistoryPoint } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { formatDateForExport } from '@/lib/utils/export'
import { TrendChart } from '@/components/finance/charts/TrendChart'
import { financeNotices } from '@/lib/notices/finance-notices'

type TimeRange = "7" | "30" | "60" | "90";

export default function EBITDAReportPage() {
  useRequireAuth();
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency();
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [historyMonths, setHistoryMonths] = useState<number>(6);

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency);
  };

  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<EBITDAResponse>({
    fetcher: () => reportingClient.ebitda({
      days: parseInt(timeRange),
    }),
    cacheKey: `reporting-ebitda-${timeRange}`,
    cacheTime: 5 * 60 * 1000,
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  const {
    data: historyData,
    loading:_historyLoading,
  } = useApiData<{ months: number; data: EBITDAHistoryPoint[] }>({
    fetcher: () => reportingClient.ebitdaHistory({ months: historyMonths }),
    cacheKey: `ebitda-history-${historyMonths}`,
    cacheTime: 5 * 60 * 1000,
    deps: [historyMonths],
  });

  const benchmarks = {
    ebitdaMargin: 15,
    operatingMargin: 10,
  };

  return (
    <LazyMotion features={domAnimation}>
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'EBITDA' },
          ]}
        />

        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                EBITDA - Rentabilité Opérationnelle
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Earnings Before Interest, Taxes, Depreciation & Amortization
              </p>
            </div>
          </div>
        </m.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.ebitda} className="mb-6" />

        {/* Reliability Badge */}
        {apiData?.reliability && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <ReliabilityBadge
              reliability={apiData.reliability}
              showDetails={true}
              reportId="ebitda"
            />
          </m.div>
        )}

        {/* Controls */}
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassPanel className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {(["7", "30", "60", "90"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={loading}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      timeRange === range
                        ? "bg-emerald-500 text-gray-900 dark:text-white"
                        : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {range}j
                  </button>
                ))}
              </div>
              {!loading && apiData && (
                <ExportDropdown
                  filename="ebitda-report"
                  reportTitle="Rapport EBITDA - Rentabilité Opérationnelle"
                  onExport={() => {
                    const rows = [
                      ['Rapport EBITDA - Rentabilité Opérationnelle'],
                      ['Période', `${formatDateForExport(apiData.range.from)} - ${formatDateForExport(apiData.range.to)}`],
                      [],
                      ['Compte de Résultat'],
                      ['Chiffre d\'Affaires', formatAmount(apiData.revenue)],
                      ['Coût des Ventes', formatAmount(apiData.cogs)],
                      ['Marge Brute', formatAmount(apiData.grossProfit), `${apiData.grossMargin.toFixed(1)}%`],
                      ['Charges Opérationnelles', formatAmount(apiData.operatingExpenses)],
                      ['Résultat Opérationnel (EBIT)', formatAmount(apiData.operatingProfit), `${apiData.operatingMargin.toFixed(1)}%`],
                      ['Dotations (D&A)', formatAmount(apiData.depreciationAndAmortization)],
                      ['EBITDA', formatAmount(apiData.ebitda), `${apiData.ebitdaMargin.toFixed(1)}%`],
                      [],
                      ['Autres'],
                      ['Autres Revenus', formatAmount(apiData.otherIncome)],
                      ['Autres Charges', formatAmount(apiData.otherExpenses)],
                      ['Résultat Net', formatAmount(apiData.netProfit), `${apiData.netMargin.toFixed(1)}%`],
                    ];
                    return rows;
                  }}
                />
              )}
            </div>
          </GlassPanel>
        </m.div>

        {/* Loading State */}
        {loading && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <GlassCard className="p-8">
              <div className="flex items-center justify-center gap-3 text-indigo-300">
                <Loader2 className="h-5 w-5 animate-spin" />
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
            className="mb-6"
          >
            <GlassCard className="border-red-400/40 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="flex-1">
                  <p className="font-semibold text-red-100">{error}</p>
                </div>
                <button
                  onClick={refetch}
                  className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-100 hover:bg-red-500/30 transition-colors"
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
          className="mb-6 grid gap-4 md:grid-cols-3"
        >
          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">EBITDA</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.ebitda)}
                </p>
                <p className="text-xs text-emerald-300 mt-1">
                  Marge {apiData.ebitdaMargin.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">
                  Résultat opérationnel
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.operatingProfit)}
                </p>
                <p className="text-xs text-indigo-300 mt-1">
                  Marge {apiData.operatingMargin.toFixed(1)}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="amber">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-amber-200">
                  Dotations (D&A)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.depreciationAndAmortization)}
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  Amortissements
                </p>
              </div>
              <Minus className="h-8 w-8 text-amber-300" />
            </div>
          </GlassCard>
        </m.div>

        {/* Historical Trend */}
        {!loading && !error && historyData && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <TrendChart
            title="Évolution de l'EBITDA"
            subtitle="Performance opérationnelle sur plusieurs mois"
            data={historyData.data}
            lines={[
              {
                dataKey: "ebitda",
                name: "EBITDA",
                color: "#10b981",
                format: (value) => formatAmount(value),
              },
              {
                dataKey: "ebitdaMargin",
                name: "Marge EBITDA (%)",
                color: "#f59e0b",
                format: (value) => `${value.toFixed(1)}%`,
              },
            ]}
            height={250}
            defaultMonths={historyMonths as 3 | 6 | 12}
            onMonthsChange={(months) => setHistoryMonths(months)}
          />
        </m.div>
        )}

        {/* Benchmark Comparison */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassPanel className={`p-6 ${apiData.ebitdaMargin >= benchmarks.ebitdaMargin ? "bg-emerald-500/5" : apiData.ebitdaMargin >= 5 ? "bg-amber-500/5" : "bg-rose-500/5"}`}>
            <div className="flex items-start gap-3">
              {apiData.ebitdaMargin >= benchmarks.ebitdaMargin ? (
                <TrendingUp className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                  {apiData.ebitdaMargin >= benchmarks.ebitdaMargin
                    ? "✅ EBITDA Excellent"
                    : apiData.ebitdaMargin >= 5
                    ? "⚠️ EBITDA Correct"
                    : "❌ EBITDA Faible"}
                </h3>
                <p className="text-sm text-slate-300">
                  {apiData.ebitdaMargin >= benchmarks.ebitdaMargin
                    ? `Votre marge EBITDA (${apiData.ebitdaMargin.toFixed(1)}%) est supérieure au benchmark TPE/PME (${benchmarks.ebitdaMargin}%). Excellente performance opérationnelle.`
                    : apiData.ebitdaMargin >= 5
                    ? `Votre marge EBITDA (${apiData.ebitdaMargin.toFixed(1)}%) est correcte mais peut être améliorée. Cible recommandée : ${benchmarks.ebitdaMargin}%.`
                    : `Votre marge EBITDA (${apiData.ebitdaMargin.toFixed(1)}%) est trop faible. Action urgente : réduction des charges opérationnelles et optimisation des marges.`}
                </p>
              </div>
            </div>
          </GlassPanel>
        </m.div>

        {/* Waterfall: Operating Profit to EBITDA */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Réconciliation EBITDA
            </h2>
            <div className="space-y-4">
              {/* Revenue */}
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Chiffre d&apos;affaires
                  </span>
                </div>
                <span className="text-xl font-bold text-emerald-400">
                  {formatAmount(apiData.revenue)}
                </span>
              </div>

              {/* COGS */}
              <div className="ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-rose-400" />
                  <span className="text-gray-900 dark:text-white">Coût des ventes</span>
                </div>
                <span className="font-semibold text-rose-400">
                  -{formatAmount(apiData.cogs)}
                </span>
              </div>

              {/* Gross Profit */}
              <div className="ml-4 flex items-center justify-between rounded-lg bg-emerald-500/10 p-4 border-l-4 border-emerald-500">
                <span className="font-semibold text-gray-900 dark:text-white">Marge brute</span>
                <span className="text-lg font-bold text-emerald-400">
                  {formatAmount(apiData.grossProfit)}
                </span>
              </div>

              {/* Operating Expenses */}
              <div className="ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-rose-400" />
                  <span className="text-gray-900 dark:text-white">Charges opérationnelles</span>
                </div>
                <span className="font-semibold text-rose-400">
                  -{formatAmount(apiData.operatingExpenses)}
                </span>
              </div>

              {/* Operating Profit (EBIT) */}
              <div className="ml-4 flex items-center justify-between rounded-lg bg-indigo-500/10 p-4 border-l-4 border-indigo-500">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Résultat opérationnel (EBIT)
                </span>
                <span className="text-lg font-bold text-indigo-400">
                  {formatAmount(apiData.operatingProfit)}
                </span>
              </div>

              {/* Add back D&A */}
              <div className="ml-4 flex items-center justify-between rounded-lg bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-400" />
                  <span className="text-gray-900 dark:text-white">
                    Dotations aux amortissements (D&A)
                  </span>
                </div>
                <span className="font-semibold text-emerald-400">
                  +{formatAmount(apiData.depreciationAndAmortization)}
                </span>
              </div>

              {/* EBITDA */}
              <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-5 border-2 border-emerald-500/50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">EBITDA</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatAmount(apiData.ebitda)}
                </span>
              </div>
            </div>
          </GlassPanel>
        </m.div>

        {/* Margin Comparison */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Comparaison des marges
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <p className="mb-2 text-sm text-slate-400">Marge brute</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {apiData.grossMargin.toFixed(1)}%
                </p>
                <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{ width: `${Math.min(apiData.grossMargin, 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <p className="mb-2 text-sm text-slate-400">Marge opérationnelle</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {apiData.operatingMargin.toFixed(1)}%
                </p>
                <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                    style={{ width: `${Math.min(Math.max(apiData.operatingMargin, 0), 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <p className="mb-2 text-sm text-slate-400">Marge EBITDA</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {apiData.ebitdaMargin.toFixed(1)}%
                </p>
                <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.min(Math.max(apiData.ebitdaMargin, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassPanel>
        </m.div>

        {/* Recommendations */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassPanel className="p-6" gradient="violet">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              💡 Recommandations
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>1. EBITDA vs EBIT</strong> - L&apos;EBITDA mesure la performance opérationnelle pure avant les impacts comptables (amortissements) et financiers.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>2. Cible TPE/PME</strong> - Visez une marge EBITDA &gt; 15% pour assurer une rentabilité solide et financer la croissance.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>3. Optimisation</strong> - Pour améliorer l&apos;EBITDA: augmenter les prix, réduire les coûts variables, automatiser les processus.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>4. Valorisation</strong> - L&apos;EBITDA est souvent utilisé pour valoriser les entreprises (multiple d&apos;EBITDA).
                </p>
              </div>
            </div>
          </GlassPanel>
        </m.div>
        </>
        )}
      </div>
    </Layout>
    </LazyMotion>
  )
}
