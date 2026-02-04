/**
 * DSO - Délai d'Encaissement Client
 *
 * Fonctionnalités :
 * - Calcul DSO (Days Sales Outstanding) moyen sur période sélectionnable
 * - Suivi créances clients et factures (payées, en attente, retard)
 * - Évolution historique du DSO avec graphique de tendance
 * - Top 10 clients par montant de créances en cours
 * - Recommandations d'amélioration du recouvrement
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
  Users,
  FileText,
} from 'lucide-react'
import { GlassPanel, GlassCard } from '@/components/ui/glass'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { ExportDropdown } from '@/components/finance/reporting/ExportDropdown'
import { ReliabilityBadge } from '@/components/kpis/ReliabilityBadge'
import { reportingClient, type DSOResponse, type DSOHistoryPoint } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { formatDateForExport } from '@/lib/utils/export'
import { TrendChart } from '@/components/finance/charts/TrendChart'
import { financeNotices } from '@/lib/notices/finance-notices'

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
    loading:_historyLoading,
  } = useApiData<{ months: number; data: DSOHistoryPoint[] }>({
    fetcher: () => reportingClient.dsoHistory({ months: historyMonths }),
    cacheKey: `dso-history-${historyMonths}`,
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
            { label: 'DSO' },
          ]}
        />

        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="![animation:none] flex items-center gap-3">
            <div className="![animation:none] rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/20">
              <Clock className="![animation:none] h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="![animation:none] text-3xl font-bold text-gray-900 dark:text-white">
                DSO - Délai d&apos;Encaissement Client
              </h1>
              <p className="![animation:none] text-sm text-gray-500 dark:text-gray-400">
                Days Sales Outstanding - Analyse des délais de paiement clients
              </p>
            </div>
          </div>
        </m.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.dso} className="![animation:none]" />

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
              reportId="dso"
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
          <GlassPanel className="![animation:none] p-4">
            <div className="![animation:none] flex items-center justify-between gap-4">
              <div className="![animation:none] flex gap-2">
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
          >
            <GlassCard className="![animation:none] border-red-400/40 bg-red-500/10 p-4">
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
          className="![animation:none] mb-6 grid gap-4 md:grid-cols-4"
        >
          <GlassCard className="![animation:none] p-4" gradient="cyan">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-cyan-200">DSO Moyen</p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.dso} jours
                </p>
                <p className="![animation:none] text-xs text-cyan-300 mt-1">
                  {apiData.trend === "improving" ? "↑ En amélioration" : apiData.trend === "worsening" ? "↓ En dégradation" : "→ Stable"}
                </p>
              </div>
              <Clock className="![animation:none] h-8 w-8 text-cyan-300" />
            </div>
          </GlassCard>

          <GlassCard className="![animation:none] p-4" gradient="emerald">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-emerald-200">
                  Créances en cours
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(apiData.totalReceivables)}
                </p>
                <p className="![animation:none] text-xs text-emerald-300 mt-1">
                  À encaisser
                </p>
              </div>
              <DollarSign className="![animation:none] h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="![animation:none] p-4" gradient="amber">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-amber-200">
                  Factures en retard
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.invoices.overdue}
                </p>
                <p className="![animation:none] text-xs text-amber-300 mt-1">
                  Nécessite action
                </p>
              </div>
              <AlertCircle className="![animation:none] h-8 w-8 text-amber-300" />
            </div>
          </GlassCard>

          <GlassCard className="![animation:none] p-4" gradient="indigo">
            <div className="![animation:none] flex items-center justify-between">
              <div>
                <p className="![animation:none] mb-1 text-sm text-indigo-200">
                  Délai moy. paiement
                </p>
                <p className="![animation:none] text-2xl font-bold text-gray-900 dark:text-white">
                  {apiData.avgPaymentDelay} jours
                </p>
                <p className="![animation:none] text-xs text-indigo-300 mt-1">
                  Réel constaté
                </p>
              </div>
              <FileText className="![animation:none] h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>
        </m.div>

        {/* Health Indicator */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="![animation:none] mb-6"
        >
          <GlassPanel className={`p-6 ${apiData.dso <= 45 ? "bg-emerald-500/5" : apiData.dso <= 60 ? "bg-amber-500/5" : "bg-rose-500/5"}`}>
            <div className="![animation:none] flex items-start gap-3">
              {apiData.dso <= 45 ? (
                <TrendingUp className="![animation:none] h-6 w-6 text-emerald-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="![animation:none] h-6 w-6 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <h3 className="![animation:none] mb-1 font-semibold text-gray-900 dark:text-white">
                  {apiData.dso <= 45 ? "✅ DSO Sain" : apiData.dso <= 60 ? "⚠️ DSO Modéré" : "❌ DSO Élevé"}
                </h3>
                <p className="![animation:none] text-sm text-slate-300">
                  {apiData.dso <= 45
                    ? "Vos délais d'encaissement sont dans la norme TPE/PME (< 45 jours). Continuez à surveiller et relancer les retards rapidement."
                    : apiData.dso <= 60
                    ? "Vos délais d'encaissement sont modérés (45-60 jours). Envisagez de relancer plus activement les clients en retard."
                    : "Vos délais d'encaissement sont trop longs (> 60 jours). Action urgente : relances systématiques, pénalités de retard, conditions de paiement plus strictes."}
                </p>
              </div>
            </div>
          </GlassPanel>
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
        </m.div>
        )}

        {/* Top Customers by Receivables */}
        {!loading && !error && apiData && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="![animation:none] mb-6"
        >
          <GlassPanel className="![animation:none] p-6">
            <div className="![animation:none] mb-4 flex items-center gap-2">
              <Users className="![animation:none] h-5 w-5 text-indigo-400" />
              <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white">
                Top 10 Clients - Créances en cours
              </h2>
            </div>

            {!apiData.byCustomer || apiData.byCustomer.length === 0 ? (
              <div className="![animation:none] py-8 text-center">
                <p className="![animation:none] text-slate-400">Aucune créance client en cours</p>
              </div>
            ) : (
              <div className="![animation:none] overflow-x-auto">
                <table className="![animation:none] w-full">
                  <thead>
                    <tr className="![animation:none] border-b border-gray-200 dark:border-gray-700">
                      <th className="![animation:none] pb-3 text-left text-sm font-medium text-slate-400">Client</th>
                      <th className="![animation:none] pb-3 text-right text-sm font-medium text-slate-400">Créances</th>
                      <th className="![animation:none] pb-3 text-right text-sm font-medium text-slate-400">Factures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiData.byCustomer?.map((customer, _idx) => (
                      <tr key={customer.customerId} className="![animation:none] border-b border-gray-200 dark:border-gray-700">
                        <td className="![animation:none] py-3 text-gray-900 dark:text-white">{customer.customerName}</td>
                        <td className="![animation:none] py-3 text-right font-semibold text-gray-900 dark:text-white">
                          {formatAmount(customer.receivables)}
                        </td>
                        <td className="![animation:none] py-3 text-right text-slate-400">
                          {customer.invoiceCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassPanel>
        </m.div>
        )}

        {/* Invoice Status Breakdown */}
        {!loading && !error && apiData && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="![animation:none] mb-6"
        >
          <GlassPanel className="![animation:none] p-6">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Répartition des factures
            </h2>
            <div className="![animation:none] grid gap-4 md:grid-cols-3">
              <div className="![animation:none] rounded-lg bg-emerald-500/10 p-4">
                <p className="![animation:none] mb-1 text-sm text-emerald-200">Payées</p>
                <p className="![animation:none] text-3xl font-bold text-emerald-400">
                  {apiData.invoices.paid}
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-amber-500/10 p-4">
                <p className="![animation:none] mb-1 text-sm text-amber-200">En attente</p>
                <p className="![animation:none] text-3xl font-bold text-amber-400">
                  {apiData.invoices.pending}
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-rose-500/10 p-4">
                <p className="![animation:none] mb-1 text-sm text-rose-200">En retard</p>
                <p className="![animation:none] text-3xl font-bold text-rose-400">
                  {apiData.invoices.overdue}
                </p>
              </div>
            </div>
          </GlassPanel>
        </m.div>
        )}

        {/* Recommendations */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassPanel className="![animation:none] p-6" gradient="violet">
            <h2 className="![animation:none] mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              💡 Recommandations
            </h2>
            <div className="![animation:none] space-y-3">
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>1. Relances automatiques</strong> - Mettez en place des relances automatiques à J+15, J+30 et J+45.
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>2. Pénalités de retard</strong> - Appliquez systématiquement les pénalités de retard prévues par la loi.
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>3. Conditions de paiement</strong> - Négociez des conditions plus courtes (Net 30 au lieu de Net 45).
                </p>
              </div>
              <div className="![animation:none] rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="![animation:none] text-sm text-gray-900 dark:text-white">
                  <strong>4. Affacturage</strong> - Pour les gros clients, envisagez l&apos;affacturage pour améliorer la trésorerie.
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
