

import { useMemo } from "react";
import { GlassCard, GlassButton } from "@/components/ui/glass";
import { ChevronDown, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

type BudgetStatus = "ON_TRACK" | "WARNING" | "EXCEEDED";
type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

interface Budget {
  id: number;
  name: string;
  amount: number;
  currentSpending?: number;
  percentageUsed?: number;
  status?: BudgetStatus;
  category?: { id: number; name: string } | null;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string | null;
}

interface BudgetAnalyticsProps {
  budgets: Budget[];
  isExpanded: boolean;
  onToggle: () => void;
  formatCurrency: (amount: number) => string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload?: {
      name?: string;
    };
  }>;
  formatCurrency: (amount: number) => string;
}

function CustomTooltip({ active, payload, formatCurrency }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-indigo-950/95 backdrop-blur-xl border border-gray-200 dark:border-white/15 rounded-lg p-3 shadow-xl">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{payload[0].payload?.name}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value || 0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function BudgetAnalytics({ budgets, isExpanded, onToggle, formatCurrency }: BudgetAnalyticsProps) {
  // Comparison data for bar chart
  const comparisonData = useMemo(() => {
    return budgets
      .filter(b => b.currentSpending !== undefined)
      .slice(0, 8) // Limit to 8 budgets for readability
      .map(b => ({
        name: b.name.length > 15 ? b.name.substring(0, 12) + "..." : b.name,
        budgété: b.amount,
        dépensé: b.currentSpending || 0
      }));
  }, [budgets]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const grouped = budgets.reduce((acc, b) => {
      const cat = b.category?.name || "Sans catégorie";
      if (!acc[cat]) {
        acc[cat] = { name: cat, value: 0 };
      }
      acc[cat].value += b.currentSpending || 0;
      return acc;
    }, {} as Record<string, { name: string; value: number }>);

    return Object.values(grouped).filter(item => item.value > 0);
  }, [budgets]);

  // Predictive insights
  const insights = useMemo(() => {
    const atRiskBudgets = budgets.filter(b =>
      (b.status === "WARNING" || b.status === "EXCEEDED") &&
      b.startDate &&
      b.currentSpending !== undefined
    );

    return atRiskBudgets.map(budget => {
      const start = new Date(budget.startDate!);
      const now = new Date();
      const daysElapsed = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const burnRate = (budget.currentSpending || 0) / daysElapsed;

      const remaining = budget.amount - (budget.currentSpending || 0);
      const daysToExhaustion = remaining > 0 ? Math.floor(remaining / burnRate) : 0;

      // Calculate period end date
      let periodEnd = new Date(start);
      if (budget.endDate) {
        periodEnd = new Date(budget.endDate);
      } else if (budget.period) {
        switch (budget.period) {
          case "WEEKLY":
            periodEnd.setDate(start.getDate() + 7);
            break;
          case "MONTHLY":
            periodEnd.setMonth(start.getMonth() + 1);
            break;
          case "QUARTERLY":
            periodEnd.setMonth(start.getMonth() + 3);
            break;
          case "YEARLY":
            periodEnd.setFullYear(start.getFullYear() + 1);
            break;
        }
      }

      const daysRemaining = Math.max(0, Math.floor((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        budget,
        burnRate,
        daysToExhaustion,
        daysRemaining,
        willExceed: daysToExhaustion < daysRemaining && remaining > 0
      };
    });
  }, [budgets]);

  if (budgets.length === 0) return null;

  return (
    <div className="relative">
      <GlassCard className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analyses & Comparaisons</h3>
          </div>
          <GlassButton
            onClick={onToggle}
            variant="ghost"
            className="flex items-center gap-2"
          >
            {isExpanded ? "Réduire" : "Développer"}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </GlassButton>
        </div>

        {isExpanded && (
          <div className="space-y-6 mt-6">
            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bar Chart - Budget Comparison */}
              {comparisonData.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-indigo-100">Comparaison des budgets</h4>
                  <div className="bg-white/5 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          dataKey="name"
                          stroke="#a5b4fc"
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#a5b4fc" fontSize={12} />
                        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                        <Legend />
                        <Bar dataKey="budgété" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="dépensé" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Pie Chart - Category Breakdown */}
              {categoryBreakdown.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-indigo-100">Répartition par catégorie</h4>
                  <div className="bg-white/5 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => entry.name}
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                          contentStyle={{
                            backgroundColor: "rgba(30, 27, 75, 0.95)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "0.5rem"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Predictive Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h4 className="font-medium text-indigo-100">Prédictions & Alertes</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {insights.map(({ budget, burnRate, daysToExhaustion, daysRemaining, willExceed }) => (
                    <div
                      key={budget.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-gray-900 dark:text-white">{budget.name}</div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          budget.status === "EXCEEDED"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {budget.status === "EXCEEDED" ? "Dépassé" : "Attention"}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-indigo-100/80">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          <span>Rythme: {formatCurrency(burnRate)}/jour</span>
                        </div>

                        {daysToExhaustion > 0 && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Budget épuisé dans {daysToExhaustion} jour{daysToExhaustion > 1 ? "s" : ""}
                              {willExceed && daysRemaining > 0 && (
                                <span className="text-amber-300"> (avant la fin de période)</span>
                              )}
                            </span>
                          </div>
                        )}

                        {daysRemaining > 0 && (
                          <div className="text-xs text-indigo-100/60">
                            {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""} dans la période
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for insights */}
            {insights.length === 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                <div className="text-emerald-300 font-medium mb-1">Tous les budgets sont sains !</div>
                <div className="text-sm text-emerald-200/60">Aucune alerte ou prédiction de dépassement.</div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
