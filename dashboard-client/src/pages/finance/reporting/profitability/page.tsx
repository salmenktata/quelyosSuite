

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  ChevronLeft,
  TrendingUp,
  DollarSign,
  Percent,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { ReportNotice } from "@/components/finance/reporting/ReportNotice";
import { reportingClient, type ProfitabilityResponse } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";
import { reportingNotices } from "@/lib/finance/reporting-notices";

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
    <div className="min-h-screen p-6 pt-16">
      <div className="mx-auto max-w-7xl">
        {/* Navigation rapide entre rapports */}
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
            <div className="rounded-full bg-gradient-to-br from-rose-500 to-pink-600 p-3 shadow-lg shadow-rose-500/30">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Analyse de rentabilité
              </h1>
              <p className="text-sm text-slate-400">
                Marges brutes et nettes, ratios clés et structure des coûts
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <ReportNotice
          title={reportingNotices.profitability.title}
          purpose={reportingNotices.profitability.purpose}
          tracking={reportingNotices.profitability.tracking}
          icon={Target}
          reportId="profitability"
        />

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassPanel className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {(["7", "30", "60", "90"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={loading}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      timeRange === range
                        ? "bg-rose-500 text-white"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {range}j
                  </button>
                ))}
              </div>
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 grid gap-4 md:grid-cols-3"
        >
          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Marge brute</p>
                <p className="text-2xl font-bold text-white">
                  {apiData.grossMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-emerald-300 mt-1">
                  {formatAmount(apiData.grossProfit)}
                </p>
              </div>
              <Percent className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">
                  Marge opérationnelle
                </p>
                <p className="text-2xl font-bold text-white">
                  {apiData.operatingMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-indigo-300 mt-1">
                  {formatAmount(apiData.operatingProfit)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="rose">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-rose-200">Marge nette</p>
                <p className="text-2xl font-bold text-white">
                  {apiData.netMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-rose-300 mt-1">
                  {formatAmount(apiData.netProfit)}
                </p>
              </div>
              <Target className="h-8 w-8 text-rose-300" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Waterfall P&L */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Compte de résultat (waterfall)
            </h2>
            <div className="space-y-4">
              {/* Revenue */}
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium text-white">
                    Chiffre d&apos;affaires
                  </span>
                </div>
                <span className="text-xl font-bold text-emerald-400">
                  {formatAmount(apiData.revenue)}
                </span>
              </div>

              {/* COGS */}
              <div className="ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                <span className="text-white">Coût des ventes</span>
                <span className="font-semibold text-rose-400">
                  -{formatAmount(apiData.cogs)}
                </span>
              </div>

              {/* Gross Profit */}
              <div className="flex items-center justify-between rounded-lg bg-cyan-500/10 p-4">
                <div>
                  <span className="font-medium text-white">Marge brute</span>
                  <p className="text-xs text-cyan-400">
                    {apiData.grossMargin.toFixed(1)}% du CA
                  </p>
                </div>
                <span className="text-xl font-bold text-cyan-400">
                  {formatAmount(apiData.grossProfit)}
                </span>
              </div>

              {/* Operating Expenses */}
              <div className="ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                <span className="text-white">Charges opérationnelles</span>
                <span className="font-semibold text-rose-400">
                  -{formatAmount(apiData.operatingExpenses)}
                </span>
              </div>

              {/* Operating Profit */}
              <div className="flex items-center justify-between rounded-lg bg-indigo-500/10 p-4">
                <div>
                  <span className="font-medium text-white">
                    Résultat opérationnel
                  </span>
                  <p className="text-xs text-indigo-400">
                    {apiData.operatingMargin.toFixed(1)}% du CA
                  </p>
                </div>
                <span className="text-xl font-bold text-indigo-400">
                  {formatAmount(apiData.operatingProfit)}
                </span>
              </div>

              {/* Other Income/Expenses */}
              {(apiData.otherIncome > 0 || apiData.otherExpenses > 0) && (
                <div className="ml-4 flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                  <span className="text-white">Autres revenus & charges</span>
                  <span className="font-semibold text-rose-400">
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
                  <span className="font-semibold text-white">Résultat net</span>
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
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Benchmark Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassPanel className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Comparaison benchmarks sectoriels
              </h2>
              <div className="space-y-4">
                {/* Gross Margin */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-400">Marge brute</span>
                    <span className="text-sm font-medium text-white">
                      {apiData.grossMargin.toFixed(1)}% vs {benchmarks.grossMargin}
                      %
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{
                        width: `${Math.min(
                          (apiData.grossMargin / benchmarks.grossMargin) * 100,
                          100
                        )}%`,
                      }}
                    />
                    <div
                      className="absolute inset-y-0 border-l-2 border-white/50"
                      style={{ left: "100%" }}
                    />
                  </div>
                  {apiData.grossMargin < benchmarks.grossMargin && (
                    <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      En dessous du benchmark sectoriel
                    </p>
                  )}
                </div>

                {/* Operating Margin */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Marge opérationnelle
                    </span>
                    <span className="text-sm font-medium text-white">
                      {apiData.operatingMargin.toFixed(1)}% vs{" "}
                      {benchmarks.operatingMargin}%
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-400"
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
                    <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      En dessous du benchmark sectoriel
                    </p>
                  )}
                </div>

                {/* Net Margin */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-400">Marge nette</span>
                    <span className="text-sm font-medium text-white">
                      {apiData.netMargin.toFixed(1)}% vs {benchmarks.netMargin}%
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-rose-400"
                      style={{
                        width: `${Math.min(
                          (apiData.netMargin / benchmarks.netMargin) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  {apiData.netMargin < benchmarks.netMargin && (
                    <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      En dessous du benchmark sectoriel
                    </p>
                  )}
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Summary Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassPanel className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Récapitulatif
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-4">
                  <span className="text-white">Total revenus</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatAmount(apiData.breakdown.totalIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                  <span className="text-white">Total dépenses</span>
                  <span className="text-lg font-bold text-rose-400">
                    {formatAmount(apiData.breakdown.totalExpenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-indigo-500/10 p-4">
                  <span className="text-white">Transactions analysées</span>
                  <span className="text-lg font-bold text-indigo-400">
                    {apiData.breakdown.transactionCount}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
