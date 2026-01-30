

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import { ModularLayout } from "@/components/ModularLayout";
import {
  Clock,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
  Users,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { ExportDropdown } from "@/components/finance/reporting/ExportDropdown";
import { PageNotice } from "@/components/common";
import { ReliabilityBadge } from "@/components/kpis/ReliabilityBadge";
import { reportingClient, type DSOResponse, type DSOHistoryPoint } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";
import { formatDateForExport } from "@/lib/utils/export";
import { TrendChart } from "@/components/finance/charts/TrendChart";
import { financeNotices } from "@/lib/notices";

type TimeRange = "7" | "30" | "60" | "90";

export default function DSOReportPage() {
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
  } = useApiData<DSOResponse>({
    fetcher: () => reportingClient.dso({
      days: parseInt(timeRange),
    }),
    cacheKey: `reporting-dso-${timeRange}`,
    cacheTime: 5 * 60 * 1000,
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  const {
    data: historyData,
    loading: historyLoading,
  } = useApiData<{ months: number; data: DSOHistoryPoint[] }>({
    fetcher: () => reportingClient.dsoHistory({ months: historyMonths }),
    cacheKey: `dso-history-${historyMonths}`,
    cacheTime: 5 * 60 * 1000,
    deps: [historyMonths],
  });

  return (
    <ModularLayout>
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
            <div className="rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-cyan-500/30">
              <Clock className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                DSO - Délai d&apos;Encaissement Client
              </h1>
              <p className="text-sm text-slate-400">
                Days Sales Outstanding - Analyse des délais de paiement clients
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.dso} className="mb-6" />

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
              reportId="dso"
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
                        ? "bg-cyan-500 text-gray-900 dark:text-white"
                        : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {range}j
                  </button>
                ))}
              </div>
              {!loading && apiData && (
                <ExportDropdown
                  filename="dso-report"
                  reportTitle="Rapport DSO - Délai d'Encaissement Client"
                  onExport={() => {
                    const rows = [
                      ['Rapport DSO - Délai d\'Encaissement Client'],
                      ['Période', `${formatDateForExport(apiData.range.from)} - ${formatDateForExport(apiData.range.to)}`],
                      [],
                      ['Métriques Principales'],
                      ['DSO Moyen', `${apiData.dso} jours`],
                      ['Délai Moy. Paiement', `${apiData.avgPaymentDelay} jours`],
                      ['Créances en Cours', formatAmount(apiData.totalReceivables)],
                      ['CA Période', formatAmount(apiData.totalRevenue)],
                      ['Trend', apiData.trend],
                      [],
                      ['Répartition Factures'],
                      ['Payées', apiData.invoices.paid],
                      ['En Attente', apiData.invoices.pending],
                      ['En Retard', apiData.invoices.overdue],
                      [],
                      ['Top Clients - Créances'],
                      ['Client', 'Créances', 'Nb Factures'],
                      ...(apiData.byCustomer || []).map(c => [
                        c.customerName,
                        formatAmount(c.receivables),
                        c.invoiceCount
                      ])
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 grid gap-4 md:grid-cols-4"
        >
          <GlassCard className="p-4" gradient="cyan">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-cyan-200">DSO Moyen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.dso} jours
                </p>
                <p className="text-xs text-cyan-300 mt-1">
                  {apiData.trend === "improving" ? "↑ En amélioration" : apiData.trend === "worsening" ? "↓ En dégradation" : "→ Stable"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-cyan-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">
                  Créances en cours
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.totalReceivables)}
                </p>
                <p className="text-xs text-emerald-300 mt-1">
                  À encaisser
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="amber">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-amber-200">
                  Factures en retard
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.invoices.overdue}
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  Nécessite action
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">
                  Délai moy. paiement
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.avgPaymentDelay} jours
                </p>
                <p className="text-xs text-indigo-300 mt-1">
                  Réel constaté
                </p>
              </div>
              <FileText className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Health Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassPanel className={`p-6 ${apiData.dso <= 45 ? "bg-emerald-500/5" : apiData.dso <= 60 ? "bg-amber-500/5" : "bg-rose-500/5"}`}>
            <div className="flex items-start gap-3">
              {apiData.dso <= 45 ? (
                <TrendingUp className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-6 w-6 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                  {apiData.dso <= 45 ? "✅ DSO Sain" : apiData.dso <= 60 ? "⚠️ DSO Modéré" : "❌ DSO Élevé"}
                </h3>
                <p className="text-sm text-slate-300">
                  {apiData.dso <= 45
                    ? "Vos délais d'encaissement sont dans la norme TPE/PME (< 45 jours). Continuez à surveiller et relancer les retards rapidement."
                    : apiData.dso <= 60
                    ? "Vos délais d'encaissement sont modérés (45-60 jours). Envisagez de relancer plus activement les clients en retard."
                    : "Vos délais d'encaissement sont trop longs (> 60 jours). Action urgente : relances systématiques, pénalités de retard, conditions de paiement plus strictes."}
                </p>
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
            title="Évolution du DSO"
            subtitle="Tendance sur plusieurs mois"
            data={historyData.data}
            lines={[
              {
                dataKey: "dso",
                name: "DSO (jours)",
                color: "#06b6d4",
                format: (value) => `${value.toFixed(1)} jours`,
              },
            ]}
            height={250}
            showLegend={false}
            defaultMonths={historyMonths as 3 | 6 | 12}
            onMonthsChange={(months) => setHistoryMonths(months)}
          />
        </motion.div>
        )}

        {/* Top Customers by Receivables */}
        {!loading && !error && apiData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top 10 Clients - Créances en cours
              </h2>
            </div>

            {!apiData.byCustomer || apiData.byCustomer.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-400">Aucune créance client en cours</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-left text-sm font-medium text-slate-400">Client</th>
                      <th className="pb-3 text-right text-sm font-medium text-slate-400">Créances</th>
                      <th className="pb-3 text-right text-sm font-medium text-slate-400">Factures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiData.byCustomer?.map((customer, _idx) => (
                      <tr key={customer.customerId} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 text-gray-900 dark:text-white">{customer.customerName}</td>
                        <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                          {formatAmount(customer.receivables)}
                        </td>
                        <td className="py-3 text-right text-slate-400">
                          {customer.invoiceCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassPanel>
        </motion.div>
        )}

        {/* Invoice Status Breakdown */}
        {!loading && !error && apiData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Répartition des factures
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-emerald-500/10 p-4">
                <p className="mb-1 text-sm text-emerald-200">Payées</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {apiData.invoices.paid}
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-4">
                <p className="mb-1 text-sm text-amber-200">En attente</p>
                <p className="text-3xl font-bold text-amber-400">
                  {apiData.invoices.pending}
                </p>
              </div>
              <div className="rounded-lg bg-rose-500/10 p-4">
                <p className="mb-1 text-sm text-rose-200">En retard</p>
                <p className="text-3xl font-bold text-rose-400">
                  {apiData.invoices.overdue}
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
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
                  <strong>1. Relances automatiques</strong> - Mettez en place des relances automatiques à J+15, J+30 et J+45.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>2. Pénalités de retard</strong> - Appliquez systématiquement les pénalités de retard prévues par la loi.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>3. Conditions de paiement</strong> - Négociez des conditions plus courtes (Net 30 au lieu de Net 45).
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>4. Affacturage</strong> - Pour les gros clients, envisagez l&apos;affacturage pour améliorer la trésorerie.
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
        </>
        )}
      </div>
    </div>
    </ModularLayout>
    );
}
