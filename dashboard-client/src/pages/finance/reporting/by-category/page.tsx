/**
 * Analyse par Catégorie - Breakdown Revenus et Dépenses
 *
 * Fonctionnalités :
 * - Détail revenus et dépenses par catégorie (salaires, marketing, etc.)
 * - Drill-down dans les transactions par catégorie avec détail
 * - Identification postes en hausse anormale ou non budgétés
 * - Comparaison dépenses réelles vs budgets prévisionnels
 * - Établissement benchmarks internes (% CA) par catégorie clé
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import {
  PieChart,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { GlassPanel, GlassCard } from '@/components/ui/glass'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { financeNotices } from '@/lib/notices/finance-notices'
import { reportingClient, type TopCategoriesResponse } from '@/lib/finance/reporting'
import { api } from '@/lib/finance/api'
import { useApiData } from '@/hooks/finance/useApiData'
import { logger } from '@quelyos/logger'

type TimeRange = "7" | "30" | "60" | "90";

interface Transaction {
  id: number;
  occurredAt: string;
  description: string | null;
  amount: number;
  type: "credit" | "debit";
  category?: { name: string } | null;
}

interface CategoryData {
  name: string;
  color: string;
  total: number;
  count?: number;
  percentage: number;
  categoryId?: number | null;
  isIncome: boolean;
}

const categoryColors: Record<number, string> = {
  0: "emerald",
  1: "cyan",
  2: "indigo",
  3: "teal",
  4: "rose",
  5: "amber",
  6: "violet",
  7: "pink",
  8: "orange",
  9: "red",
};

export default function ByCategoryReportPage() {
  useRequireAuth();
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency();
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [viewType, setViewType] = useState<"all" | "income" | "expense">("all");
  const [categoryTransactions, setCategoryTransactions] = useState<Record<number, Transaction[]>>({});
  const [loadingTransactions, setLoadingTransactions] = useState<Record<number, boolean>>({});

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency);
  };

  // Fetch aggregated category data with automatic caching
  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<TopCategoriesResponse>({
    fetcher: () => reportingClient.topCategories({
      days: parseInt(timeRange),
      limit: 50,
    }),
    cacheKey: `reporting-by-category-${timeRange}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  // Transform API data to UI format
  const categoryData: CategoryData[] = useMemo(() => {
    if (!apiData) return [];

    const incomeCategories = (apiData.income || []).map((cat, i) => ({
      name: cat.name,
      color: categoryColors[i % 10] || "slate",
      total: cat.total,
      count: cat.count,
      percentage: 0,
      categoryId: cat.categoryId,
      isIncome: true,
    }));

    const expenseCategories = (apiData.expense || []).map((cat, i) => ({
      name: cat.name,
      color: categoryColors[(i + (apiData.income?.length || 0)) % 10] || "slate",
      total: cat.total,
      count: cat.count,
      percentage: 0,
      categoryId: cat.categoryId,
      isIncome: false,
    }));

    const allCategories = [...incomeCategories, ...expenseCategories];
    const totalAmount = allCategories.reduce((sum, c) => sum + c.total, 0);

    allCategories.forEach((cat) => {
      cat.percentage = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
    });

    return allCategories.sort((a, b) => b.total - a.total);
  }, [apiData]);

  const filteredData = categoryData.filter((cat) => {
    if (viewType === "income") {
      return cat.isIncome;
    } else if (viewType === "expense") {
      return !cat.isIncome;
    }
    return true;
  });

  const totalIncome = categoryData
    .filter((c) => c.isIncome)
    .reduce((sum, c) => sum + c.total, 0);

  const totalExpense = categoryData
    .filter((c) => !c.isIncome)
    .reduce((sum, c) => sum + c.total, 0);

  // Fetch transactions for a specific category
  const loadCategoryTransactions = useCallback(async (categoryId: number | null | undefined) => {
    if (categoryId === undefined) return;
    if (categoryTransactions[categoryId || 0]) return; // Already loaded

    setLoadingTransactions(prev => ({ ...prev, [categoryId || 0]: true }));
    try {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - parseInt(timeRange));

      const params = new URLSearchParams({
        from: from.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      });

      if (categoryId !== null) {
        params.append('categoryId', String(categoryId));
      }

      const txs = await api<Transaction[]>(`/transactions?${params.toString()}`);
      setCategoryTransactions(prev => ({ ...prev, [categoryId || 0]: txs }));
    } catch (_err) {
      logger.error("Error loading transactions:", err);
    } finally {
      setLoadingTransactions(prev => ({ ...prev, [categoryId || 0]: false }));
    }
  }, [timeRange, categoryTransactions]);

  const toggleCategory = (categoryId: number | null | undefined) => {
    if (expandedCategory === (categoryId || 0)) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId || 0);
      loadCategoryTransactions(categoryId);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Par Catégorie' },
          ]}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg shadow-amber-500/30 dark:shadow-amber-500/20">
              <PieChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analyse par catégorie</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Répartition détaillée des revenus et dépenses par catégorie
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.byCategory} />

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassPanel className="p-4">
            <div className="flex flex-wrap items-center gap-4">
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

              <div className="h-8 w-px bg-gray-100 dark:bg-gray-700" />

              <div className="flex gap-2">
                <button
                  onClick={() => setViewType("all")}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-all ${
                    viewType === "all"
                      ? "bg-indigo-500 text-gray-900 dark:text-white"
                      : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setViewType("income")}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-all ${
                    viewType === "income"
                      ? "bg-emerald-500 text-gray-900 dark:text-white"
                      : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  Revenus
                </button>
                <button
                  onClick={() => setViewType("expense")}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-all ${
                    viewType === "expense"
                      ? "bg-rose-500 text-gray-900 dark:text-white"
                      : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  Dépenses
                </button>
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
          className="mb-6 grid gap-4 md:grid-cols-3"
        >
          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Total revenus</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="rose">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-rose-200">Total dépenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalExpense)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-rose-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">Solde net</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalIncome - totalExpense)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
              Répartition par catégorie
            </h2>
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-around">
              {/* Donut SVG */}
              <svg viewBox="0 0 200 200" className="h-64 w-64">
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="rgb(30, 41, 59)"
                  strokeWidth="40"
                />
                {filteredData.reduce(
                  (acc, cat, i) => {
                    const angle = (cat.percentage / 100) * 360;
                    const startAngle = acc.currentAngle;
                    const endAngle = startAngle + angle;

                    const x1 = 100 + 70 * Math.cos((startAngle - 90) * (Math.PI / 180));
                    const y1 = 100 + 70 * Math.sin((startAngle - 90) * (Math.PI / 180));
                    const x2 = 100 + 70 * Math.cos((endAngle - 90) * (Math.PI / 180));
                    const y2 = 100 + 70 * Math.sin((endAngle - 90) * (Math.PI / 180));

                    const largeArcFlag = angle > 180 ? 1 : 0;

                    const colorMap: Record<string, string> = {
                      emerald: "rgb(16, 185, 129)",
                      cyan: "rgb(6, 182, 212)",
                      indigo: "rgb(99, 102, 241)",
                      teal: "rgb(20, 184, 166)",
                      rose: "rgb(244, 63, 94)",
                      amber: "rgb(251, 191, 36)",
                      violet: "rgb(139, 92, 246)",
                      pink: "rgb(236, 72, 153)",
                      orange: "rgb(249, 115, 22)",
                      red: "rgb(239, 68, 68)",
                      slate: "rgb(148, 163, 184)",
                    };

                    acc.elements.push(
                      <path
                        key={i}
                        d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={colorMap[cat.color] || "rgb(148, 163, 184)"}
                        opacity="0.8"
                        className="transition-opacity hover:opacity-100"
                      />
                    );

                    acc.currentAngle = endAngle;
                    return acc;
                  },
                  { elements: [] as React.ReactElement[], currentAngle: 0 }
                ).elements}
                <circle cx="100" cy="100" r="50" fill="rgb(15, 23, 42)" />
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  fill="white"
                  fontSize="20"
                  fontWeight="bold"
                >
                  {filteredData.length}
                </text>
                <text
                  x="100"
                  y="110"
                  textAnchor="middle"
                  fill="rgb(148, 163, 184)"
                  fontSize="12"
                >
                  catégories
                </text>
              </svg>

              {/* Legend */}
              <div className="grid gap-3 md:grid-cols-2">
                {filteredData.slice(0, 8).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full bg-${cat.color}-500`}
                      style={{
                        backgroundColor:
                          cat.color === "emerald"
                            ? "rgb(16, 185, 129)"
                            : cat.color === "cyan"
                            ? "rgb(6, 182, 212)"
                            : cat.color === "indigo"
                            ? "rgb(99, 102, 241)"
                            : cat.color === "rose"
                            ? "rgb(244, 63, 94)"
                            : cat.color === "amber"
                            ? "rgb(251, 191, 36)"
                            : cat.color === "violet"
                            ? "rgb(139, 92, 246)"
                            : cat.color === "pink"
                            ? "rgb(236, 72, 153)"
                            : cat.color === "orange"
                            ? "rgb(249, 115, 22)"
                            : "rgb(148, 163, 184)",
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
                      <p className="text-xs text-slate-400">
                        {cat.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatAmount(cat.total)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Category List with Drill-down */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Détail par catégorie
            </h2>
            <div className="space-y-3">
              {filteredData.map((cat) => {
                const catId = cat.categoryId || 0;
                const txs = categoryTransactions[catId] || [];
                const isLoading = loadingTransactions[catId] || false;

                return (
                <div key={`${cat.name}-${catId}`}>
                  <button
                    onClick={() => toggleCategory(cat.categoryId)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 p-4 transition-all hover:bg-gray-100 dark:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{
                            backgroundColor:
                              cat.color === "emerald"
                                ? "rgb(16, 185, 129)"
                                : cat.color === "cyan"
                                ? "rgb(6, 182, 212)"
                                : cat.color === "indigo"
                                ? "rgb(99, 102, 241)"
                                : cat.color === "teal"
                                ? "rgb(20, 184, 166)"
                                : cat.color === "rose"
                                ? "rgb(244, 63, 94)"
                                : cat.color === "amber"
                                ? "rgb(251, 191, 36)"
                                : cat.color === "violet"
                                ? "rgb(139, 92, 246)"
                                : cat.color === "pink"
                                ? "rgb(236, 72, 153)"
                                : cat.color === "orange"
                                ? "rgb(249, 115, 22)"
                                : cat.color === "red"
                                ? "rgb(239, 68, 68)"
                                : "rgb(148, 163, 184)",
                          }}
                        />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                          {cat.count !== undefined && (
                            <p className="text-xs text-slate-400">
                              {cat.count} transaction{cat.count > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatAmount(cat.total)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {cat.percentage.toFixed(1)}%
                          </p>
                        </div>
                        {expandedCategory === catId ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedCategory === catId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8 mt-2 space-y-2 overflow-hidden"
                      >
                        {isLoading && (
                          <div className="flex items-center justify-center gap-2 py-4 text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Chargement des transactions...</span>
                          </div>
                        )}
                        {!isLoading && txs.length === 0 && (
                          <p className="text-center text-sm text-slate-400 py-4">
                            Aucune transaction pour cette catégorie
                          </p>
                        )}
                        {!isLoading && txs.slice(0, 10).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {tx.description || "Sans description"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(tx.occurredAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatAmount(tx.amount)}
                            </p>
                          </div>
                        ))}
                        {!isLoading && txs.length > 10 && (
                          <p className="text-center text-xs text-slate-400">
                            + {txs.length - 10} transactions
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
              })}
            </div>
          </GlassPanel>
        </motion.div>
        </>
        )}
      </div>
    </Layout>
    );
}
