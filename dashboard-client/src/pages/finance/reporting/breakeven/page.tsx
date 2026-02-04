/**
 * Point Mort (Break-even) - Seuil de Rentabilité
 *
 * Fonctionnalités :
 * - Calcul du point mort (CA minimum pour couvrir charges fixes + variables)
 * - Classification des dépenses en coûts fixes vs variables
 * - Marge de sécurité et taux de couverture
 * - Simulation de scénarios pour optimiser la rentabilité
 * - Recommandations pour réduire le seuil de rentabilité
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import {
  Target,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  DollarSign,
  Percent,
  PieChart,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { ExportDropdown } from '@/components/finance/reporting/ExportDropdown'
import { ReliabilityBadge } from '@/components/kpis/ReliabilityBadge'
import { reportingClient, type BreakEvenResponse, type BreakEvenHistoryPoint } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { formatDateForExport } from '@/lib/utils/export'
import { TrendChart } from '@/components/finance/charts/TrendChart'
import { financeNotices } from '@/lib/notices/finance-notices'

type TimeRange = "7" | "30" | "60" | "90";

export default function BreakEvenReportPage() {
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
  } = useApiData<BreakEvenResponse>({
    fetcher: () => reportingClient.breakeven({
      days: parseInt(timeRange),
    }),
    cacheKey: `reporting-breakeven-${timeRange}`,
    cacheTime: 5 * 60 * 1000,
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  const {
    data: historyData,
    loading:_historyLoading,
  } = useApiData<{ months: number; data: BreakEvenHistoryPoint[] }>({
    fetcher: () => reportingClient.breakevenHistory({ months: historyMonths }),
    cacheKey: `breakeven-history-${historyMonths}`,
    cacheTime: 5 * 60 * 1000,
    deps: [historyMonths],
  });

  return (
    <LazyMotion features={domAnimation}>
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Point Mort' },
          ]}
        />

        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="![animation:none] flex items-center gap-3">
            <div className="![animation:none] rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-3 shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20">
              <Target className="![animation:none] h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="![animation:none] text-3xl font-bold text-gray-900 dark:text-white">
                Point Mort - Seuil de Rentabilité
              </h1>
              <p className="![animation:none] text-sm text-gray-500 dark:text-gray-400">
                Break-even Analysis - Analyse des coûts fixes et variables
              </p>
            </div>
          </div>
        </m.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.breakeven} className="![animation:none]" />

        {/* Reliability Badge */}
        {apiData?.reliability && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="![animation:none] mb-6"
          >
            <ReliabilityBadge
              reliability={apiData.reliability}
              showDetails={true}
              reportId="breakeven"
            />
          </m.div>
        )}

        {/* Controls */}
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="![animation:none] mb-6"
        >
          <Card className="![animation:none] p-4">
            <div className="![animation:none] flex items-center justify-between gap-4">
              <div className="![animation:none] flex gap-2">
                {(["7", "30", "60", "90"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={loading}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      timeRange === range
                        ? "bg-purple-500 text-gray-900 dark:text-white"
                        : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {range}j
                  </button>
                ))}
              </div>
              {!loading && apiData && (
                <ExportDropdown
                  filename="breakeven-report"
                  reportTitle="Rapport Point Mort - Seuil de Rentabilité"
                  onExport={() => {
                    const rows = [
                      ['Rapport Point Mort - Seuil de Rentabilité'],
                      ['Période', `${formatDateForExport(apiData.range.from)} - ${formatDateForExport(apiData.range.to)}`],
                      [],
                      ['Résultat'],
                      ['Point Mort Atteint', apiData.breakEvenReached ? 'Oui' : 'Non'],
                      ['CA Point Mort', formatAmount(apiData.breakEvenRevenue)],
                      ['CA Actuel', formatAmount(apiData.currentRevenue)],
                      ['Écart', formatAmount(apiData.revenueGap)],
                      ['Marge de Sécurité', `${apiData.safetyMargin.toFixed(1)}%`],
                      [],
                      ['Structure des Coûts'],
                      ['Coûts Fixes', formatAmount(apiData.fixedCosts)],
                      ['Coûts Variables', formatAmount(apiData.variableCosts)],
                      ['Marge sur Coûts Variables', `${(apiData.contributionMargin * 100).toFixed(1)}%`],
                      [],
                      ['Coûts Fixes par Catégorie'],
                      ['Catégorie', 'Montant'],
                      ...(apiData.categoriesBreakdown?.fixed || []).map(c => [c.name, formatAmount(c.total)]),
                      [],
                      ['Coûts Variables par Catégorie'],
                      ['Catégorie', 'Montant'],
                      ...(apiData.categoriesBreakdown?.variable || []).map(c => [c.name, formatAmount(c.total)]),
                    ];
                    return rows;
                  }}
                />
              )}
            </div>
          </Card>
        </m.div>

        {/* Loading State */}
        {loading && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="![animation:none] mb-6"
          >
            <Card className="![animation:none] p-8">
              <div className="![animation:none] flex items-center justify-center gap-3 text-indigo-300">
                <Loader2 className="![animation:none] h-5 w-5 animate-spin" />
                <span>Chargement des données...</span>
              </div>
            </Card>
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
            <Card className="![animation:none] border-red-400/40 bg-red-500/10 p-4">
              <div className="![animation:none] flex items-center gap-3">
                <AlertCircle className="![animation:none] h-5 w-5 text-red-400" />
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
            </Card>
          </m.div>
        )}

        {/* KPIs */}
        {!loading && !error && apiData && (
        <>
        {/* Warning if unclassified costs */}
        {apiData.warning && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="![animation:none] mb-6"
          >
            <Card className="![animation:none] border-amber-400/40 bg-amber-500/10 p-4">
              <div className="![animation:none] flex items-center gap-3">
                <AlertCircle className="![animation:none] h-5 w-5 text-amber-400" />
                <p className="![animation:none] text-sm text-amber-100">{apiData.warning}</p>
              </div>
            </Card>
          </m.div>
        )}

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="![animation:none] mb-6 grid gap-4 md:grid-cols-4"
        >
          <Card className="![animation:none] p-4">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className={`mb-1 text-sm ${apiData.breakEvenReached ? "text-emerald-200" : "text-rose-200"}`}>
                  Statut
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.breakEvenReached ? "✅ Atteint" : "❌ Non atteint"}
                </p>
                <p className={`text-xs mt-1 ${apiData.breakEvenReached ? "text-emerald-300" : "text-rose-300"}`}>
                  Point mort
                </p>
              </div>
              {apiData.breakEvenReached ? (
                <CheckCircle2 className="![animation:none] h-8 w-8 text-emerald-300" />
              ) : (
                <AlertCircle className="![animation:none] h-8 w-8 text-rose-300" />
              )}
            </div>
          </Card>

          <Card className="![animation:none] p-4">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-indigo-200">
                  CA Point Mort
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.breakEvenRevenue)}
                </p>
                <p className="![animation:none] text-xs text-indigo-300 mt-1">
                  CA requis
                </p>
              </div>
              <Target className="![animation:none] h-8 w-8 text-indigo-300" />
            </div>
          </Card>

          <Card className="![animation:none] p-4">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-emerald-200">
                  CA Actuel
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.currentRevenue)}
                </p>
                <p className="![animation:none] text-xs text-emerald-300 mt-1">
                  Réalisé
                </p>
              </div>
              <DollarSign className="![animation:none] h-8 w-8 text-emerald-300" />
            </div>
          </Card>

          <Card className="![animation:none] p-4">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-purple-200">
                  Marge de sécurité
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.safetyMargin >= 0 ? apiData.safetyMargin.toFixed(1) : "0"}%
                </p>
                <p className="![animation:none] text-xs text-purple-300 mt-1">
                  {apiData.breakEvenReached ? "Cushion" : "Gap"}
                </p>
              </div>
              <Percent className="![animation:none] h-8 w-8 text-purple-300" />
            </div>
          </Card>
        </m.div>

        {/* Break-even Status */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="![animation:none] mb-6"
        >
          <Card className={`p-6 ${apiData.breakEvenReached ? "bg-emerald-500/5" : "bg-rose-500/5"}`}>
            <div className="![animation:none] flex items-start gap-3">
              {apiData.breakEvenReached ? (
                <TrendingUp className="![animation:none] h-6 w-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="![animation:none] h-6 w-6 text-rose-400 flex-shrink-0" />
              )}
              <div className="![animation:none] flex-1">
                <h3 className="![animation:none] mb-1 font-semibold text-gray-900 dark:text-white">
                  {apiData.breakEvenReached ? "✅ Point mort atteint" : "❌ Point mort non atteint"}
                </h3>
                <p className="![animation:none] text-sm text-slate-300">
                  {apiData.breakEvenReached
                    ? `Votre CA actuel (${formatAmount(apiData.currentRevenue)}) dépasse le seuil de rentabilité (${formatAmount(apiData.breakEvenRevenue)}). Vous avez une marge de sécurité de ${apiData.safetyMargin.toFixed(1)}%.`
                    : `Il vous manque ${formatAmount(Math.abs(apiData.revenueGap))} de CA pour atteindre le point mort. Vous devez générer ${formatAmount(apiData.breakEvenRevenue)} de CA pour couvrir vos charges fixes.`}
                </p>
                {apiData.breakEvenReached && (
                  <div className="![animation:none] mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="![animation:none] h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${Math.min((apiData.currentRevenue / (apiData.breakEvenRevenue * 1.5)) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </m.div>

        {/* Historical Trend */}
        {!loading && !error && historyData && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="![animation:none] mb-6"
        >
          <TrendChart
            title="Évolution du Point Mort"
            subtitle="CA vs Seuil de rentabilité sur plusieurs mois"
            data={historyData.data}
            lines={[
              {
                dataKey: "revenue",
                name: "CA Réel",
                color: "#10b981",
                format: (value) => formatAmount(value),
              },
              {
                dataKey: "breakEvenRevenue",
                name: "Seuil de rentabilité",
                color: "#ef4444",
                format: (value) => formatAmount(value),
              },
              {
                dataKey: "safetyMargin",
                name: "Marge de sécurité (%)",
                color: "#8b5cf6",
                format: (value) => `${value.toFixed(1)}%`,
              },
            ]}
            height={300}
            defaultMonths={historyMonths as 3 | 6 | 12}
            onMonthsChange={(months) => setHistoryMonths(months)}
          />
        </m.div>
        )}

        {/* Cost Structure */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="![animation:none] mb-6"
        >
          <Card className="![animation:none] p-6">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Structure des coûts
            </h2>
            <div className="![animation:none] grid gap-4 md:grid-cols-2">
              <div className="![animation:none] rounded-lg bg-indigo-500/10 p-4">
                <div className="![animation:none] flex items-center gap-2 mb-2">
                  <PieChart className="![animation:none] h-5 w-5 text-indigo-400" />
                  <span className="![animation:none] font-semibold text-gray-900 dark:text-white">Coûts fixes</span>
                </div>
                <p className="![animation:none] text-3xl font-bold text-indigo-400 mb-1">
                  {formatAmount(apiData.fixedCosts)}
                </p>
                <p className="![animation:none] text-xs text-slate-400">
                  {apiData.categoriesBreakdown?.fixed?.length || 0} catégories
                </p>
              </div>

              <div className="![animation:none] rounded-lg bg-emerald-500/10 p-4">
                <div className="![animation:none] flex items-center gap-2 mb-2">
                  <TrendingUp className="![animation:none] h-5 w-5 text-emerald-400" />
                  <span className="![animation:none] font-semibold text-gray-900 dark:text-white">Coûts variables</span>
                </div>
                <p className="![animation:none] text-3xl font-bold text-emerald-400 mb-1">
                  {formatAmount(apiData.variableCosts)}
                </p>
                <p className="![animation:none] text-xs text-slate-400">
                  {apiData.categoriesBreakdown?.variable?.length || 0} catégories
                </p>
              </div>
            </div>
          </Card>
        </m.div>

        {/* Break-even Formula */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="![animation:none] mb-6"
        >
          <Card className="![animation:none] p-6">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Calcul du point mort
            </h2>
            <div className="![animation:none] space-y-4">
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <p className="![animation:none] text-sm text-slate-400 mb-2">1. Marge sur coûts variables</p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {(apiData.contributionMargin * 100).toFixed(1)}%
                </p>
                <p className="![animation:none] text-xs text-slate-400 mt-1">
                  = (CA - Coûts variables) / CA
                </p>
              </div>

              <div className="![animation:none] rounded-lg bg-purple-500/10 p-4 border border-purple-500/30">
                <p className="![animation:none] text-sm text-purple-200 mb-2">2. Point mort (CA)</p>
                <p className="![animation:none] text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatAmount(apiData.breakEvenRevenue)}
                </p>
                <p className="![animation:none] text-sm text-slate-300">
                  = Charges fixes / Marge sur coûts variables
                </p>
                <p className="![animation:none] text-xs text-slate-400 mt-1">
                  = {formatAmount(apiData.fixedCosts)} / {(apiData.contributionMargin * 100).toFixed(1)}%
                </p>
              </div>

              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <p className="![animation:none] text-sm text-slate-400 mb-2">3. Marge de sécurité</p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.safetyMargin >= 0 ? apiData.safetyMargin.toFixed(1) : "0"}%
                </p>
                <p className="![animation:none] text-xs text-slate-400 mt-1">
                  = (CA actuel - CA point mort) / CA actuel
                </p>
              </div>
            </div>
          </Card>
        </m.div>

        {/* Category Breakdown */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="![animation:none] mb-6 grid gap-6 lg:grid-cols-2"
        >
          {/* Fixed Costs */}
          <Card className="![animation:none] p-6">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Coûts fixes (FIXED)
            </h2>
            {!apiData.categoriesBreakdown?.fixed || apiData.categoriesBreakdown.fixed.length === 0 ? (
              <p className="![animation:none] text-center text-slate-400 py-4">Aucune catégorie classifiée comme coût fixe</p>
            ) : (
              <div className="![animation:none] space-y-2">
                {apiData.categoriesBreakdown.fixed.slice(0, 10).map((cat) => (
                  <div key={cat.categoryId} className="![animation:none] flex items-center justify-between rounded-lg bg-indigo-500/10 p-3">
                    <span className="![animation:none] text-sm text-gray-900 dark:text-white">{cat.name}</span>
                    <span className="![animation:none] text-sm font-semibold text-indigo-400">
                      {formatAmount(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Variable Costs */}
          <Card className="![animation:none] p-6">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Coûts variables (VARIABLE)
            </h2>
            {!apiData.categoriesBreakdown?.variable || apiData.categoriesBreakdown.variable.length === 0 ? (
              <p className="![animation:none] text-center text-slate-400 py-4">Aucune catégorie classifiée comme coût variable</p>
            ) : (
              <div className="![animation:none] space-y-2">
                {apiData.categoriesBreakdown.variable.slice(0, 10).map((cat) => (
                  <div key={cat.categoryId} className="![animation:none] flex items-center justify-between rounded-lg bg-emerald-500/10 p-3">
                    <span className="![animation:none] text-sm text-gray-900 dark:text-white">{cat.name}</span>
                    <span className="![animation:none] text-sm font-semibold text-emerald-400">
                      {formatAmount(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </m.div>

        {/* Unclassified Costs */}
        {apiData.categoriesBreakdown?.unclassified && apiData.categoriesBreakdown.unclassified.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="![animation:none] mb-6"
          >
            <Card className="![animation:none] p-6 border-amber-500/30">
              <div className="![animation:none] flex items-center gap-2 mb-4">
                <AlertCircle className="![animation:none] h-5 w-5 text-amber-400" />
                <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white">
                  Coûts non classifiés ({apiData.categoriesBreakdown.unclassified.length})
                </h2>
              </div>
              <p className="![animation:none] text-sm text-slate-400 mb-4">
                Classifiez ces catégories en FIXED ou VARIABLE pour améliorer la précision du calcul du point mort.
              </p>
              <div className="![animation:none] space-y-2">
                {apiData.categoriesBreakdown.unclassified.slice(0, 10).map((cat) => (
                  <div key={cat.categoryId} className="![animation:none] flex items-center justify-between rounded-lg bg-amber-500/10 p-3">
                    <span className="![animation:none] text-sm text-gray-900 dark:text-white">{cat.name}</span>
                    <span className="![animation:none] text-sm font-semibold text-amber-400">
                      {formatAmount(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </m.div>
        )}

        {/* Recommendations */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="![animation:none] p-6">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              💡 Recommandations
            </h2>
            <div className="![animation:none] space-y-3">
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>1. Classifier les catégories</strong> - Allez dans les paramètres pour classifier chaque catégorie de dépense en FIXED ou VARIABLE.
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>2. Réduire les coûts fixes</strong> - Les coûts fixes pèsent sur le point mort. Privilégiez les charges variables quand c&apos;est possible.
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>3. Améliorer la marge sur coûts variables</strong> - Augmentez vos prix ou réduisez les coûts variables pour atteindre le point mort plus facilement.
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>4. Marge de sécurité cible</strong> - Visez au moins 20% de marge de sécurité pour absorber les variations d&apos;activité.
                </p>
              </div>
            </div>
          </Card>
        </m.div>
        </>
        )}
      </div>
    </Layout>
    </LazyMotion>
    );
}
