

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel, GlassCard } from '@quelyos/ui/glass';
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { PageNotice } from "@/components/common";
import { reportingClient, type CombinedResponse, type DailyPoint } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";
import { financeNotices } from "@/lib/notices";

type TimeRange = "7" | "30" | "60" | "90";

type CashflowDataPoint = {
  date: string;
  dateLabel: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
  isForecast: boolean;
};

export default function CashflowReportPage() {
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
  } = useApiData<CombinedResponse>({
    fetcher: () => reportingClient.combined({
      days: parseInt(timeRange),
      horizonDays: 30, // 30 days forecast
    }),
    cacheKey: `reporting-cashflow-${timeRange}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  // Transform API data to chart format
  const data: CashflowDataPoint[] = apiData?.daily.map((d: DailyPoint) => {
    const dateObj = new Date(d.date);
    return {
      date: d.date,
      dateLabel: dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      income: d.credit + (d.plannedCredit || 0),
      expense: d.debit + (d.plannedDebit || 0),
      net: (d.credit - d.debit) + ((d.plannedCredit || 0) - (d.plannedDebit || 0)),
      balance: d.projectedBalance || d.balance || 0,
      isForecast: !!d.projectedBalance && !d.balance,
    };
  }) || [];

  const realData = data.filter(d => !d.isForecast);
  const forecastData = data.filter(d => d.isForecast);

  const totalIncome = realData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = realData.reduce((sum, d) => sum + d.expense, 0);
  const netFlow = totalIncome - totalExpense;
  const currentBalance = apiData?.currentBalance || 0;
  const forecastedBalance = apiData?.landingBalance || currentBalance;

  const maxIncome = Math.max(...data.map(d => d.income), 0);
  const maxExpense = Math.max(...data.map(d => d.expense), 0);
  const maxValue = Math.max(maxIncome, maxExpense, 1) * 1.1; // Ensure minimum of 1 to avoid division by zero

  return (
    
    <div className="p-4 md:p-8">
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
            to={ROUTES.FINANCE.DASHBOARD.REPORTING}
            className="mb-4 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg shadow-emerald-500/30">
              <DollarSign className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trésorerie</h1>
              <p className="text-sm text-slate-400">
                Analyse des flux, balance et prévisions sur 90 jours
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.cashflow} className="mb-6" />

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassPanel className="p-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-4 w-4 text-slate-400" />
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
                <AlertTriangle className="h-5 w-5 text-red-400" />
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
          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Revenus</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalIncome)}
                </p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="rose">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-rose-200">Dépenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalExpense)}
                </p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-rose-300" />
            </div>
          </GlassCard>

          <GlassCard
            className="p-4"
            gradient={netFlow >= 0 ? "indigo" : "amber"}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-cyan-200">Flux net</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(netFlow)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">Solde actuel</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(currentBalance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Waterfall Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Évolution de la trésorerie (réel + prévisions 30j)
            </h2>
            <div className="h-96">
              <svg viewBox="0 0 1000 400" className="h-full w-full">
                <defs>
                  <linearGradient id="balanceGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = (i / 4) * 350 + 25;
                  return (
                    <line
                      key={i}
                      x1="50"
                      y1={y}
                      x2="950"
                      y2={y}
                      stroke="rgb(51, 65, 85)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Balance line */}
                <path
                  d={data.length > 1 ? `M ${data.map((d, i) => {
                    const x = 50 + (i / (data.length - 1)) * 900;
                    const minBalance = Math.min(...data.map(x => x.balance));
                    const maxBalance = Math.max(...data.map(x => x.balance));
                    const balanceRange = maxBalance - minBalance;
                    const normalizedBalance = balanceRange > 0
                      ? (d.balance - minBalance) / balanceRange
                      : 0.5; // Center line if all balances are the same
                    const y = 375 - normalizedBalance * 350;
                    return `${i === 0 ? '' : 'L '}${x} ${y}`;
                  }).join(' ')}` : 'M 50 200'}
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

                {/* Income/Expense bars (sampled for readability) */}
                {data.length > 0 && data.filter((_, i) => i % Math.ceil(data.length / 30) === 0).map((d, i, arr) => {
                  const originalIndex = data.indexOf(d);
                  const x = data.length > 1
                    ? 50 + (originalIndex / (data.length - 1)) * 900
                    : 500; // Center if only one point
                  const barWidth = arr.length > 0 ? 900 / arr.length / 3 : 20;

                  const incomeHeight = Math.max(0, (d.income / maxValue) * 100);
                  const expenseHeight = Math.max(0, (d.expense / maxValue) * 100);

                  return (
                    <g key={i}>
                      {/* Income bar */}
                      <rect
                        x={x - barWidth / 2}
                        y={375 - incomeHeight}
                        width={barWidth / 2 - 1}
                        height={incomeHeight}
                        fill={d.isForecast ? "rgb(52, 211, 153)" : "rgb(16, 185, 129)"}
                        opacity={d.isForecast ? 0.6 : 0.8}
                      />
                      {/* Expense bar */}
                      <rect
                        x={x}
                        y={375 - expenseHeight}
                        width={barWidth / 2 - 1}
                        height={expenseHeight}
                        fill={d.isForecast ? "rgb(251, 146, 60)" : "rgb(244, 63, 94)"}
                        opacity={d.isForecast ? 0.6 : 0.8}
                      />
                    </g>
                  );
                })}

                {/* Axis labels */}
                {data.length > 0 && (
                  <>
                    <text x="10" y="30" fill="rgb(148, 163, 184)" fontSize="12">
                      {formatAmount(Math.max(...data.map(d => d.balance), 0))}
                    </text>
                    <text x="10" y="380" fill="rgb(148, 163, 184)" fontSize="12">
                      {formatAmount(Math.min(...data.map(d => d.balance), 0))}
                    </text>
                  </>
                )}

                {/* Legend */}
                <g transform="translate(750, 15)">
                  <rect x="0" y="0" width="15" height="15" fill="rgb(99, 102, 241)" />
                  <text x="20" y="12" fill="white" fontSize="12">Solde</text>
                  
                  <rect x="0" y="20" width="15" height="15" fill="rgb(16, 185, 129)" />
                  <text x="20" y="32" fill="white" fontSize="12">Revenus</text>
                  
                  <rect x="0" y="40" width="15" height="15" fill="rgb(244, 63, 94)" />
                  <text x="20" y="52" fill="white" fontSize="12">Dépenses</text>
                </g>
              </svg>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Forecast Alert */}
        {forecastedBalance < currentBalance * 0.7 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <GlassCard gradient="amber" className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Alerte prévision trésorerie
                  </p>
                  <p className="text-sm text-amber-200">
                    Votre solde prévisionnel à 30j ({formatAmount(forecastedBalance)}) est
                    inférieur de {((1 - forecastedBalance / currentBalance) * 100).toFixed(0)}%
                    à votre solde actuel. Anticipez vos flux entrants.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Daily breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Détail par jour (derniers 10 jours)
            </h2>
            <div className="space-y-3">
              {realData.slice(-10).reverse().map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{d.dateLabel}</p>
                    <p className="text-xs text-slate-400">
                      Solde: {formatAmount(d.balance)}
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-emerald-400">+{formatAmount(d.income)}</p>
                      <p className="text-xs text-emerald-300">Revenus</p>
                    </div>
                    <div className="text-right">
                      <p className="text-rose-400">-{formatAmount(d.expense)}</p>
                      <p className="text-xs text-rose-300">Dépenses</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${d.net >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {d.net >= 0 ? '+' : ''}{formatAmount(d.net)}
                      </p>
                      <p className="text-xs text-slate-400">Net</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
        </>
        )}
      </div>
    </div>
    
    );
}
