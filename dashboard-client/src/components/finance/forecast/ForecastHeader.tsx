import { Sparkles, Shield, Zap } from "lucide-react";
import { ForecastExport } from "./ForecastExport";
import type { ForecastResponse } from "@/types/forecast";

interface ForecastHeaderProps {
  showConfidence: boolean;
  showScenarios: boolean;
  onToggleConfidence: () => void;
  onToggleScenarios: () => void;
  forecast: ForecastResponse | null;
}

export function ForecastHeader({
  showConfidence,
  showScenarios,
  onToggleConfidence,
  onToggleScenarios,
  forecast,
}: ForecastHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-100 dark:bg-indigo-500/10 px-3 py-1 text-xs text-indigo-700 dark:text-indigo-300">
            <Sparkles size={12} />
            Prévisions IA
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Trésorerie prévisionnelle
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visualisez l&apos;évolution de votre trésorerie avec zone de confiance et scénarios.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" data-guide="forecast-scenarios">
        <button
          onClick={onToggleConfidence}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
            showConfidence
              ? "border-indigo-500/50 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
              : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10"
          }`}
        >
          <Shield size={14} />
          Zone confiance
        </button>
        <button
          onClick={onToggleScenarios}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
            showScenarios
              ? "border-purple-500/50 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
              : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10"
          }`}
        >
          <Zap size={14} />
          Scénarios
        </button>
        {forecast && <ForecastExport data={forecast as unknown as import("@/lib/finance/reporting").ForecastEnhancedResponse} />}
      </div>
    </div>
  );
}
