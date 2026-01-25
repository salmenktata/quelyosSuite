

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  AlertTriangle,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { ReportNotice } from "@/components/finance/reporting/ReportNotice";
import { reportingClient, type ForecastEnhancedResponse } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";
import { reportingNotices } from "@/lib/finance/reporting-notices";

type TimeHorizon = "30" | "60" | "90" | "180";

export default function ForecastReportPage() {
  useRequireAuth();
  const { baseCurrency, formatAmount: formatAmountWithConversion } = useCurrency();
  const [horizon, setHorizon] = useState<TimeHorizon>("30");

  const formatAmount = (amount: number) => {
    return formatAmountWithConversion(amount, baseCurrency);
  };

  // Fetch data with automatic caching
  const {
    data: apiData,
    loading,
    error: apiError,
    refetch,
  } = useApiData<ForecastEnhancedResponse>({
    fetcher: () => reportingClient.forecastEnhanced({
      horizonDays: parseInt(horizon),
      historicalDays: 90,
    }),
    cacheKey: `reporting-forecast-${horizon}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [horizon],
  });

  const error = apiError?.message || null;

  return (
    <div className="min-h-screen p-6 pt-16">
      <div className="mx-auto max-w-7xl">
        {/* Navigation rapide entre rapports */}
        <ReportingNav />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href={ROUTES.FINANCE.DASHBOARD.REPORTING}
            className="mb-4 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-cyan-500/30">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Prévisions de trésorerie
              </h1>
              <p className="text-sm text-slate-400">
                Projection basée sur les tendances historiques et transactions planifiées
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Notice */}
        <ReportNotice
          title={reportingNotices.forecast.title}
          purpose={reportingNotices.forecast.purpose}
          tracking={reportingNotices.forecast.tracking}
          icon={TrendingUp}
          reportId="forecast"
        />

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassPanel className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Horizon de projection :</span>
              <div className="flex gap-2">
                {(["30", "60", "90", "180"] as TimeHorizon[]).map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    disabled={loading}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      horizon === h
                        ? "bg-cyan-500 text-white"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {h} jours
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
                <span>Calcul des prévisions...</span>
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

        {/* Content */}
        {!loading && !error && apiData && (
        <>
        {/* Alerts */}
        {(apiData.alerts.lowCash || apiData.alerts.negativeBalance) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            {apiData.alerts.negativeBalance && (
              <GlassCard className="border-red-400/40 bg-red-500/10 p-4 mb-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-100">Alerte : Solde négatif prévu</p>
                    <p className="text-sm text-red-200/80">
                      Votre solde descendra en dessous de zéro dans les {horizon} prochains jours.
                      Minimum projeté : {formatAmount(apiData.minBalance)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {apiData.alerts.lowCash && apiData.alerts.runwayDays !== null && (
              <GlassCard className="border-amber-400/40 bg-amber-500/10 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-amber-100">Trésorerie faible</p>
                    <p className="text-sm text-amber-200/80">
                      À ce rythme, votre trésorerie sera épuisée dans environ {apiData.alerts.runwayDays} jours.
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 grid gap-4 md:grid-cols-4"
        >
          <GlassCard className="p-4" gradient="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-purple-200">Solde actuel</p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(apiData.currentBalance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-indigo-200">Solde projeté</p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(apiData.projectedBalance)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-300" />
            </div>
          </GlassCard>

          <GlassCard className="p-4" gradient={apiData.futureImpact >= 0 ? "emerald" : "rose"}>
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-emerald-200">Impact futur</p>
                <p className={`text-2xl font-bold ${apiData.futureImpact >= 0 ? 'text-white' : 'text-red-100'}`}>
                  {apiData.futureImpact >= 0 ? '+' : ''}{formatAmount(apiData.futureImpact)}
                </p>
              </div>
              {apiData.futureImpact >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-300" />
              ) : (
                <TrendingDown className="h-8 w-8 text-rose-300" />
              )}
            </div>
          </GlassCard>

          {apiData.runwayDays !== null && (
            <GlassCard className="p-4" gradient="amber">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm text-amber-200">Runway</p>
                  <p className="text-2xl font-bold text-white">
                    {apiData.runwayDays} jours
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-300" />
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* Trends Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tendances historiques ({apiData.trends.historicalDays} derniers jours)
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-200 mb-1">Revenus moyens / jour</p>
                <p className="text-xl font-bold text-emerald-400">
                  {formatAmount(apiData.trends.avgDailyIncome)}
                </p>
              </div>
              <div className="rounded-lg bg-rose-500/10 p-4">
                <p className="text-sm text-rose-200 mb-1">Dépenses moyennes / jour</p>
                <p className="text-xl font-bold text-rose-400">
                  {formatAmount(apiData.trends.avgDailyExpense)}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${apiData.trends.avgDailyNet >= 0 ? 'bg-cyan-500/10' : 'bg-amber-500/10'}`}>
                <p className={`text-sm mb-1 ${apiData.trends.avgDailyNet >= 0 ? 'text-cyan-200' : 'text-amber-200'}`}>
                  Solde net moyen / jour
                </p>
                <p className={`text-xl font-bold ${apiData.trends.avgDailyNet >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {apiData.trends.avgDailyNet >= 0 ? '+' : ''}{formatAmount(apiData.trends.avgDailyNet)}
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Forecast Chart - Simplified Text View */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <GlassPanel className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Projection de trésorerie
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {apiData.forecast.slice(0, 30).map((day, idx) => (
                <div
                  key={day.date}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    day.projectedBalance < 0 ? 'bg-red-500/10' :
                    day.projectedBalance < apiData.currentBalance * 0.3 ? 'bg-amber-500/10' :
                    'bg-white/5'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">
                      Jour {idx + 1} • {new Date(day.date).toLocaleDateString("fr-FR", { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Solde projeté</p>
                      <p className={`text-sm font-bold ${day.projectedBalance < 0 ? 'text-red-400' : 'text-white'}`}>
                        {formatAmount(day.projectedBalance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Variation</p>
                      <p className={`text-sm font-medium ${day.netChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {day.netChange >= 0 ? '+' : ''}{formatAmount(day.netChange)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
        </>
        )}
      </div>
    </div>
  );
}
