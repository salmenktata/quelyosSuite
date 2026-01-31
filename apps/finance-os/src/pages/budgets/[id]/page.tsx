

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { GlassCard, GlassPanel, GlassBadge } from '@quelyos/ui/glass';
import { ArrowLeft, TrendingDown, Calendar, DollarSign, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { useCurrency } from "@/lib/finance/CurrencyContext";

type BudgetDetail = {
  id: number;
  name: string;
  amount: number;
  currentSpending: number;
  percentageUsed: number;
  status: "ON_TRACK" | "WARNING" | "EXCEEDED";
  remainingAmount: number;
  periodStart: string;
  periodEnd: string;
  transactionCount: number;
  period: string;
  category: { id: number; name: string } | null;
};

export default function BudgetDetailPage() {
  useRequireAuth();
  const params = useParams();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  useEffect(() => {
    async function loadBudget() {
      try {
        setLoading(true);
        setError(null);
        const data = await api<BudgetDetail>(`/budgets/${params.id}/detail`);
        setBudget(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du budget");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadBudget();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="p-6">
        <GlassCard className="border-red-400/40 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-red-100">{error || "Budget introuvable"}</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const progressColor = budget.status === "EXCEEDED" ? "rose" :
                        budget.status === "WARNING" ? "amber" : "emerald";

  const StatusIcon = budget.status === "EXCEEDED" ? AlertCircle :
                     budget.status === "WARNING" ? AlertTriangle : CheckCircle2;

  const statusText = budget.status === "EXCEEDED" ? "Dépassé" :
                     budget.status === "WARNING" ? "Attention" : "Sur la bonne voie";

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate("/budgets")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux budgets
          </button>
          <h1 className="text-3xl font-bold text-white">{budget.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {budget.category ? budget.category.name : "Toutes catégories"} • {budget.period}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <GlassBadge
            variant={budget.status === "EXCEEDED" ? "error" : budget.status === "WARNING" ? "warning" : "success"}
            className="inline-flex items-center gap-2"
          >
            <StatusIcon className="h-4 w-4" />
            {statusText}
          </GlassBadge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-4" gradient="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-purple-200">Budget total</p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(budget.amount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient={progressColor}>
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Dépensé</p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(budget.currentSpending)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-emerald-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">Restant</p>
                <p className={`text-2xl font-bold ${budget.remainingAmount >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatAmount(budget.remainingAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>
        </div>

        {/* Progress Bar */}
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Progression</h2>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-8 overflow-hidden rounded-full bg-white/10">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  progressColor === "rose" ? "bg-gradient-to-r from-rose-500 to-pink-600" :
                  progressColor === "amber" ? "bg-gradient-to-r from-amber-500 to-orange-600" :
                  "bg-gradient-to-r from-emerald-500 to-teal-600"
                }`}
                style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {budget.percentageUsed >= 10 && (
                    <span className="text-xs font-bold text-white">
                      {budget.percentageUsed.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">
              {budget.percentageUsed.toFixed(1)}% du budget utilisé
            </span>
            <span className="text-sm text-slate-400">
              {budget.transactionCount} transactions
            </span>
          </div>
        </GlassPanel>

        {/* Period Info */}
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Période
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Début</p>
              <p className="text-white font-medium">
                {new Date(budget.periodStart).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Fin</p>
              <p className="text-white font-medium">
                {new Date(budget.periodEnd).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Alert Messages */}
        {budget.status === "WARNING" && (
          <GlassCard className="border-amber-400/40 bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-100">Attention : Budget à 80%</p>
                <p className="text-sm text-amber-200/80">
                  Vous approchez de la limite de votre budget. Surveillez vos dépenses.
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {budget.status === "EXCEEDED" && (
          <GlassCard className="border-red-400/40 bg-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="font-semibold text-red-100">Budget dépassé</p>
                <p className="text-sm text-red-200/80">
                  Vous avez dépassé le budget de {formatAmount(Math.abs(budget.remainingAmount))}.
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
