/**
 * Détail Budget - Suivi détaillé d'un budget
 *
 * Fonctionnalités :
 * - Affichage informations budget (nom, montant, période, catégorie)
 * - Progression visuelle avec barre de pourcentage colorée selon statut
 * - Statistiques clés : budget total, dépensé, restant
 * - Indicateurs de statut : sur la bonne voie, attention (80%), dépassé
 * - Période de validité avec dates début/fin formatées
 * - Compteur de transactions associées au budget
 * - Alertes visuelles pour dépassement ou approche limite
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { TrendingDown, Calendar, DollarSign, AlertTriangle, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { logger } from '@quelyos/logger';
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonTable } from '@/components/common'

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
      logger.error("Erreur:", err);
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
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <SkeletonTable rows={5} columns={3} />
        </div>
      </Layout>
    );
  }

  if (error || !budget) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Finance', href: '/finance' },
              { label: 'Budgets', href: '/finance/budgets' },
              { label: 'Détail' },
            ]}
          />

          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                {error || "Budget introuvable"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const progressColor = budget.status === "EXCEEDED" ? "rose" :
                        budget.status === "WARNING" ? "amber" : "emerald";

  const StatusIcon = budget.status === "EXCEEDED" ? AlertCircle :
                     budget.status === "WARNING" ? AlertTriangle : CheckCircle2;

  const statusText = budget.status === "EXCEEDED" ? "Dépassé" :
                     budget.status === "WARNING" ? "Attention" : "Sur la bonne voie";

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Budgets', href: '/finance/budgets' },
            { label: budget.name },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{budget.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {budget.category ? budget.category.name : "Toutes catégories"} • {budget.period}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border ${
              budget.status === "EXCEEDED"
                ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                : budget.status === "WARNING"
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            }`}
          >
            <StatusIcon className="h-4 w-4" />
            {statusText}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-purple-600 dark:text-purple-400">Budget total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(budget.amount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm ${
            progressColor === "rose"
              ? "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30"
              : progressColor === "amber"
              ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30"
              : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`mb-1 text-sm ${
                  progressColor === "rose"
                    ? "text-rose-600 dark:text-rose-400"
                    : progressColor === "amber"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>Dépensé</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(budget.currentSpending)}
                </p>
              </div>
              <TrendingDown className={`h-8 w-8 ${
                progressColor === "rose"
                  ? "text-rose-600 dark:text-rose-400"
                  : progressColor === "amber"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-600 dark:text-indigo-400">Restant</p>
                <p className={`text-2xl font-bold ${budget.remainingAmount >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                  {formatAmount(budget.remainingAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progression</h2>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-8 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {budget.percentageUsed.toFixed(1)}% du budget utilisé
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {budget.transactionCount} transactions
            </span>
          </div>
        </div>

        {/* Period Info */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Période
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Début</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(budget.periodStart).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fin</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(budget.periodEnd).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {budget.status === "WARNING" && (
          <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">Attention : Budget à 80%</p>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Vous approchez de la limite de votre budget. Surveillez vos dépenses.
                </p>
              </div>
            </div>
          </div>
        )}

        {budget.status === "EXCEEDED" && (
          <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Budget dépassé</p>
                <p className="text-sm text-red-700 dark:text-red-200">
                  Vous avez dépassé le budget de {formatAmount(Math.abs(budget.remainingAmount))}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
