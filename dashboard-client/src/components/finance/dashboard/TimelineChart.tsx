import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
// Calendar icon available if needed
import { GlassPanel } from "@/components/ui/glass";
import type { DashboardForecast } from "@/lib/finance/reporting";

interface TimelineChartProps {
  forecastData: DashboardForecast;
  formatAmount: (amount: number) => string;
}

export const TimelineChart = memo(function TimelineChart({
  forecastData,
  formatAmount,
}: TimelineChartProps) {
  const navigate = useNavigate();

  // Handle bar click - navigate to transactions page filtered by date
  const handleBarClick = (date: string, isForecast: boolean) => {
    if (isForecast) return; // Don't navigate for forecast data
    const formattedDate = new Date(date).toISOString().split('T')[0];
    navigate(`/finance/transactions?date=${formattedDate}`);
  };

  // Combine historical and forecast data
  const chartData = useMemo(() => {
    const combined = [...forecastData.historical, ...forecastData.forecast];

    // Find max value for normalization
    const maxValue = Math.max(
      ...combined.map((d) => Math.max(d.income, d.expenses))
    );

    // Normalize heights to 0-100% for display
    return combined.map((d) => ({
      date: d.date,
      income: maxValue > 0 ? (d.income / maxValue) * 100 : 0,
      expenses: maxValue > 0 ? (d.expenses / maxValue) * 100 : 0,
      net: d.net,
      isForecast: "isForecast" in d ? Boolean(d.isForecast) : false,
    }));
  }, [forecastData]);

  return (
    <GlassPanel gradient="indigo" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Vision 90 jours
          </h2>
          <p className="text-sm text-indigo-200">
            Trésorerie passée + prévisions futures
          </p>
        </div>
        <Link
          to="/finance/reporting"
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          Rapport complet →
        </Link>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
          <span>Passé</span>
          <span>Aujourd&apos;hui</span>
          <span>Prévisions</span>
        </div>
        <div className="flex h-48 items-end gap-1">
          {chartData.map((data, i) => {
            const heightToUse = data.net >= 0 ? data.income : data.expenses;
            return (
              <div
                key={i}
                onClick={() => handleBarClick(data.date, data.isForecast)}
                title={`${data.date}\nRevenus: ${formatAmount(data.net >= 0 ? data.income : 0)}\nDépenses: ${formatAmount(data.expenses)}${!data.isForecast ? '\nCliquez pour voir les transactions' : ''}`}
                className={`group relative flex-1 rounded-t transition-all duration-200 hover:opacity-80 ${
                  !data.isForecast ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                } ${
                  data.isForecast
                    ? "bg-gradient-to-t from-violet-500/30 to-violet-400/60"
                    : data.net >= 0
                      ? "bg-gradient-to-t from-emerald-500/50 to-emerald-400/80"
                      : "bg-gradient-to-t from-rose-500/50 to-rose-400/80"
                }`}
                style={{ height: `${Math.max(heightToUse, 5)}%` }}
              >
                {/* Tooltip on hover */}
                <div className="invisible absolute -top-16 left-1/2 z-10 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                  <div className="whitespace-nowrap">
                    {new Date(data.date).toLocaleDateString("fr-FR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-emerald-400">
                    {formatAmount(data.net)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Positif</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-slate-400">Négatif</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-slate-400">Prévisions</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-white/5 bg-white/5 p-3">
          <div>
            <div className="text-xs text-slate-400">Total Revenus</div>
            <div className="text-sm font-semibold text-emerald-400">
              {formatAmount(
                forecastData.historical.reduce((sum, d) => sum + d.income, 0)
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Dépenses</div>
            <div className="text-sm font-semibold text-rose-400">
              {formatAmount(
                forecastData.historical.reduce((sum, d) => sum + d.expenses, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
});
