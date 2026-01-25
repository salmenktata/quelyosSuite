

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  ChevronLeft,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  DollarSign,
  Percent,
  PieChart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { ExportDropdown } from "@/components/finance/reporting/ExportDropdown";
import { ReportNotice } from "@/components/finance/reporting/ReportNotice";
import { ReliabilityBadge } from "@/components/kpis/ReliabilityBadge";
import { reportingClient, type BreakEvenResponse, type BreakEvenHistoryPoint } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";
import { formatDateForExport } from "@/lib/utils/export";
import { TrendChart } from "@/components/finance/charts/TrendChart";
import { reportingNotices } from "@/lib/finance/reporting-notices";

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
    loading: historyLoading,
  } = useApiData<{ months: number; data: BreakEvenHistoryPoint[] }>({
    fetcher: () => reportingClient.breakevenHistory({ months: historyMonths }),
    cacheKey: `breakeven-history-${historyMonths}`,
    cacheTime: 5 * 60 * 1000,
    deps: [historyMonths],
  });

  return (
    <div className="min-h-screen p-6 pt-16">
      <div className="mx-auto max-w-7xl">
        <ReportingNav />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href={ROUTES.FINANCE.DASHBOARD.REPORTING}
            className="mb-4 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-3 shadow-lg shadow-purple-500/30">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Point Mort - Seuil de Rentabilité
              </h1>
              <p className="text-sm text-slate-400">
                Break-even Analysis - Analyse des coûts fixes et variables
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <ReportNotice
          title={reportingNotices.breakeven.title}
          purpose={reportingNotices.breakeven.purpose}
          tracking={reportingNotices.breakeven.tracking}
          icon={Target}
          reportId="breakeven"
        />

        {/* Reliability Badge */}
        {apiData?.reliability && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <ReliabilityBadge
              reliability={apiData.reliability}
              showDetails={true}
              reportId="breakeven"
            />
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
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
                        ? "bg-purple-500 text-white"
                        : "text-slate-400 hover:bg-white/5"
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
                      ...apiData.categoriesBreakdown.fixed.map(c => [c.categoryName, formatAmount(c.amount)]),
                      [],
                      ['Coûts Variables par Catégorie'],
                      ['Catégorie', 'Montant'],
                      ...apiData.categoriesBreakdown.variable.map(c => [c.categoryName, formatAmount(c.amount)]),
                    ];
                    return rows;
                  }}
                />
              )}
            </div>
          </GlassPanel>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
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
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
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
          </motion.div>
        )}

        {/* KPIs */}
        {!loading && !error && apiData && (
        <>
        {/* Warning if unclassified costs */}
        {apiData.warning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <GlassCard className="border-amber-400/40 bg-amber-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <p className="text-sm text-amber-100">{apiData.warning}</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 grid gap-4 md:grid-cols-4"
        >
          <GlassCard
            className="p-4"
            gradient={apiData.breakEvenReached ? "emerald" : "rose"}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`mb-1 text-sm ${apiData.breakEvenReached ? "text-emerald-200" : "text-rose-200"}`}>
                  Statut
                </p>
                <p className="text-2xl font-bold text-white">
                  {apiData.breakEvenReached ? "✅ Atteint" : "❌ Non atteint"}
                </p>
                <p className={`text-xs mt-1 ${apiData.breakEvenReached ? "text-emerald-300" : "text-rose-300"}`}>
                  Point mort
                </p>
              </div>
              {apiData.breakEvenReached ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              ) : (
                <AlertCircle className="h-8 w-8 text-rose-300" />
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">
                  CA Point Mort
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(apiData.breakEvenRevenue)}
                </p>
                <p className="text-xs text-indigo-300 mt-1">
                  CA requis
                </p>
              </div>
              <Target className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">
                  CA Actuel
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(apiData.currentRevenue)}
                </p>
                <p className="text-xs text-emerald-300 mt-1">
                  Réalisé
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-purple-200">
                  Marge de sécurité
                </p>
                <p className="text-2xl font-bold text-white">
                  {apiData.safetyMargin >= 0 ? apiData.safetyMargin.toFixed(1) : "0"}%
                </p>
                <p className="text-xs text-purple-300 mt-1">
                  {apiData.breakEvenReached ? "Cushion" : "Gap"}
                </p>
              </div>
              <Percent className="h-8 w-8 text-purple-300" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Break-even Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassPanel className={`p-6 ${apiData.breakEvenReached ? "bg-emerald-500/5" : "bg-rose-500/5"}`}>
            <div className="flex items-start gap-3">
              {apiData.breakEvenReached ? (
                <TrendingUp className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-rose-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-white">
                  {apiData.breakEvenReached ? "✅ Point mort atteint" : "❌ Point mort non atteint"}
                </h3>
                <p className="text-sm text-slate-300">
                  {apiData.breakEvenReached
                    ? `Votre CA actuel (${formatAmount(apiData.currentRevenue)}) dépasse le seuil de rentabilité (${formatAmount(apiData.breakEvenRevenue)}). Vous avez une marge de sécurité de ${apiData.safetyMargin.toFixed(1)}%.`
                    : `Il vous manque ${formatAmount(Math.abs(apiData.revenueGap))} de CA pour atteindre le point mort. Vous devez générer ${formatAmount(apiData.breakEvenRevenue)} de CA pour couvrir vos charges fixes.`}
                </p>
                {apiData.breakEvenReached && (
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${Math.min((apiData.currentRevenue / (apiData.breakEvenRevenue * 1.5)) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Historical Trend */}
        {!loading && !error && historyData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
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
        </motion.div>
        )}

        {/* Cost Structure */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Structure des coûts
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-indigo-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="h-5 w-5 text-indigo-400" />
                  <span className="font-semibold text-white">Coûts fixes</span>
                </div>
                <p className="text-3xl font-bold text-indigo-400 mb-1">
                  {formatAmount(apiData.fixedCosts)}
                </p>
                <p className="text-xs text-slate-400">
                  {apiData.categoriesBreakdown.fixed.length} catégories
                </p>
              </div>

              <div className="rounded-lg bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <span className="font-semibold text-white">Coûts variables</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400 mb-1">
                  {formatAmount(apiData.variableCosts)}
                </p>
                <p className="text-xs text-slate-400">
                  {apiData.categoriesBreakdown.variable.length} catégories
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Break-even Formula */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Calcul du point mort
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-sm text-slate-400 mb-2">1. Marge sur coûts variables</p>
                <p className="text-2xl font-bold text-white">
                  {(apiData.contributionMargin * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  = (CA - Coûts variables) / CA
                </p>
              </div>

              <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/30">
                <p className="text-sm text-purple-200 mb-2">2. Point mort (CA)</p>
                <p className="text-3xl font-bold text-white mb-2">
                  {formatAmount(apiData.breakEvenRevenue)}
                </p>
                <p className="text-sm text-slate-300">
                  = Charges fixes / Marge sur coûts variables
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  = {formatAmount(apiData.fixedCosts)} / {(apiData.contributionMargin * 100).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-sm text-slate-400 mb-2">3. Marge de sécurité</p>
                <p className="text-2xl font-bold text-white">
                  {apiData.safetyMargin >= 0 ? apiData.safetyMargin.toFixed(1) : "0"}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  = (CA actuel - CA point mort) / CA actuel
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6 grid gap-6 lg:grid-cols-2"
        >
          {/* Fixed Costs */}
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Coûts fixes (FIXED)
            </h2>
            {apiData.categoriesBreakdown.fixed.length === 0 ? (
              <p className="text-center text-slate-400 py-4">Aucune catégorie classifiée comme coût fixe</p>
            ) : (
              <div className="space-y-2">
                {apiData.categoriesBreakdown.fixed.slice(0, 10).map((cat) => (
                  <div key={cat.categoryId} className="flex items-center justify-between rounded-lg bg-indigo-500/10 p-3">
                    <span className="text-sm text-white">{cat.categoryName}</span>
                    <span className="text-sm font-semibold text-indigo-400">
                      {formatAmount(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Variable Costs */}
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Coûts variables (VARIABLE)
            </h2>
            {apiData.categoriesBreakdown.variable.length === 0 ? (
              <p className="text-center text-slate-400 py-4">Aucune catégorie classifiée comme coût variable</p>
            ) : (
              <div className="space-y-2">
                {apiData.categoriesBreakdown.variable.slice(0, 10).map((cat) => (
                  <div key={cat.categoryId} className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-3">
                    <span className="text-sm text-white">{cat.categoryName}</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatAmount(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </motion.div>

        {/* Unclassified Costs */}
        {apiData.categoriesBreakdown.unclassified.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <GlassPanel className="p-6 border-amber-500/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">
                  Coûts non classifiés ({apiData.categoriesBreakdown.unclassified.length})
                </h2>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Classifiez ces catégories en FIXED ou VARIABLE pour améliorer la précision du calcul du point mort.
              </p>
              <div className="space-y-2">
                {apiData.categoriesBreakdown.unclassified.slice(0, 10).map((cat) => (
                  <div key={cat.categoryId} className="flex items-center justify-between rounded-lg bg-amber-500/10 p-3">
                    <span className="text-sm text-white">{cat.categoryName}</span>
                    <span className="text-sm font-semibold text-amber-400">
                      {formatAmount(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassPanel className="p-6" gradient="violet">
            <h2 className="mb-4 text-lg font-semibold text-white">
              💡 Recommandations
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-sm text-white">
                  <strong>1. Classifier les catégories</strong> - Allez dans les paramètres pour classifier chaque catégorie de dépense en FIXED ou VARIABLE.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-sm text-white">
                  <strong>2. Réduire les coûts fixes</strong> - Les coûts fixes pèsent sur le point mort. Privilégiez les charges variables quand c&apos;est possible.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-sm text-white">
                  <strong>3. Améliorer la marge sur coûts variables</strong> - Augmentez vos prix ou réduisez les coûts variables pour atteindre le point mort plus facilement.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-sm text-white">
                  <strong>4. Marge de sécurité cible</strong> - Visez au moins 20% de marge de sécurité pour absorber les variations d&apos;activité.
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
        </>
        )}
      </div>
    </div>
  );
}
