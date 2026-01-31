

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { GlassPanel } from '@quelyos/ui/glass';
import { useState } from "react";

type TrendChartProps = {
  data: Record<string, unknown>[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
    format?: (value: number) => string;
  }[];
  xAxisKey?: string;
  title: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  defaultMonths?: 3 | 6 | 12;
  onMonthsChange?: (months: number) => void;
};

export function TrendChart({
  data,
  lines,
  xAxisKey = "month",
  title,
  subtitle,
  height = 300,
  showLegend = true,
  defaultMonths = 6,
  onMonthsChange,
}: TrendChartProps) {
  const [selectedMonths, setSelectedMonths] = useState<3 | 6 | 12>(defaultMonths);

  const handleMonthChange = (months: 3 | 6 | 12) => {
    setSelectedMonths(months);
    onMonthsChange?.(months);
  };

  return (
    <GlassPanel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {onMonthsChange && (
          <div className="flex gap-2">
            {([3, 6, 12] as const).map((months) => (
              <button
                key={months}
                onClick={() => handleMonthChange(months)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-all ${
                  selectedMonths === months
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                {months}m
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey={xAxisKey}
            stroke="rgba(255,255,255,0.4)"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => {
              // Format YYYY-MM to MMM YY
              const [year, month] = value.split("-");
              const date = new Date(parseInt(year), parseInt(month) - 1);
              return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
            }}
          />
          <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "12px",
            }}
            labelStyle={{ color: "white", marginBottom: "8px" }}
            itemStyle={{ color: "white" }}
            formatter={(value, name) => {
              const line = lines.find((l) => l.name === name);
              if (line?.format && value !== undefined) {
                return [line.format(value as number), name || ""];
              }
              return [value ?? "", name || ""];
            }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
              formatter={(value) => (
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{value}</span>
              )}
            />
          )}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={{ fill: line.color, r: 4 }}
              activeDot={{ r: 6 }}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </GlassPanel>
  );
}
