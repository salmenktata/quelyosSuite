

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Zap, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassPanel } from '@quelyos/ui/glass';
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { ForecastChart } from "@/components/finance/charts/ForecastChart";
import { reportingClient, type KPIForecastResponse } from "@/lib/finance/reporting";
import { useApiData } from "@/hooks/finance/useApiData";

type HorizonDays = 30 | 60 | 90 | 180;

export default function KPIForecastsPage() {
  useRequireAuth();
  const { formatAmount } = useCurrency();
  const [horizonDays, setHorizonDays] = useState<HorizonDays>(90);

  const {
    data: dsoForecast,
    loading: dsoLoading,
    error: dsoError,
  } = useApiData<KPIForecastResponse>({
    fetcher: () => reportingClient.dsoForecast({ horizonDays }),
    cacheKey: `dso-forecast-${horizonDays}`,
    cacheTime: 30 * 60 * 1000,
    deps: [horizonDays],
  });

  const {
    data: ebitdaForecast,
    loading: ebitdaLoading,
    error: ebitdaError,
  } = useApiData<KPIForecastResponse>({
    fetcher: () => reportingClient.ebitdaForecast({ horizonDays }),
    cacheKey: `ebitda-forecast-${horizonDays}`,
    cacheTime: 30 * 60 * 1000,
    deps: [horizonDays],
  });

  const {
    data: bfrForecast,
    loading: bfrLoading,
    error: bfrError,
  } = useApiData<KPIForecastResponse>({
    fetcher: () => reportingClient.bfrForecast({ horizonDays }),
    cacheKey: `bfr-forecast-${horizonDays}`,
    cacheTime: 30 * 60 * 1000,
    deps: [horizonDays],
  });

  return (
    
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <ReportingNav />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to={ROUTES.FINANCE.DASHBOARD.REPORTING} className="mb-4 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
            <ChevronLeft className="h-4 w-4" />Retour au hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-3 shadow-lg shadow-purple-500/30">
              <Zap className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prédictions ML des KPIs</h1>
              <p className="text-sm text-slate-400">Prévisions intelligentes utilisant Prophet (Machine Learning)</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
          <GlassPanel className="p-4 bg-blue-500/5 border-blue-400/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-blue-200 mb-1">À propos des prédictions</p>
                <p>Ces prédictions utilisent <strong>Prophet</strong>, un algorithme de Machine Learning développé par Facebook.</p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-6">
          <GlassPanel className="p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">Horizon de prédiction:</span>
              <div className="flex gap-2">
                {([30, 60, 90, 180] as HorizonDays[]).map((days) => (
                  <button key={days} onClick={() => setHorizonDays(days)} disabled={dsoLoading || ebitdaLoading || bfrLoading}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${horizonDays === days ? "bg-purple-500 text-gray-900 dark:text-white shadow-lg shadow-purple-500/30" : "text-slate-400 hover:bg-gray-100 dark:bg-gray-800"}`}>
                    {days} jours
                  </button>
                ))}
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <ForecastChart historical={dsoForecast?.historical || []} forecast={dsoForecast?.forecast.map(f => ({ date: f.date, value: f.dso || 0, confidence80: f.confidence80, confidence95: f.confidence95 })) || []}
            title="Prédiction DSO (Délai d'Encaissement)" subtitle={`Prédiction sur ${horizonDays} jours basée sur ${dsoForecast?.model?.trainedOn || 0} mois d'historique`}
            valueLabel="DSO (jours)" formatValue={(v) => `${v.toFixed(1)} jours`} loading={dsoLoading} error={dsoError?.message || null} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <ForecastChart historical={ebitdaForecast?.historical || []} forecast={ebitdaForecast?.forecast.map(f => ({ date: f.date, value: f.ebitdaMargin || 0, confidence80: f.confidence80, confidence95: f.confidence95 })) || []}
            title="Prédiction EBITDA Margin" subtitle={`Prédiction sur ${horizonDays} jours basée sur ${ebitdaForecast?.model?.trainedOn || 0} mois d'historique`}
            valueLabel="Marge EBITDA" formatValue={(v) => `${v.toFixed(1)}%`} loading={ebitdaLoading} error={ebitdaError?.message || null} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
          <ForecastChart historical={bfrForecast?.historical || []} forecast={bfrForecast?.forecast.map(f => ({ date: f.date, value: f.bfr || 0, confidence80: f.confidence80, confidence95: f.confidence95 })) || []}
            title="Prédiction BFR (Besoin en Fonds de Roulement)" subtitle={`Prédiction sur ${horizonDays} jours basée sur ${bfrForecast?.model?.trainedOn || 0} mois d'historique`}
            valueLabel="BFR" formatValue={(v) => formatAmount(v)} loading={bfrLoading} error={bfrError?.message || null} />
        </motion.div>
      </div>
    </div>
    
    );
}
