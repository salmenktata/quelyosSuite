"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import type { ForecastDailyPoint, EventAnnotation } from "@/lib/finance/reporting";

type ForecastChartProps = {
  data: ForecastDailyPoint[];
  scenarios: {
    optimistic: boolean;
    realistic: boolean;
    pessimistic: boolean;
  };
  confidenceBands: number[]; // [80, 95]
  events: EventAnnotation[];
};

export function ForecastChart({
  data,
  scenarios,
  confidenceBands,
  events,
}: ForecastChartProps) {
  const { baseCurrency, formatAmount } = useCurrency();
  const formatCurrency = (amount: number) => formatAmount(amount, baseCurrency);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">Aucune donnée de prévision disponible</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={500}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        <XAxis
          dataKey="date"
          tickFormatter={(date) => {
            const d = new Date(date);
            return d.toLocaleDateString("fr-FR", {
              month: "short",
              day: "numeric",
            });
          }}
          stroke="#6b7280"
          style={{ fontSize: 12 }}
        />

        <YAxis
          tickFormatter={(value) => {
            // Format as k (thousands)
            if (Math.abs(value) >= 1000) {
              return `${(value / 1000).toFixed(0)}k€`;
            }
            return `${value.toFixed(0)}€`;
          }}
          stroke="#6b7280"
          style={{ fontSize: 12 }}
        />

        {/* 95% Confidence Band */}
        {confidenceBands.includes(95) && (
          <Area
            type="monotone"
            dataKey="confidence95.upper"
            stroke="none"
            fill="#6366f1"
            fillOpacity={0.05}
            name="Conf. 95% (haut)"
          />
        )}
        {confidenceBands.includes(95) && (
          <Area
            type="monotone"
            dataKey="confidence95.lower"
            stroke="none"
            fill="#6366f1"
            fillOpacity={0.05}
            name="Conf. 95% (bas)"
          />
        )}

        {/* 80% Confidence Band */}
        {confidenceBands.includes(80) && (
          <Area
            type="monotone"
            dataKey="confidence80.upper"
            stroke="none"
            fill="#6366f1"
            fillOpacity={0.15}
            name="Conf. 80% (haut)"
          />
        )}
        {confidenceBands.includes(80) && (
          <Area
            type="monotone"
            dataKey="confidence80.lower"
            stroke="none"
            fill="#6366f1"
            fillOpacity={0.15}
            name="Conf. 80% (bas)"
          />
        )}

        {/* Scenario Lines */}
        {scenarios.optimistic && (
          <Line
            type="monotone"
            dataKey="scenarios.optimistic"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Optimiste (+15%)"
          />
        )}

        {/* Main Prediction Line */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#6366f1"
          strokeWidth={3}
          dot={false}
          name="Prévision réaliste"
        />

        {scenarios.pessimistic && (
          <Line
            type="monotone"
            dataKey="scenarios.pessimistic"
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Pessimiste (-15%)"
          />
        )}

        {/* Event Markers */}
        {events.map((event, idx) => (
          <ReferenceLine
            key={idx}
            x={event.date}
            stroke="#fbbf24"
            strokeDasharray="3 3"
            label={{
              value: event.label,
              position: "top",
              fill: "#f59e0b",
              fontSize: 11,
            }}
          />
        ))}

        {/* Zero Line */}
        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />

        <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="line"
          iconSize={14}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
  formatCurrency: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatCurrency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const date = new Date(label || '');

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-xl">
      <p className="font-semibold text-gray-900 mb-2 text-sm">
        {date.toLocaleDateString("fr-FR", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>

      {payload.map((entry, idx: number) => {
        // Skip confidence bands in tooltip (too cluttered)
        if (
          entry.dataKey?.includes("confidence80") ||
          entry.dataKey?.includes("confidence95")
        ) {
          return null;
        }

        return (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 text-xs mb-1"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
            </div>
            <span className="font-semibold text-gray-900">
              {formatCurrency(entry.value)}
            </span>
          </div>
        );
      })}

      {/* Show components if available */}
      {payload[0]?.payload?.components && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Composants:</p>
          <div className="text-xs text-gray-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Tendance:</span>
              <span>{formatCurrency(payload[0].payload.components.trend)}</span>
            </div>
            <div className="flex justify-between">
              <span>Saisonnier:</span>
              <span>
                {formatCurrency(payload[0].payload.components.seasonal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Planifié:</span>
              <span>
                {formatCurrency(payload[0].payload.components.planned)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
