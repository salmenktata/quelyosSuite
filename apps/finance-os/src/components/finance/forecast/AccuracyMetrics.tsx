"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, AlertCircle, CheckCircle, Activity, Info } from "lucide-react";
import { api } from "@/lib/finance/api";
import { GlassPanel } from '@quelyos/ui/glass';

type MetricsData = {
  success: boolean;
  metrics: {
    mae: number;
    mae_percentage: number;
    rmse: number;
    mape: number;
    coverage: number;
    meets_target: boolean;
    avg_balance: number;
  };
  validation: {
    data_points: number;
    horizon_tested: number;
    cutoffs_tested: number;
  };
};

type AccuracyMetricsProps = {
  horizonDays: number;
  currency: string;
};

export function AccuracyMetrics({ horizonDays, currency }: AccuracyMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMetrics() {
    setLoading(true);
    setError(null);

    try {
      const data = (await api(`/reporting/forecast-backtest?horizonDays=${horizonDays}`)) as MetricsData;
      setMetrics(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load accuracy metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, [horizonDays]);

  if (loading) {
    return (
      <GlassPanel gradient="indigo" className="p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <span className="text-sm text-indigo-100/80">Calculating accuracy metrics...</span>
        </div>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel gradient="indigo" className="border-amber-500/30 bg-amber-500/10 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">Accuracy metrics unavailable</p>
            <p className="mt-1 text-xs text-amber-200/70">{error}</p>
            {error.includes("Insufficient data") && (
              <p className="mt-2 text-xs text-amber-200/70">
                💡 Backtesting requires at least 12 months of historical transactions to validate forecast accuracy.
              </p>
            )}
          </div>
        </div>
      </GlassPanel>
    );
  }

  if (!metrics || !metrics.success) {
    return null;
  }

  const { mae_percentage, meets_target, mape, rmse, coverage } = metrics.metrics;
  const { data_points, cutoffs_tested } = metrics.validation;

  return (
    <GlassPanel gradient="indigo" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Target size={20} />
            Précision du modèle
          </h3>
          <p className="mt-1 text-sm text-indigo-100/80">
            Validé sur {data_points} jours avec {cutoffs_tested} tests
          </p>
        </div>

        {meets_target ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Objectif atteint</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
            <AlertCircle size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Amélioration nécessaire</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* MAE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">MAE (Erreur moyenne)</span>
            <Activity size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{mae_percentage.toFixed(1)}%</div>
          <div className="mt-1 text-xs text-slate-500">Objectif: &lt;10%</div>

          {/* Progress bar */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(mae_percentage, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${meets_target ? "bg-emerald-500" : "bg-amber-500"}`}
            />
          </div>
        </motion.div>

        {/* MAPE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">MAPE</span>
            <TrendingUp size={14} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{(mape * 100).toFixed(1)}%</div>
          <div className="mt-1 text-xs text-slate-500">Erreur en pourcentage</div>
        </motion.div>

        {/* RMSE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">RMSE</span>
            <Target size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {rmse.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {currency}
          </div>
          <div className="mt-1 text-xs text-slate-500">Erreur quadratique</div>
        </motion.div>
      </div>

      {/* Explanation */}
      <div className="mt-4 rounded-lg bg-indigo-500/5 p-3">
        <div className="flex items-start gap-2">
          <Info size={14} className="mt-0.5 flex-shrink-0 text-indigo-400" />
          <p className="text-xs leading-relaxed text-indigo-100/70">
            <strong>Comment lire:</strong> Un MAE de {mae_percentage.toFixed(1)}% signifie que les prévisions sont en
            moyenne à {mae_percentage.toFixed(1)}% du solde réel.
            {meets_target
              ? " ✅ Le modèle est fiable pour vos décisions financières."
              : " ⚠️ Les prévisions peuvent varier significativement. Utilisez les zones de confiance pour évaluer l'incertitude."}
          </p>
        </div>
      </div>

      {/* Coverage metric */}
      {coverage && (
        <div className="mt-3 flex items-center justify-between text-xs text-indigo-100/60">
          <span>Couverture des intervalles de confiance:</span>
          <span className="font-medium text-indigo-200">{(coverage * 100).toFixed(0)}%</span>
        </div>
      )}
    </GlassPanel>
  );
}
