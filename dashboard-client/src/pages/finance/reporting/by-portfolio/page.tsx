/**
 * Analyse par Portefeuille - Vue Consolidée par Groupes
 *
 * Fonctionnalités :
 * - Consolidation comptes en portefeuilles (entité, projet, filiale)
 * - Comparaison performance relative de chaque portefeuille
 * - Identification portefeuilles rentables vs déficitaires
 * - Suivi flux inter-portefeuilles (prêts, transferts, refacturations)
 * - Vue consolidée groupe avec détail par entité
 */
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { GlassPanel, GlassCard } from '@/components/ui/glass'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { reportingClient, type ByPortfolioResponse } from '@/lib/finance/reporting'
import { useApiData } from '@/hooks/finance/useApiData'
import { financeNotices } from '@/lib/notices/finance-notices'

type TimeRange = "7" | "30" | "60" | "90";

interface PortfolioData {
  id: number;
  name: string;
  accountsCount: number;
  balance: number;
  evolution: number;
  movements: number;
  totalCredit: number;
  totalDebit: number;
  avgIncome: number;
  avgExpense: number;
  color: string;
}

const portfolioColors = ["indigo", "emerald", "cyan", "violet", "rose", "amber"];

export default function ByPortfolioReportPage() {
  useRequireAuth();
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency();
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency);
  };

  // Fetch data from API with automatic caching
  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<ByPortfolioResponse>({
    fetcher: () => reportingClient.byPortfolio({
      days: parseInt(timeRange),
    }),
    cacheKey: `reporting-by-portfolio-${timeRange}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  // Transform API data to UI format
  const portfolios: PortfolioData[] = useMemo(() => {
    if (!apiData) return [];

    return apiData.portfolios.map((p, index) => ({
      id: p.portfolioId,
      name: p.portfolioName,
      accountsCount: p.accountsCount,
      balance: p.balance,
      evolution: p.evolution,
      movements: p.movements,
      totalCredit: p.totalCredit,
      totalDebit: p.totalDebit,
      avgIncome: p.movements > 0 ? p.totalCredit / p.movements : 0,
      avgExpense: p.movements > 0 ? p.totalDebit / p.movements : 0,
      color: portfolioColors[index % portfolioColors.length],
    }));
  }, [apiData]);

  const totalBalance = portfolios.reduce((sum, p) => sum + p.balance, 0);
  const totalMovements = portfolios.reduce((sum, p) => sum + p.movements, 0);
  const totalAccounts = portfolios.reduce((sum, p) => sum + p.accountsCount, 0);

  const colorClasses: Record<string, string> = {
    indigo:
      "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30",
    emerald:
      "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30",
    cyan: "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30",
    violet:
      "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30",
    rose: "bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/30",
    amber: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30",
  };

  const _selectedPortfolioData = selectedPortfolio
    ? portfolios.find((p) => p.id === selectedPortfolio)
    : null;

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Reporting', href: '/finance/reporting' },
            { label: 'Par Portefeuille' },
          ]}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3 shadow-lg shadow-violet-500/30 dark:shadow-violet-500/20">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analyse par portefeuille
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vue consolidée par groupes de comptes et performance globale
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.byPortfolio} className="mb-6" />

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
                        ? "bg-violet-500 text-gray-900 dark:text-white"
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
            role="alert"
          >
            <GlassCard className="border-red-400/40 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
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

        {/* KPIs globaux */}
        {!loading && !error && apiData && (
        <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 grid gap-4 md:grid-cols-3"
        >
          <GlassCard className="p-4" gradient="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-purple-200">Balance totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalBalance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">Comptes totaux</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAccounts}</p>
              </div>
              <Briefcase className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Mouvements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalMovements}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Liste des portefeuilles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {portfolios.map((portfolio, idx) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
            >
              <div
                className="cursor-pointer"
                onClick={() =>
                  setSelectedPortfolio(
                    selectedPortfolio === portfolio.id ? null : portfolio.id
                  )
                }
              >
                <GlassCard className="p-6 transition-all hover:scale-[1.01]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-full p-3 shadow-lg ${
                          colorClasses[portfolio.color]
                        }`}
                      >
                        <Briefcase className="h-6 w-6 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {portfolio.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {portfolio.accountsCount} compte
                          {portfolio.accountsCount > 1 ? "s" : ""} •{" "}
                          {portfolio.movements} mouvements
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {formatAmount(portfolio.balance)}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          portfolio.evolution >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {portfolio.evolution >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {portfolio.evolution >= 0 ? "+" : ""}
                        {portfolio.evolution.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Détails étendus si sélectionné */}
                  {selectedPortfolio === portfolio.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-1 text-sm text-slate-400">
                            Revenus moyens
                          </p>
                          <p className="text-lg font-semibold text-emerald-400">
                            {formatAmount(portfolio.avgIncome)}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-sm text-slate-400">
                            Dépenses moyennes
                          </p>
                          <p className="text-lg font-semibold text-red-400">
                            {formatAmount(portfolio.avgExpense)}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-sm text-slate-400">
                            Taux d&apos;épargne
                          </p>
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-indigo-400" />
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {(
                                ((portfolio.avgIncome - portfolio.avgExpense) /
                                  portfolio.avgIncome) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-sm text-slate-400">
                            Solde net mensuel
                          </p>
                          <p
                            className={`text-lg font-semibold ${
                              portfolio.avgIncome - portfolio.avgExpense >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {formatAmount(
                              portfolio.avgIncome - portfolio.avgExpense
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          ))}
        </motion.div>
        </>
        )}
      </div>
    </Layout>
    );
}
