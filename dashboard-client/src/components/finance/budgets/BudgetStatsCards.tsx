import { useMemo } from "react";
import { GlassStatCard } from "@/components/ui/glass";
import { Wallet, TrendingDown, CheckCircle, PiggyBank } from "lucide-react";

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
      <GlassStatCard
        label="Total budgété"
        value={formatCurrency(stats.totalBudgeted)}
        icon={<Wallet className="h-5 w-5 text-indigo-400" />}
        accentColor="indigo"
      />

      {/* Total Dépensé */}
      <GlassStatCard
        label="Total dépensé"
        value={formatCurrency(stats.totalSpent)}
        icon={<TrendingDown className="h-5 w-5 text-rose-400" />}
        trend={stats.percentageUsed > 100 ? "down" : stats.percentageUsed > 80 ? "neutral" : "up"}
        trendValue={`${stats.percentageUsed.toFixed(1)}% utilisé`}
        accentColor="rose"
      />

      {/* Budgets Sains */}
      <GlassStatCard
        label="Budgets sains"
        value={`${stats.onTrackCount}/${stats.totalCount}`}
        icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
        trendValue={stats.warningCount > 0 ? `${stats.warningCount} en alerte` : stats.exceededCount > 0 ? `${stats.exceededCount} dépassé(s)` : "Tous OK"}
        accentColor="emerald"
      />

      {/* Économies / Restant */}
      <GlassStatCard
        label={stats.remaining >= 0 ? "Économies" : "Dépassement"}
        value={formatCurrency(Math.abs(stats.remaining))}
        icon={<PiggyBank className={`h-5 w-5 ${stats.remaining >= 0 ? "text-emerald-400" : "text-rose-400"}`} />}
        trend={stats.remaining >= 0 ? "up" : "down"}
        accentColor={stats.remaining >= 0 ? "emerald" : "rose"}
      />
    </div>
  );
}
