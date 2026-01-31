

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  Users,
  Building2,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel, GlassCard } from '@quelyos/ui/glass';
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { ExportDropdown } from "@/components/finance/reporting/ExportDropdown";
import { PageNotice } from "@/components/common";
import { ReliabilityBadge } from "@/components/kpis/ReliabilityBadge";
import { reportingClient, type BFRResponse, type BFRHistoryPoint } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";
import { formatDateForExport } from "@/lib/utils/export";
import { TrendChart } from "@/components/finance/charts/TrendChart";
import { financeNotices } from "@/lib/notices";

type TimeRange = "7" | "30" | "60" | "90";

export default function BFRReportPage() {
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
  } = useApiData<BFRResponse>({
    fetcher: () => reportingClient.bfr({
      days: parseInt(timeRange),
    }),
    cacheKey: `reporting-bfr-${timeRange}`,
    cacheTime: 5 * 60 * 1000,
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  const {
    data: historyData,
    loading: historyLoading,
  } = useApiData<{ months: number; data: BFRHistoryPoint[] }>({
    fetcher: () => reportingClient.bfrHistory({ months: historyMonths }),
    cacheKey: `bfr-history-${historyMonths}`,
    cacheTime: 5 * 60 * 1000,
    deps: [historyMonths],
  });

  return (
    
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <ReportingNav />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to={ROUTES.FINANCE.DASHBOARD.REPORTING}
            className="mb-4 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg shadow-amber-500/30">
              <Wallet className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                BFR - Besoin en Fonds de Roulement
              </h1>
              <p className="text-sm text-slate-400">
                Working Capital Requirement - Analyse du cycle d&apos;exploitation
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.bfr} className="mb-6" />

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
              reportId="bfr"
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
                        ? "bg-amber-500 text-gray-900 dark:text-white"
                        : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
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
                      ['Période', `${formatDateForExport(apiData.range.from)} - ${formatDateForExport(apiData.range.to)}`],
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
            role="alert"
          >
            <GlassCard className="border-red-400/40 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
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
          className="mb-6 grid gap-4 md:grid-cols-4"
        >
          <GlassCard className="p-4" gradient="amber">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-amber-200">BFR Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.bfr)}
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  {apiData.bfrDays} jours de CA
                </p>
              </div>
              <Wallet className="h-8 w-8 text-amber-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">
                  Créances clients
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.components.receivables)}
                </p>
                <p className="text-xs text-emerald-300 mt-1">
                  À encaisser
                </p>
              </div>
              <Users className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="rose">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-rose-200">
                  Dettes fournisseurs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.components.payables)}
                </p>
                <p className="text-xs text-rose-300 mt-1">
                  À payer
                </p>
              </div>
              <Building2 className="h-8 w-8 text-rose-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">
                  Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.components.inventory)}
                </p>
                <p className="text-xs text-indigo-300 mt-1">
                  {apiData.components.inventory === 0 ? "Non tracé" : "Valeur"}
                </p>
              </div>
              <Package className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Historical Trend */}
        {!loading && !error && historyData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <TrendChart
            title="Évolution du BFR"
            subtitle="Besoin en fonds de roulement sur plusieurs mois"
            data={historyData.data}
            lines={[
              {
                dataKey: "bfr",
                name: "BFR",
                color: "#8b5cf6",
                format: (value) => formatAmount(value),
              },
              {
                dataKey: "ratio",
                name: "BFR/CA (%)",
                color: "#f59e0b",
                format: (value) => `${value.toFixed(1)}%`,
              },
            ]}
            height={250}
            defaultMonths={historyMonths as 3 | 6 | 12}
            onMonthsChange={(months) => setHistoryMonths(months)}
          />
        </motion.div>
        )}

        {/* Health Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassPanel className={`p-6 ${apiData.bfrDays < 30 ? "bg-emerald-500/5" : apiData.bfrDays < 60 ? "bg-amber-500/5" : "bg-rose-500/5"}`}>
            <div className="flex items-start gap-3">
              {apiData.bfrDays < 30 ? (
                <TrendingUp className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              ) : apiData.bfrDays < 60 ? (
                <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-6 w-6 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                  {apiData.bfrDays < 30
                    ? "✅ BFR Sain"
                    : apiData.bfrDays < 60
                    ? "⚠️ BFR Modéré"
                    : "❌ BFR Élevé"}
                </h3>
                <p className="text-sm text-slate-300">
                  {apiData.recommendation}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Trend: {apiData.trend === "decreasing" ? "↓ En réduction" : apiData.trend === "increasing" ? "↑ En hausse" : "→ Stable"}
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* BFR Formula Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Calcul du BFR
            </h2>
            <div className="space-y-4">
              {/* Receivables */}
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Créances clients
                  </span>
                </div>
                <span className="text-xl font-bold text-emerald-400">
                  +{formatAmount(apiData.components.receivables)}
                </span>
              </div>

              {/* Inventory */}
              <div className="flex items-center justify-between rounded-lg bg-indigo-500/10 p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-indigo-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Stock</span>
                </div>
                <span className="text-xl font-bold text-indigo-400">
                  +{formatAmount(apiData.components.inventory)}
                </span>
              </div>

              {/* Payables */}
              <div className="flex items-center justify-between rounded-lg bg-rose-500/10 p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-rose-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Dettes fournisseurs
                  </span>
                </div>
                <span className="text-xl font-bold text-rose-400">
                  -{formatAmount(apiData.components.payables)}
                </span>
              </div>

              {/* BFR Result */}
              <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-5 border-2 border-amber-500/50">
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-amber-400" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    BFR = Créances + Stock - Dettes
                  </span>
                </div>
                <span className="text-2xl font-bold text-amber-400">
                  {formatAmount(apiData.bfr)}
                </span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* BFR Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Métriques BFR
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <p className="mb-2 text-sm text-slate-400">BFR en jours de CA</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {apiData.bfrDays}
                </p>
                <p className="text-xs text-slate-400">
                  Nombre de jours de chiffre d&apos;affaires immobilisés
                </p>
                <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                    style={{ width: `${Math.min((apiData.bfrDays / 90) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <p className="mb-2 text-sm text-slate-400">Ratio BFR / CA</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {apiData.ratio.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">
                  Pourcentage du CA immobilisé dans le cycle d&apos;exploitation
                </p>
                <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                    style={{ width: `${Math.min(apiData.ratio, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Cycle Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Cycle d&apos;exploitation
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 dark:text-white font-medium">1. Achats fournisseurs</span>
                  <span className="text-slate-400">Délai de paiement DPO</span>
                </div>
                <p className="text-xs text-slate-400">
                  Temps entre la réception de la facture et le paiement fournisseur
                </p>
              </div>

              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 dark:text-white font-medium">2. Stock (si applicable)</span>
                  <span className="text-slate-400">Rotation des stocks</span>
                </div>
                <p className="text-xs text-slate-400">
                  Temps de détention du stock avant vente
                </p>
              </div>

              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 dark:text-white font-medium">3. Ventes clients</span>
                  <span className="text-slate-400">Délai d&apos;encaissement DSO</span>
                </div>
                <p className="text-xs text-slate-400">
                  Temps entre l&apos;émission de la facture et l&apos;encaissement client
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-gray-900 dark:text-white">
                <strong>BFR = DSO + Rotation stock - DPO</strong>
              </p>
              <p className="text-xs text-amber-200 mt-1">
                Plus le cycle est court, moins vous avez besoin de financement pour le faire tourner.
              </p>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <GlassPanel className="p-6" gradient="violet">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              💡 Comment optimiser le BFR
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>1. Réduire le DSO</strong> - Relances clients, pénalités de retard, acomptes, facturation immédiate.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>2. Négocier le DPO</strong> - Allonger les délais de paiement fournisseurs (sans dégrader la relation).
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>3. Optimiser le stock</strong> - Flux tendu, rotation rapide, commandes just-in-time.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>4. Affacturage</strong> - Céder les créances clients à un factor pour encaisser immédiatement.
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
