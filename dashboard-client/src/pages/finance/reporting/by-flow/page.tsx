/**
 * Analyse par Flux - Récurrent vs One-shot, Fixes vs Variables
 *
 * Fonctionnalités :
 * - Segmentation flux : récurrent vs one-shot, fixes vs variables
 * - Analyse prévisibilité de l'activité (poids des revenus récurrents)
 * - Suivi ratio charges fixes/variables pour maintenir flexibilité
 * - Identification opportunités transformation one-shot en récurrent
 * - Recommandations d'optimisation structure de coûts
 */
import React, { useMemo, useState } from 'react'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { reportingClient, type ByFlowResponse } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { GlassCard, GlassStatCard, GlassPanel, GlassListItem } from '@/components/ui/glass'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Filter, Loader2, AlertCircle, CreditCard, Banknote, FileText, ArrowLeftRight, Landmark, Receipt, Briefcase, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { FlowType } from '@/types/paymentFlow'
import { financeNotices } from '@/lib/notices/finance-notices'

// Icônes par type de flux (FlowType inclut PaymentMethod + TransactionCategory)
const FLOW_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="![animation:none] h-5 w-5" />,
  CARD: <CreditCard className="![animation:none] h-5 w-5" />,
  CHECK: <FileText className="![animation:none] h-5 w-5" />,
  TRANSFER: <ArrowLeftRight className="![animation:none] h-5 w-5" />,
  DIRECT_DEBIT: <Landmark className="![animation:none] h-5 w-5" />,
  BILL_OF_EXCHANGE: <Receipt className="![animation:none] h-5 w-5" />,
  PROMISSORY_NOTE: <Briefcase className="![animation:none] h-5 w-5" />,
  BANK_CHARGE: <AlertCircle className="![animation:none] h-5 w-5" />,
  MOBILE: <CreditCard className="![animation:none] h-5 w-5" />,
  WIRE_TRANSFER: <ArrowLeftRight className="![animation:none] h-5 w-5" />,
  OTHER: <MoreHorizontal className="![animation:none] h-5 w-5" />,
};

