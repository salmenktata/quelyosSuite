

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ModularLayout } from "@/components/ModularLayout";
import {
  Wallet,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Briefcase,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { PageNotice } from "@/components/common";
import { reportingClient, type ByAccountResponse, type AccountDetail } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";
import { financeNotices } from "@/lib/notices";

type TimeRange = "7" | "30" | "60" | "90";

interface AccountData {
  id: number;
  name: string;
  portfolio?: string | null;
  balance: number;
  movements: number;
  avgIncome: number;
  avgExpense: number;
  evolution: number;
  totalCredit: number;
  totalDebit: number;
  color: string;
}

const accountColors = ["indigo", "emerald", "cyan", "violet", "rose", "amber"];

export default function ByAccountReportPage() {
  useRequireAuth();
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency();
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency);
  };

  // Fetch data from API with automatic caching
  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<ByAccountResponse>({
    fetcher: () => reportingClient.byAccount({
      days: parseInt(timeRange),
    }),
    cacheKey: `reporting-by-account-${timeRange}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [timeRange],
  });

  const error = apiError?.message || null;

  // Transform API data to UI format
  const accounts: AccountData[] = useMemo(() => {
    if (!apiData) return [];

    return apiData.accounts.map((acc, index) => ({
      id: acc.accountId,
      name: acc.accountName,
      portfolio: acc.portfolioName,
      balance: acc.balance,
      movements: acc.movements,
      avgIncome: acc.avgIncome,
      avgExpense: acc.avgExpense,
      evolution: acc.evolution,
      totalCredit: acc.totalCredit,
      totalDebit: acc.totalDebit,
      color: accountColors[index % accountColors.length],
    }));
  }, [apiData]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalMovements = accounts.reduce((sum, acc) => sum + acc.movements, 0);
  const avgEvolution = accounts.length > 0
    ? accounts.reduce((sum, acc) => sum + acc.evolution, 0) / accounts.length
    : 0;

  const _selectedAccountData = selectedAccount
    ? accounts.find((a) => a.id === selectedAccount)
    : null;

  const typeLabels: Record<string, string> = {
    checking: "Compte courant",
    savings: "Épargne",
    business: "Professionnel",
  };

  return (
    <ModularLayout>
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
            <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-3 shadow-lg shadow-violet-500/30">
              <Wallet className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analyse par compte bancaire</h1>
              <p className="text-sm text-slate-400">
                Performance, mouvements et évolution des soldes par compte
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <PageNotice config={financeNotices.byAccount} className="mb-6" />

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
          <GlassPanel className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">Solde total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalBalance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassPanel>

          <GlassCard className="p-4" gradient="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Comptes actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
              </div>
              <Wallet className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-cyan-200">Mouvements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMovements}</p>
              </div>
              <CreditCard className="h-8 w-8 text-cyan-300" />
            </div>
          </GlassCard>

          <GlassCard
            className="p-4"
            gradient={avgEvolution >= 0 ? "emerald" : "rose"}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Évolution moy.</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {avgEvolution >= 0 ? "+" : ""}
                  {avgEvolution.toFixed(1)}%
                </p>
              </div>
              {avgEvolution >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-300" />
              ) : (
                <TrendingDown className="h-8 w-8 text-rose-300" />
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Accounts by Portfolio */}
        {(() => {
          // Group accounts by portfolio
          const portfolioGroups = accounts.reduce((acc, account) => {
            const key = account.portfolio || "___unassigned___";
            if (!acc[key]) acc[key] = [];
            acc[key].push(account);
            return acc;
          }, {} as Record<string, typeof accounts>);

          // Sort: assigned portfolios first (alphabetically), then unassigned
          const sortedEntries = Object.entries(portfolioGroups).sort(([a], [b]) => {
            if (a === "___unassigned___") return 1;
            if (b === "___unassigned___") return -1;
            return a.localeCompare(b);
          });

          return sortedEntries.map(([portfolioKey, groupAccounts], groupIndex) => {
            const isUnassigned = portfolioKey === "___unassigned___";
            const portfolioName = isUnassigned ? "Comptes non assignés" : portfolioKey;

            return (
              <motion.div
                key={portfolioKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + groupIndex * 0.1 }}
                className="mb-8"
              >
                {/* Portfolio Header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className={`rounded-lg ${isUnassigned ? 'bg-slate-500/20' : 'bg-violet-500/20'} p-2`}>
                    <Briefcase className={`h-5 w-5 ${isUnassigned ? 'text-slate-400' : 'text-violet-400'}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{portfolioName}</h2>
                    <p className="text-sm text-slate-400">
                      {groupAccounts.length} compte{groupAccounts.length > 1 ? 's' : ''} • 
                      {' '}{formatAmount(groupAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                    </p>
                  </div>
                </div>

                {/* Accounts Grid for this portfolio */}
                <div className="grid gap-4 md:grid-cols-2">
                  {groupAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <div
                className="cursor-pointer"
                onClick={() =>
                  setSelectedAccount(
                    selectedAccount === account.id ? null : account.id
                  )
                }
              >
                <GlassCard
                  className={`p-6 transition-all ${
                    selectedAccount === account.id
                      ? "ring-2 ring-violet-500"
                      : "hover:bg-gray-100 dark:bg-gray-700"
                  }`}
                  gradient="none"
                >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {account.name}
                    </h3>
                    {account.portfolio && (
                      <p className="text-sm text-slate-400">
                        {account.portfolio}
                      </p>
                    )}
                  </div>
                  <div
                    className={`rounded-full bg-${account.color}-500/20 p-2`}
                  >
                    <Wallet
                      className={`h-5 w-5 text-${account.color}-400`}
                      style={{
                        color:
                          account.color === "indigo"
                            ? "rgb(129, 140, 248)"
                            : account.color === "emerald"
                            ? "rgb(52, 211, 153)"
                            : account.color === "cyan"
                            ? "rgb(34, 211, 238)"
                            : "rgb(167, 139, 250)",
                      }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatAmount(account.balance)}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    {account.evolution >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-400" />
                    )}
                    <span
                      className={
                        account.evolution >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {account.evolution >= 0 ? "+" : ""}
                      {account.evolution.toFixed(1)}%
                    </span>
                    <span className="text-slate-400">sur {timeRange}j</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Mouvements</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {account.movements}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Moy. entrant</p>
                    <p className="font-semibold text-emerald-400">
                      +{formatAmount(account.avgIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Moy. sortant</p>
                    <p className="font-semibold text-rose-400">
                      -{formatAmount(account.avgExpense)}
                    </p>
                  </div>
                </div>
                </GlassCard>
              </div>
            </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          });
        })()}

        </>
        )}
      </div>
    </div>
    </ModularLayout>
    );
}
