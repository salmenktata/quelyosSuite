

import { Target, TrendingUp, TrendingDown, Calendar, Sparkles } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { formatMoney } from "@/lib/format";

interface BudgetRecommendation {
  id: number;
  recommendedAmount: number;
  confidence: number; // 0-100
  seasonalPattern: "stable" | "increasing" | "decreasing" | "seasonal";
  breakdown: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    avg: number;
    std: number;
  };
  seasonalFactors?: {
    monthlyAmounts?: Record<number, number>;
  };
  analysisMonths: number;
  samplesUsed: number;
}

interface BudgetRecommendationCardProps {
  recommendation: BudgetRecommendation;
  currentBudget?: number;
  onApply: (amount: number) => void;
  loading?: boolean;
}

export default function BudgetRecommendationCard({
  recommendation,
  currentBudget,
  onApply,
  loading = false,
}: BudgetRecommendationCardProps) {
  const trendIcons = {
    increasing: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    stable: <Target className="w-4 h-4 text-slate-400" />,
    decreasing: <TrendingDown className="w-4 h-4 text-rose-400" />,
    seasonal: <Calendar className="w-4 h-4 text-indigo-400" />,
  };

  const trendColors = {
    increasing: "text-emerald-400",
    stable: "text-slate-400",
    decreasing: "text-rose-400",
    seasonal: "text-indigo-400",
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-emerald-400";
    if (confidence >= 60) return "text-amber-400";
    return "text-orange-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "Très fiable";
    if (confidence >= 60) return "Fiable";
    return "Modéré";
  };

  const isDifferentFromCurrent =
    currentBudget && Math.abs(currentBudget - recommendation.recommendedAmount) > 0.01;

  return (
    <LazyMotion features={domAnimation}>
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-indigo-50/95 to-indigo-100/95 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-slate-900/50
        border border-indigo-200 dark:border-indigo-500/20
        backdrop-blur-sm
        p-6
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recommandation ML</h3>
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Basée sur {recommendation.analysisMonths} mois d&apos;historique
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div
          className={`
            px-3 py-1.5 rounded-full
            bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10
            flex items-center gap-2
          `}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              recommendation.confidence >= 80
                ? "bg-emerald-400"
                : recommendation.confidence >= 60
                ? "bg-amber-400"
                : "bg-orange-400"
            }`}
          />
          <span className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
            {Math.round(recommendation.confidence)}% {getConfidenceLabel(recommendation.confidence)}
          </span>
        </div>
      </div>

      {/* Recommended Amount */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Montant recommandé</p>
        <div className="flex items-baseline gap-3">
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatMoney(recommendation.recommendedAmount)}
          </p>
          {isDifferentFromCurrent && currentBudget !== undefined && (
            <span
              className={`text-sm ${
                recommendation.recommendedAmount > currentBudget
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {recommendation.recommendedAmount > currentBudget ? "+" : ""}
              {formatMoney(recommendation.recommendedAmount - currentBudget)}
            </span>
          )}
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2 mt-2">
          {trendIcons[recommendation.seasonalPattern]}
          <span className={`text-sm ${trendColors[recommendation.seasonalPattern]}`}>
            Tendance {recommendation.seasonalPattern === "stable" ? "stable" : recommendation.seasonalPattern}
          </span>
        </div>
      </div>

      {/* Statistics Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Minimum</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatMoney(recommendation.breakdown.min)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Médiane</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatMoney(recommendation.breakdown.median)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Maximum</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatMoney(recommendation.breakdown.max)}
          </p>
        </div>
      </div>

      {/* Seasonal Pattern (if available) */}
      {recommendation.seasonalFactors?.monthlyAmounts && (
        <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">Variations mensuelles détectées</p>
          <div className="flex items-end gap-1 h-16">
            {Object.entries(recommendation.seasonalFactors.monthlyAmounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([month, amount]) => {
                const maxAmount = Math.max(...Object.values(recommendation.seasonalFactors!.monthlyAmounts!));
                const height = (amount / maxAmount) * 100;
                return (
                  <div
                    key={month}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${new Date(2000, Number(month) - 1).toLocaleString('fr-FR', { month: 'short' })}: ${formatMoney(amount)}`}
                  >
                    <div
                      className="w-full bg-indigo-500/30 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] text-slate-500">
                      {new Date(2000, Number(month) - 1).toLocaleString('fr-FR', { month: 'short' })[0].toUpperCase()}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onApply(recommendation.recommendedAmount)}
        disabled={loading || !isDifferentFromCurrent}
        className={`
          w-full py-3 rounded-lg font-medium transition-all
          ${
            loading || !isDifferentFromCurrent
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white dark:text-white"
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Application...
          </span>
        ) : !isDifferentFromCurrent ? (
          "Budget déjà optimal"
        ) : (
          "Appliquer cette recommandation"
        )}
      </button>

      {/* Metadata */}
      <p className="text-xs text-slate-500 text-center mt-3">
        {recommendation.samplesUsed} transactions analysées sur {recommendation.analysisMonths} mois
      </p>
    </m.div>
    </LazyMotion>
  );
}
