

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { useApiData } from "@/hooks/finance/useApiData";
import {
  reportingClient,
  type ReportingFilters,
  type ActualsResponse,
  type ForecastResponse,
  type CombinedResponse,
} from "@/lib/finance/reporting";
import { api } from "@/lib/api";
import {
  GlassCard,
  GlassStatCard,
  GlassPanel,
  GlassButton,
  GlassBadge,
  GlassListItem,
} from "@/components/ui/glass";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Filter,
  Loader2,
  AlertCircle,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { ReportingNav } from "@/components/finance/reporting/ReportingNav";
import { ReportNotice } from "@/components/finance/reporting/ReportNotice";
import { reportingNotices } from "@/lib/finance/reporting-notices";

type DrillTransaction = {
  id?: number;
  type?: string;
  description?: string | null;
  category?: { name?: string | null } | null;
  status?: string | null;
  amount?: number | null;
  amountTTC?: number | null;
  scheduledFor?: string | null;
  occurredAt?: string | null;
};

type Mode = "reel" | "previsionnel" | "combine";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { month: "short", day: "numeric" });

// Custom tooltip component for Recharts (no ChartContainer dependency)
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/20 bg-slate-900/95 px-3 py-2 text-sm shadow-xl backdrop-blur-sm">
      {label && <p className="mb-1 font-medium text-white">{label}</p>}
      {payload.map((item, idx) => (
        <p key={idx} className="flex items-center gap-2 text-indigo-100">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color || "#6366f1" }}
          />
          <span>{item.name || item.dataKey}:</span>
          <span className="font-semibold">
            {formatter ? formatter(item.value) : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function ReportingPage() {
  useRequireAuth();

  const { baseCurrency, formatAmount } = useCurrency();

  const money0 = useMemo(
    () => (amount: number) => formatAmount(amount, baseCurrency),
    [formatAmount, baseCurrency]
  );

  const [mode, setMode] = useState<Mode>("reel");
  const [filters, setFilters] = useState<ReportingFilters>({
    days: 30,
    horizonDays: 30,
    groupBy: "day",
  });

  const [drillDate, setDrillDate] = useState<string | null>(null);
  const [drillTxs, setDrillTxs] = useState<DrillTransaction[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  // Fetch reporting data with automatic caching based on mode
  const {
    data: reportingData,
    loading,
    error: reportingError,
    refetch,
  } = useApiData<ActualsResponse | ForecastResponse | CombinedResponse>({
    fetcher: async () => {
      if (mode === "reel") {
        return await reportingClient.actuals(filters);
      } else if (mode === "previsionnel") {
        return await reportingClient.forecast(filters);
      } else {
        return await reportingClient.combined(filters);
      }
    },
    cacheKey: `reporting-${mode}-${filters.days}-${filters.horizonDays}-${filters.groupBy}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    deps: [mode, filters],
  });

  const error = reportingError?.message || null;

  // Type-safe data extraction based on mode
  const actualsData = mode === "reel" ? (reportingData as ActualsResponse | null) : null;
  const forecastData = mode === "previsionnel" ? (reportingData as ForecastResponse | null) : null;
  const combinedData = mode === "combine" ? (reportingData as CombinedResponse | null) : null;

  const isEmpty = useMemo(() => {
    return !reportingData;
  }, [reportingData]);

  const buildRows = useCallback(() => {
    if (mode === "reel" && actualsData) {
      return actualsData.daily.map((d) => ({
        date: d.date,
        credit: d.credit,
        debit: d.debit,
        balance: d.balance || 0,
      }));
    }
    if (mode === "previsionnel" && forecastData) {
      return forecastData.daily.map((d) => ({
        date: d.date,
        plannedCredit: d.plannedCredit || 0,
        plannedDebit: d.plannedDebit || 0,
        projectedBalance: d.projectedBalance || 0,
      }));
    }
    if (mode === "combine" && combinedData) {
      return combinedData.daily.map((d) => ({
        date: d.date,
        balance: d.balance || 0,
        plannedNet: d.plannedNet || 0,
      }));
    }
    return [] as Record<string, unknown>[];
  }, [mode, actualsData, forecastData, combinedData]);

  const exportCsv = useCallback(() => {
    const rows = buildRows();
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `${(r as Record<string, unknown>)[h] ?? ""}`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporting-${mode}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [buildRows, mode]);

  const exportXlsx = useCallback(async () => {
    const rows = buildRows();
    if (!rows.length) return;
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Reporting");
    const headers = Object.keys(rows[0]);
    ws.addRow(headers);
    rows.forEach((r) => {
      ws.addRow(headers.map((h) => (r[h] ?? "") as string | number));
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporting-${mode}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [buildRows, mode]);

  const chartData = useMemo(() => {
    if (mode === "reel" && actualsData) {
      return actualsData.daily.map((d) => ({
        date: formatDate(d.date),
        rawDate: d.date,
        balance: d.balance || 0,
        credit: d.credit,
        debit: d.debit,
      }));
    }
    if (mode === "previsionnel" && forecastData) {
      return forecastData.daily.map((d) => ({
        date: formatDate(d.date),
        rawDate: d.date,
        projectedBalance: d.projectedBalance || 0,
        plannedCredit: d.plannedCredit || 0,
        plannedDebit: d.plannedDebit || 0,
      }));
    }
    if (mode === "combine" && combinedData) {
      return combinedData.daily.map((d) => ({
        date: formatDate(d.date),
        rawDate: d.date,
        balance: d.balance || 0,
        plannedNet: d.plannedNet || 0,
      }));
    }
    return [];
  }, [mode, actualsData, forecastData, combinedData]);

  const handleDrilldown = useCallback(async (rawDate?: string | null) => {
    if (!rawDate) return;
    setDrillDate(rawDate);
    setDrillLoading(true);
    setDrillError(null);
    try {
      const txs = (await api(`/transactions`)) as DrillTransaction[];
      const day = new Date(rawDate);
      day.setHours(0, 0, 0, 0);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);

      const filtered = txs.filter((t) => {
        const dateStr =
          t.status === "PLANNED" || t.status === "SCHEDULED"
            ? (t.scheduledFor ?? t.occurredAt ?? "")
            : (t.occurredAt ?? "");
        const when = new Date(dateStr);
        return when >= day && when < next;
      });
      setDrillTxs(filtered);
    } catch (err) {
      setDrillError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des transactions"
      );
    } finally {
      setDrillLoading(false);
    }
  }, []);

  const kpis = useMemo(() => {
    if (mode === "reel" && actualsData) {
      return {
        primary: {
          label: "Solde fin période",
          value: actualsData.endBalance,
          trend: actualsData.net,
        },
        secondary: [
          { label: "Total crédits", value: actualsData.totalCredit },
          { label: "Total débits", value: actualsData.totalDebit },
          { label: "Net période", value: actualsData.net },
        ],
      };
    }
    if (mode === "previsionnel" && forecastData) {
      return {
        primary: {
          label: "Atterrissage projeté",
          value: forecastData.projectedBalance,
          trend: forecastData.futureImpact,
        },
        secondary: [
          { label: "Solde actuel", value: forecastData.baseBalance },
          { label: "Impact futur", value: forecastData.futureImpact },
          { label: "Horizon", value: `${forecastData.days}j` },
        ],
      };
    }
    if (mode === "combine" && combinedData) {
      return {
        primary: {
          label: "Atterrissage",
          value: combinedData.landingBalance,
          trend: combinedData.futureImpact,
        },
        secondary: [
          { label: "Solde actuel", value: combinedData.currentBalance },
          { label: "Impact futur", value: combinedData.futureImpact },
          {
            label: "Runway",
            value: combinedData.runwayDays
              ? `${combinedData.runwayDays}j`
              : "N/A",
          },
        ],
      };
    }
    return null;
  }, [mode, actualsData, forecastData, combinedData]);

  const topCategories = useMemo(() => {
    if (mode === "reel" && actualsData?.categoryTotals) {
      return {
        income: actualsData.categoryTotals.income.slice(0, 3),
        expense: actualsData.categoryTotals.expense.slice(0, 3),
      };
    }
    return { income: [], expense: [] };
  }, [mode, actualsData]);

  return (
    <div className="min-h-screen p-6 pt-16">
      <div className="mx-auto max-w-7xl">
        {/* Navigation rapide entre rapports */}
        <ReportingNav />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Vue d&apos;ensemble
              </h1>
              <p className="text-sm text-slate-400">
                KPIs, tendances et synthèse globale de votre activité
              </p>
            </div>
          </div>
        </div>

        {/* Report Notice */}
        <ReportNotice
          title={reportingNotices.overview.title}
          purpose={reportingNotices.overview.purpose}
          tracking={reportingNotices.overview.tracking}
          icon={BarChart3}
          reportId="overview"
        />

        <div className="space-y-6">
          {/* Lien vers rapport par flux */}
          <Link to={ROUTES.FINANCE.DASHBOARD.REPORTING}>
            <GlassCard
              variant="subtle"
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <CreditCard className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Rapport par flux de paiement
                  </p>
                  <p className="text-sm text-white/60">
                    Analysez vos transactions par type de flux (CB, chèque,
                    virement...)
                  </p>
                </div>
              </div>
              <div className="text-white/40 group-hover:text-white/70 transition">
                →
              </div>
            </GlassCard>
          </Link>

          {error && (
            <GlassCard
              variant="subtle"
              className="flex items-center gap-2 border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <button
                onClick={refetch}
                className="ml-auto rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Réessayer
              </button>
            </GlassCard>
          )}

          {/* Switch Mode */}
          <div className="relative flex flex-wrap items-center gap-3">
            <GlassCard variant="subtle" className="inline-flex p-1">
              {(["reel", "previsionnel", "combine"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    mode === m
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                      : "text-indigo-100 hover:bg-white/10"
                  }`}
                >
                  {m === "reel"
                    ? "Réel"
                    : m === "previsionnel"
                      ? "Prévisionnel"
                      : "Combiné"}
                </button>
              ))}
            </GlassCard>

            <div className="flex items-center gap-2">
              <select
                value={mode === "reel" ? filters.days : filters.horizonDays}
                onChange={(e) =>
                  setFilters((f) =>
                    mode === "reel"
                      ? { ...f, days: Number(e.target.value) }
                      : { ...f, horizonDays: Number(e.target.value) }
                  )
                }
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-indigo-400 focus:outline-none"
              >
                <option value={7}>7 jours</option>
                <option value={30}>30 jours</option>
                <option value={60}>60 jours</option>
                <option value={90}>90 jours</option>
              </select>

              <select
                value={filters.groupBy}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    groupBy: e.target.value as "day" | "week" | "month",
                  }))
                }
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-indigo-400 focus:outline-none"
              >
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
              </select>

              <button
                onClick={refetch}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-white/10 hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Filter size={16} />
                )}
                Actualiser
              </button>

              <button
                onClick={exportCsv}
                disabled={loading || isEmpty}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-white/10 hover:shadow-lg disabled:opacity-50"
              >
                CSV
              </button>

              <button
                onClick={exportXlsx}
                disabled={loading || isEmpty}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-white/10 hover:shadow-lg disabled:opacity-50"
              >
                Excel
              </button>
            </div>
          </div>

          {loading && (
            <GlassCard className="grid gap-4 p-4">
              <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-32 w-full animate-pulse rounded bg-white/10" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-white/10"
                  />
                ))}
              </div>
            </GlassCard>
          )}

          {!loading && isEmpty && !error && (
            <GlassCard className="flex items-center gap-3 px-4 py-6 text-sm text-indigo-100">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">
                  Aucune donnée pour l&apos;instant
                </p>
                <p className="text-indigo-100/80">
                  Ajoutez des transactions (réelles ou planifiées) pour
                  alimenter le reporting.
                </p>
              </div>
            </GlassCard>
          )}

          {/* KPIs */}
          {kpis && (
            <div className="relative grid gap-4 md:grid-cols-4">
              <GlassStatCard
                label={kpis.primary.label}
                value={
                  typeof kpis.primary.value === "number"
                    ? money0(kpis.primary.value)
                    : String(kpis.primary.value)
                }
                accentColor="indigo"
                icon={
                  typeof kpis.primary.trend === "number" &&
                  kpis.primary.trend >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )
                }
              />

              {kpis.secondary.map((kpi, idx) => (
                <GlassStatCard
                  key={idx}
                  label={kpi.label}
                  value={
                    typeof kpi.value === "number"
                      ? money0(kpi.value)
                      : String(kpi.value)
                  }
                  accentColor={
                    idx === 0 ? "emerald" : idx === 1 ? "rose" : "cyan"
                  }
                />
              ))}
            </div>
          )}

          {/* Graphique principal */}
          {chartData.length > 0 && (
            <GlassPanel gradient="indigo">
              <h3 className="mb-4 text-lg font-semibold">
                {mode === "reel"
                  ? "Évolution du solde"
                  : mode === "previsionnel"
                    ? "Projection du solde"
                    : "Solde réel + prévisionnel"}
              </h3>
              <div className="h-80 rounded-xl border border-white/5 bg-black/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    onClick={(e) =>
                      handleDrilldown(e?.activePayload?.[0]?.payload?.rawDate)
                    }
                  >
                    <defs>
                      <linearGradient
                        id="colorBalance"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#a5b4fc"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#a5b4fc"
                      style={{ fontSize: 12 }}
                      tickFormatter={(v) => money0(v)}
                    />
                    <RechartsTooltip
                      content={
                        <CustomTooltip formatter={(v) => money0(v)} />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey={
                        mode === "previsionnel" ? "projectedBalance" : "balance"
                      }
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#colorBalance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>
          )}

          {/* Barres crédit/débit (mode réel uniquement) */}
          {mode === "reel" && chartData.length > 0 && (
            <GlassPanel gradient="purple">
              <h3 className="mb-4 text-lg font-semibold">
                Flux crédits & débits
              </h3>
              <div className="h-64 rounded-xl border border-white/5 bg-black/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    onClick={(e) =>
                      handleDrilldown(e?.activePayload?.[0]?.payload?.rawDate)
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#a5b4fc"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#a5b4fc"
                      style={{ fontSize: 12 }}
                      tickFormatter={(v) => money0(v)}
                    />
                    <RechartsTooltip
                      content={
                        <CustomTooltip formatter={(v) => money0(v)} />
                      }
                    />
                    <Bar
                      dataKey="credit"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="debit" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>
          )}

          {/* Top catégories (mode réel uniquement) */}
          {mode === "reel" &&
            (topCategories.income.length > 0 ||
              topCategories.expense.length > 0) && (
              <GlassPanel gradient="indigo">
                <h3 className="mb-4 text-lg font-semibold">Top catégories</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                      Revenus
                    </p>
                    {topCategories.income.length === 0 && (
                      <p className="text-xs text-indigo-100/70">
                        Aucune catégorie
                      </p>
                    )}
                    {topCategories.income.map((cat) => (
                      <div
                        key={cat.categoryId || 0}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        <span>{cat.name}</span>
                        <span className="font-semibold text-emerald-300">
                          {money0(cat.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-300">
                      Dépenses
                    </p>
                    {topCategories.expense.length === 0 && (
                      <p className="text-xs text-indigo-100/70">
                        Aucune catégorie
                      </p>
                    )}
                    {topCategories.expense.map((cat) => (
                      <div
                        key={cat.categoryId || 0}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        <span>{cat.name}</span>
                        <span className="font-semibold text-rose-300">
                          {money0(cat.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassPanel>
            )}

          {drillDate && (
            <GlassPanel gradient="purple">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold">
                  Transactions du {formatDate(drillDate)}
                </h3>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleDrilldown(drillDate)}
                    disabled={drillLoading}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white backdrop-blur-sm hover:bg-white/10 transition disabled:opacity-50"
                  >
                    {drillLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Rafraîchir"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setDrillDate(null);
                      setDrillTxs([]);
                      setDrillError(null);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white backdrop-blur-sm hover:bg-white/10 transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              {drillError && (
                <GlassCard
                  variant="subtle"
                  className="mt-3 flex items-center gap-2 border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                >
                  <AlertCircle size={16} />
                  <span>{drillError}</span>
                </GlassCard>
              )}

              {drillLoading && (
                <div className="mt-4 grid gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-lg bg-white/10"
                    />
                  ))}
                </div>
              )}

              {!drillLoading && drillTxs.length === 0 && !drillError && (
                <p className="mt-4 text-sm text-indigo-100/80">
                  Aucune transaction ce jour.
                </p>
              )}

              {!drillLoading && drillTxs.length > 0 && (
                <div className="mt-4 space-y-3">
                  {drillTxs.map((t) => (
                    <GlassListItem
                      key={t.id}
                      className="gap-3 px-3 py-2 text-sm"
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${t.type === "credit" ? "bg-emerald-400" : "bg-rose-400"}`}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">
                          {t.description || "Transaction"}
                        </p>
                        <p className="text-xs text-indigo-100/70">
                          {t.category?.name || "Sans catégorie"} • {t.status}
                        </p>
                      </div>
                      <div className="text-right text-sm font-semibold">
                        {money0(Number(t.amountTTC ?? t.amount ?? 0))}
                      </div>
                    </GlassListItem>
                  ))}
                </div>
              )}
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
