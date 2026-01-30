

import { _LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from "recharts";
import { GlassPanel } from "@/components/ui/glass";
import { Loader2, TrendingUp, AlertCircle } from "lucide-react";

type ForecastChartProps = {
  historical: Array<{ date: string; value: number }>;
  forecast: Array<{
    date: string;
    value: number;
    confidence80?: { upper: number; lower: number };
    confidence95?: { upper: number; lower: number };
  }>;
  title: string;
  subtitle?: string;
  valueLabel: string;
  formatValue?: (value: number) => string;
  height?: number;
  loading?: boolean;
  error?: string | null;
};

export function ForecastChart({
  historical,
  forecast,
  title,
  subtitle,
  valueLabel,
  formatValue = (v) => v.toFixed(1),
  height = 400,
  loading = false,
  error = null,
}: ForecastChartProps) {
  if (loading) {
    return (
      <GlassPanel className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="ml-3 text-slate-400">Génération des prédictions ML...</span>
        </div>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel className="p-6 bg-red-500/5 border-red-400/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-semibold text-red-200">Erreur de prédiction</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  // Combine historical and forecast data
  const chartData = [
    ...historical.map(h => ({
      date: h.date,
      type: "historical",
      actual: h.value,
      predicted: null,
      upper80: null,
      lower80: null,
      upper95: null,
      lower95: null,
    })),
    ...forecast.map(f => ({
      date: f.date,
      type: "forecast",
      actual: null,
      predicted: f.value,
      upper80: f.confidence80?.upper || null,
      lower80: f.confidence80?.lower || null,
      upper95: f.confidence95?.upper || null,
      lower95: f.confidence95?.lower || null,
    })),
  ];

  return (
    <GlassPanel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            {title}
          </h3>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-emerald-500 rounded"></div>
            <span className="text-slate-400">Historique</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-indigo-500 rounded"></div>
            <span className="text-slate-400">Prédiction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 bg-indigo-500/20 rounded"></div>
            <span className="text-slate-400">Intervalle 80%</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="confidence80" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="confidence95" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.4)"
            style={{ fontSize: "11px" }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
            }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            style={{ fontSize: "11px" }}
            tickFormatter={(value) => formatValue(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "12px",
            }}
            labelStyle={{ color: "white", marginBottom: "8px", fontWeight: "bold" }}
            itemStyle={{ color: "white", fontSize: "12px" }}
            formatter={(value, name) => {
              if (value === null) return [null, name || ""];
              const formattedValue = formatValue(Number(value));
              const labels: Record<string, string> = {
                actual: valueLabel,
                predicted: "Prédiction",
                upper80: "IC 80% (max)",
                lower80: "IC 80% (min)",
                upper95: "IC 95% (max)",
                lower95: "IC 95% (min)",
              };
              return [formattedValue, labels[name || ""] || name || ""];
            }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString("fr-FR", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric"
              });
            }}
          />

          {/* Confidence intervals (render first so they're behind) */}
          <Area
            type="monotone"
            dataKey="upper95"
            stroke="none"
            fill="url(#confidence95)"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="lower95"
            stroke="none"
            fill="white"
            fillOpacity={0}
          />
          <Area
            type="monotone"
            dataKey="upper80"
            stroke="none"
            fill="url(#confidence80)"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="lower80"
            stroke="none"
            fill="white"
            fillOpacity={0}
          />

          {/* Actual historical data */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 3 }}
            activeDot={{ r: 5 }}
            name="actual"
          />

          {/* Predicted values */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "#6366f1", r: 3 }}
            activeDot={{ r: 5 }}
            name="predicted"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
        <p className="text-xs text-blue-200">
          💡 <strong>Prédiction ML (Prophet):</strong> Les zones ombrées représentent les intervalles de confiance.
          Plus la zone est foncée, plus la prédiction est fiable. Les prédictions sont basées sur l'historique et les tendances saisonnières.
        </p>
      </div>
    </GlassPanel>
  );
}
