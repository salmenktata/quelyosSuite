import { useMemo } from "react";
import { Wallet, TrendingDown, TrendingUp, CheckCircle, PiggyBank } from "lucide-react";

type BudgetStatus = "ON_TRACK" | "WARNING" | "EXCEEDED";

interface Budget {
  id: number;
  name: string;
  amount: number;
  currentSpending?: number;
  percentageUsed?: number;
  status?: BudgetStatus;
}

interface BudgetStatsCardsProps {
  budgets: Budget[];
  formatCurrency: (amount: number) => string;
}

export function BudgetStatsCards({ budgets, formatCurrency }: BudgetStatsCardsProps) {
  const stats = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.currentSpending || 0), 0);
    const onTrackCount = budgets.filter(b => b.status === "ON_TRACK").length;
    const warningCount = budgets.filter(b => b.status === "WARNING").length;
    const exceededCount = budgets.filter(b => b.status === "EXCEEDED").length;
    const remaining = totalBudgeted - totalSpent;
    const percentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted * 100) : 0;

    return {
      totalBudgeted,
      totalSpent,
      onTrackCount,
      warningCount,
      exceededCount,
      remaining,
      percentageUsed,
      totalCount: budgets.length
    };
  }, [budgets]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* Total Budgété */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total budgété
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {formatCurrency(stats.totalBudgeted)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Total Dépensé */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total dépensé
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {formatCurrency(stats.totalSpent)}
            </p>
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              stats.percentageUsed > 100
                ? "text-rose-600 dark:text-rose-400"
                : stats.percentageUsed > 80
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {stats.percentageUsed > 80 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {stats.percentageUsed.toFixed(1)}% utilisé
            </p>
          </div>
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </div>

      {/* Budgets Sains */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Budgets sains
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {stats.onTrackCount}/{stats.totalCount}
            </p>
            <p className={`text-xs mt-1 ${
              stats.exceededCount > 0
                ? "text-rose-600 dark:text-rose-400"
                : stats.warningCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {stats.warningCount > 0
                ? `${stats.warningCount} en alerte`
                : stats.exceededCount > 0
                  ? `${stats.exceededCount} dépassé(s)`
                  : "Tous OK"}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Économies / Restant */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {stats.remaining >= 0 ? "Économies" : "Dépassement"}
            </p>
            <p className={`text-xl sm:text-2xl font-semibold mt-1 ${
              stats.remaining >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}>
              {formatCurrency(Math.abs(stats.remaining))}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${
            stats.remaining >= 0
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-rose-100 dark:bg-rose-900/30"
          }`}>
            <PiggyBank className={`h-5 w-5 ${
              stats.remaining >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}