// Couleurs pour le graphique
const FLOW_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
];

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="![animation:none] rounded-lg border border-gray-300 dark:border-gray-600 bg-slate-900/95 px-3 py-2 text-sm shadow-xl backdrop-blur-sm">
      {label && <p className="![animation:none] mb-1 font-medium text-gray-900 dark:text-white">{label}</p>}
      {payload.map((item, idx) => (
        <p key={idx} className="![animation:none] flex items-center gap-2 text-indigo-100">
          <span
            className="![animation:none] h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color || "#6366f1" }}
          />
          <span>{item.name || item.dataKey}:</span>
          <span className="![animation:none] font-semibold">
            {formatter ? formatter(item.value) : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function ReportingByFlowPage() {
  useRequireAuth();
  const { baseCurrency, formatAmount } = useCurrency();

  const money0 = useMemo(
    () => (amount: number) => formatAmount(amount, baseCurrency),
    [formatAmount, baseCurrency]
  );

  const [days, setDays] = useState(30);

  // Fetch data with automatic caching
  const {
    data,
    loading,
    error: apiError,
    refetch,
  } = useApiData<ByFlowResponse>({
    fetcher: () => reportingClient.byFlow({ days }),
    cacheKey: `reporting-by-flow-${days}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [days],
  });

  const error = apiError?.message || null;

  // Données pour le graphique en barres
  const barChartData = useMemo(() => {
    if (!data) return [];
    return data.flows.map((f, idx) => ({
      name: f.flowName,
      credit: f.totalCredit,
      debit: f.totalDebit,
      net: f.net,
      color: FLOW_COLORS[idx % FLOW_COLORS.length],
    }));
  }, [data]);

  // Données pour le camembert (par volume)
  const pieChartData = useMemo(() => {
    if (!data) return [];
    const result = data.flows.map((f, idx) => ({
      name: f.flowName,
      value: f.volume,
      color: FLOW_COLORS[idx % FLOW_COLORS.length],
    }));
    if (data.noFlow.count > 0) {
      result.push({
        name: "Non assigné",
        value: data.noFlow.totalCredit + data.noFlow.totalDebit,
        color: "#64748b",
      });
    }
    return result;
  }, [data]);

  return (
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Par Flux' },
          ]}
        />

        {/* Header */}
        <div>
          <div className="![animation:none] flex items-center gap-3">
            <div className="![animation:none] rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/20">
              <TrendingUp className="![animation:none] h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="![animation:none] text-3xl font-bold text-gray-900 dark:text-white">Analyse par flux de paiement</h1>
              <p className="![animation:none] text-sm text-gray-500 dark:text-gray-400">Répartition par type de flux (CB, virement, chèque, etc.)</p>
            </div>
          </div>
        </div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.byFlow} className="![animation:none]" />

        <div className="![animation:none] space-y-6">
          {error && (
            <GlassCard variant="subtle" className="![animation:none] flex items-center gap-2 border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <AlertCircle className="![animation:none] h-4 w-4" />
              <span>{error}</span>
              <button
                onClick={refetch}
                className="![animation:none] ml-auto rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-900 dark:text-white hover:bg-gray-200 dark:bg-gray-700 transition"
              >
                Réessayer
              </button>
            </GlassCard>
          )}

          {/* Filtres */}
          <div className="![animation:none] relative flex items-center gap-3">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="![animation:none] rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white backdrop-blur-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={60}>60 jours</option>
          <option value={90}>90 jours</option>
          <option value={180}>6 mois</option>
          <option value={365}>1 an</option>
        </select>

        <button
          onClick={refetch}
          disabled={loading}
          className="![animation:none] inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white backdrop-blur-sm transition hover:bg-gray-100 dark:bg-gray-700 hover:shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="![animation:none] animate-spin" /> : <Filter size={16} />}
          Actualiser
            </button>
          </div>

          {loading && (
            <GlassCard className="![animation:none] grid gap-4 p-4">
              <div className="![animation:none] h-6 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              <div className="![animation:none] h-32 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            </GlassCard>
          )}

          {!loading && data && (
            <>
              {/* KPIs globaux */}
              <div className="![animation:none] grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassStatCard
                  label="Total crédits"
                  value={money0(data.totalCredit)}
                  icon={<ArrowUpRight className="![animation:none] h-5 w-5 text-emerald-400" />}
                />
                <GlassStatCard
                  label="Total débits"
                  value={money0(data.totalDebit)}
                  icon={<ArrowDownRight className="![animation:none] h-5 w-5 text-red-400" />}
                />
                <GlassStatCard
                  label="Solde net"
                  value={money0(data.net)}
                  icon={data.net >= 0 ? <TrendingUp className="![animation:none] h-5 w-5 text-emerald-400" /> : <TrendingDown className="![animation:none] h-5 w-5 text-red-400" />}
                />
                <GlassStatCard
                  label="Transactions"
                  value={data.totalCount.toString()}
                  icon={<CreditCard className="![animation:none] h-5 w-5 text-indigo-400" />}
                />
              </div>

              {/* Graphiques */}
              <div className="![animation:none] grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart */}
                <GlassCard className="![animation:none] p-6">
                  <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-4">Crédits vs Débits par flux</h2>
                  {barChartData.length > 0 ? (
                    <div className="![animation:none] h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis type="number" stroke="rgba(255,255,255,0.5)" tickFormatter={(v) => money0(v)} />
                          <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" width={120} />
                          <RechartsTooltip content={<CustomTooltip formatter={(v) => money0(v)} />} />
                          <Bar dataKey="credit" name="Crédits" fill="#10b981" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="debit" name="Débits" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="![animation:none] h-80 flex items-center justify-center text-gray-500 dark:text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </GlassCard>

                {/* Pie chart */}
                <GlassCard className="![animation:none] p-6">
                  <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition par volume</h2>
                  {pieChartData.length > 0 ? (
                    <div className="![animation:none] h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                            labelLine={{ stroke: "rgba(255,255,255,0.3)" }}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip formatter={(v) => money0(v)} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="![animation:none] h-80 flex items-center justify-center text-gray-500 dark:text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Liste détaillée des flux */}
              <GlassCard className="![animation:none] p-6">
                <h2 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-4">Détail par flux</h2>
                <div className="![animation:none] space-y-3">
                  {data.flows.length === 0 && data.noFlow.count === 0 ? (
                    <div className="![animation:none] text-center py-8 text-gray-500 dark:text-gray-500">
                      Aucune transaction avec flux assigné
                    </div>
                  ) : (
                    <>
                      {data.flows.map((flow, idx) => (
                        <GlassListItem key={flow.flowId} className="![animation:none] p-4">
                          <div className="![animation:none] flex items-center justify-between">
                            <div className="![animation:none] flex items-center gap-4">
                              <div 
                                className="![animation:none] p-2 rounded-lg"
                                style={{ backgroundColor: `${FLOW_COLORS[idx % FLOW_COLORS.length]}20` }}
                              >
                                <span style={{ color: FLOW_COLORS[idx % FLOW_COLORS.length] }}>
                                  {FLOW_ICONS[flow.flowType as FlowType] || <MoreHorizontal className="![animation:none] h-5 w-5" />}
                                </span>
                              </div>
                              <div>
                                <p className="![animation:none] font-medium text-gray-900 dark:text-white">{flow.flowName}</p>
                                <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">{flow.count} transaction{flow.count > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="![animation:none] text-right">
                              <div className="![animation:none] flex items-center gap-4">
                                <div>
                                  <p className="![animation:none] text-sm text-emerald-400">+{money0(flow.totalCredit)}</p>
                                  <p className="![animation:none] text-sm text-red-400">-{money0(flow.totalDebit)}</p>
                                </div>
                                <div className={`text-lg font-semibold ${flow.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {flow.net >= 0 ? '+' : ''}{money0(flow.net)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Mini aperçu des transactions */}
                          {flow.transactions.length > 0 && (
                            <div className="![animation:none] mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="![animation:none] text-xs text-white/50 mb-2">Dernières transactions</p>
                              <div className="![animation:none] space-y-1">
                                {flow.transactions.slice(0, 3).map((tx) => (
                                  <div key={tx.id} className="![animation:none] flex items-center justify-between text-sm">
                                    <span className="![animation:none] text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{tx.description || 'Sans description'}</span>
                                    <span className={tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}>
                                      {tx.type === 'credit' ? '+' : '-'}{money0(tx.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </GlassListItem>
                      ))}
                      
                      {/* Transactions sans flux */}
                      {data.noFlow.count > 0 && (
                        <GlassListItem className="![animation:none] p-4 border-gray-200 dark:border-gray-700">
                          <div className="![animation:none] flex items-center justify-between">
                            <div className="![animation:none] flex items-center gap-4">
                              <div className="![animation:none] p-2 rounded-lg bg-slate-500/20">
                                <MoreHorizontal className="![animation:none] h-5 w-5 text-slate-400" />
                              </div>
                              <div>
                                <p className="![animation:none] font-medium text-gray-600 dark:text-gray-400">Non assigné</p>
                                <p className="![animation:none] text-sm text-gray-500 dark:text-gray-500">{data.noFlow.count} transaction{data.noFlow.count > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="![animation:none] text-right">
                              <div className="![animation:none] flex items-center gap-4">
                                <div>
                                  <p className="![animation:none] text-sm text-emerald-400/70">+{money0(data.noFlow.totalCredit)}</p>
                                  <p className="![animation:none] text-sm text-red-400/70">-{money0(data.noFlow.totalDebit)}</p>
                                </div>
                                <div className={`text-lg font-semibold ${data.noFlow.net >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                  {data.noFlow.net >= 0 ? '+' : ''}{money0(data.noFlow.net)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </GlassListItem>
                      )}
                    </>
                  )}
                </div>
              </GlassCard>

              {/* Info */}
              <GlassPanel className="![animation:none] p-4 border-indigo-500/30 bg-indigo-500/10">
                <div className="![animation:none] flex gap-3">
                  <AlertCircle className="![animation:none] h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="![animation:none] text-sm text-gray-700 dark:text-gray-300">
                    <p className="![animation:none] font-medium text-indigo-300 mb-1">Astuce</p>
                    <p>
                      Pour assigner un flux à vos transactions, modifiez vos dépenses ou revenus 
                      et sélectionnez le flux de paiement approprié. Vous pouvez gérer vos flux 
                      depuis la page de détail de chaque compte.
                    </p>
                  </div>
                </div>
              </GlassPanel>
            </>
          )}
        </div>
      </div>
    </Layout>
    );
}
