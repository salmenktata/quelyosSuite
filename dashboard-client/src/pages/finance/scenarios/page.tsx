

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { api } from "@/lib/finance/api";
import { ModularLayout } from "@/components/ModularLayout";
import { GlassCard, GlassStatCard, GlassPanel, GlassButton, GlassBadge, GlassProgress } from "@/components/ui/glass";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  ChevronDown,
  Download,
} from "lucide-react";

// Types
type DailyRow = {
  date: string;
  credit: number;
  debit: number;
  balance: number;
};

type ForecastResponse = {
  days: number;
  baseBalance: number;
  projectedBalance: number;
  futureImpact: number;
  daily: DailyRow[];
};

type Scenario = {
  id: string;
  name: string;
  adjustment: number; // -30 to +30
  color: string;
  visible: boolean;
};

type SavedScenario = {
  id: string;
  name: string;
  scenarios: Scenario[];
  createdAt: string;
  horizon: number;
};

const ADJUSTMENT_PRESETS = [
  { value: -30, label: "-30%", color: "text-red-400" },
  { value: -20, label: "-20%", color: "text-orange-400" },
  { value: -10, label: "-10%", color: "text-amber-400" },
  { value: 0, label: "Base", color: "text-gray-900 dark:text-white" },
  { value: 10, label: "+10%", color: "text-emerald-400" },
  { value: 20, label: "+20%", color: "text-green-400" },
  { value: 30, label: "+30%", color: "text-teal-400" },
];

const SCENARIO_COLORS = [
  "#6366f1", // indigo (baseline)
  "#ef4444", // red (pessimiste)
  "#22c55e", // green (optimiste)
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

const HORIZONS = [30, 60, 90, 180];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { month: "short", day: "numeric" });

export default function ScenariosPage() {
  useRequireAuth();
  const { currency } = useCurrency();

  // Formatters
  const money = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  // State
  const [horizon, setHorizon] = useState(90);
  const [baseData, setBaseData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scénarios
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "baseline", name: "Scénario de base", adjustment: 0, color: SCENARIO_COLORS[0], visible: true },
    { id: "pessimiste", name: "Pessimiste", adjustment: -20, color: SCENARIO_COLORS[1], visible: true },
    { id: "optimiste", name: "Optimiste", adjustment: 20, color: SCENARIO_COLORS[2], visible: true },
  ]);

  // Scénarios sauvegardés
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // Charger données de base
  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api(`/dashboard/forecast?days=${horizon}`)) as ForecastResponse;
      setBaseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [horizon]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Charger scénarios sauvegardés depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quelyos_scenarios");
    if (saved) {
      try {
        setSavedScenarios(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Calculer les données avec ajustements
  const chartData = useMemo(() => {
    if (!baseData?.daily) return [];

    return baseData.daily.map((day) => {
      const row: Record<string, number | string> = {
        date: day.date,
        dateFormatted: formatDate(day.date),
      };

      scenarios.forEach((scenario) => {
        if (scenario.visible) {
          const factor = 1 + scenario.adjustment / 100;
          // Ajuster le solde en fonction de l'ajustement
          const adjustedBalance =
            baseData.baseBalance +
            (day.balance - baseData.baseBalance) * factor;
          row[scenario.id] = Math.round(adjustedBalance);
        }
      });

      return row;
    });
  }, [baseData, scenarios]);

  // Calculer les KPIs par scénario
  const scenarioKPIs = useMemo(() => {
    if (!baseData?.daily || !chartData.length) return [];

    return scenarios
      .filter((s) => s.visible)
      .map((scenario) => {
        const values = chartData.map((d) => (d[scenario.id] as number) || 0);
        const minBalance = Math.min(...values);
        const maxBalance = Math.max(...values);
        const finalBalance = values[values.length - 1] || 0;
        const daysNegative = values.filter((v) => v < 0).length;
        const minDate = chartData.find((d) => d[scenario.id] === minBalance)?.dateFormatted;

        return {
          ...scenario,
          minBalance,
          maxBalance,
          finalBalance,
          daysNegative,
          minDate,
          isRisky: minBalance < 0,
        };
      });
  }, [scenarios, chartData, baseData]);

  // Actions scénarios
  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const addScenario = () => {
    const newId = `scenario_${Date.now()}`;
    const colorIndex = scenarios.length % SCENARIO_COLORS.length;
    setScenarios((prev) => [
      ...prev,
      {
        id: newId,
        name: `Scénario ${prev.length + 1}`,
        adjustment: 0,
        color: SCENARIO_COLORS[colorIndex],
        visible: true,
      },
    ]);
  };

  const removeScenario = (id: string) => {
    if (id === "baseline") return; // Ne pas supprimer la baseline
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  // Sauvegarde
  const saveCurrentScenarios = () => {
    if (!saveName.trim()) return;

    const newSaved: SavedScenario = {
      id: `saved_${Date.now()}`,
      name: saveName.trim(),
      scenarios: [...scenarios],
      createdAt: new Date().toISOString(),
      horizon,
    };

    const updated = [...savedScenarios, newSaved];
    setSavedScenarios(updated);
    localStorage.setItem("quelyos_scenarios", JSON.stringify(updated));
    setSaveName("");
    setShowSaveModal(false);
  };

  const loadSavedScenario = (saved: SavedScenario) => {
    setScenarios(saved.scenarios);
    setHorizon(saved.horizon);
    setShowLoadMenu(false);
  };

  const deleteSavedScenario = (id: string) => {
    const updated = savedScenarios.filter((s) => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem("quelyos_scenarios", JSON.stringify(updated));
  };

  // Export CSV
  const exportCSV = () => {
    if (!chartData.length) return;

    const headers = ["Date", ...scenarios.filter((s) => s.visible).map((s) => s.name)];
    const rows = chartData.map((row) => [
      row.date,
      ...scenarios.filter((s) => s.visible).map((s) => row[s.id] || 0),
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scenarios_${horizon}j_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <ModularLayout>
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">
            Simulateur
          </p>
          <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-3xl font-semibold text-transparent">
            Scénarios de trésorerie
          </h1>
          <p className="text-sm text-indigo-100/80">
            Comparez différents scénarios d&apos;évolution ±10/20/30% et identifiez les risques
          </p>
        </div>

        <div className="flex gap-2">
          {/* Bouton Charger */}
          <div className="relative">
            <button
              onClick={() => setShowLoadMenu(!showLoadMenu)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm backdrop-blur-sm hover:bg-gray-100 dark:bg-gray-700 hover:shadow-lg transition"
            >
              <ChevronDown className="h-4 w-4" />
              Charger
            </button>
            {showLoadMenu && savedScenarios.length > 0 && (
              <GlassCard className="absolute right-0 top-full z-50 mt-2 w-64 p-2">
                {savedScenarios.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-100 dark:bg-gray-800 transition"
                  >
                    <button
                      onClick={() => loadSavedScenario(saved)}
                      className="flex-1 text-left text-sm"
                    >
                      {saved.name}
                      <GlassBadge variant="info" className="ml-2">
                        {saved.horizon}j
                      </GlassBadge>
                    </button>
                    <button
                      onClick={() => deleteSavedScenario(saved.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </GlassCard>
            )}
          </div>

          {/* Bouton Sauvegarder */}
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 rounded-xl border border-indigo-400/50 bg-indigo-500/20 px-4 py-2 text-sm backdrop-blur-sm hover:bg-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/20 transition"
          >
            <Save className="h-4 w-4" />
            Sauvegarder
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm backdrop-blur-sm hover:bg-gray-100 dark:bg-gray-700 hover:shadow-lg transition"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Horizon selector */}
      <div className="relative flex gap-2">
        {HORIZONS.map((h) => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={`rounded-full border px-4 py-2 text-sm transition backdrop-blur-sm ${
              horizon === h
                ? "border-indigo-400 bg-indigo-500/30 text-white shadow-lg shadow-indigo-500/20"
                : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-indigo-100 hover:border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-700"
            }`}
          >
            {h} jours
          </button>
        ))}
      </div>

      {/* Scénarios configurator */}
      <GlassPanel gradient="indigo">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Configuration des scénarios</h2>
          <button
            onClick={addScenario}
            className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs hover:bg-gray-100 dark:bg-gray-700 backdrop-blur-sm transition"
          >
            <Plus className="h-3 w-3" />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <GlassCard
              key={scenario.id}
              variant="subtle"
              className="flex flex-wrap items-center gap-4 p-3"
            >
              {/* Checkbox visibilité */}
              <input
                type="checkbox"
                checked={scenario.visible}
                onChange={(e) =>
                  updateScenario(scenario.id, { visible: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
              />

              {/* Indicateur couleur */}
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: scenario.color }}
              />

              {/* Nom éditable */}
              <input
                type="text"
                value={scenario.name}
                onChange={(e) =>
                  updateScenario(scenario.id, { name: e.target.value })
                }
                className="w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm"
              />

              {/* Ajustement presets */}
              <div className="flex gap-1">
                {ADJUSTMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() =>
                      updateScenario(scenario.id, { adjustment: preset.value })
                    }
                    className={`rounded-lg px-2 py-1 text-xs transition ${
                      scenario.adjustment === preset.value
                        ? "bg-gray-200 dark:bg-gray-700 font-medium " + preset.color
                        : "bg-gray-100 dark:bg-gray-800 text-indigo-200 hover:bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Slider custom */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={5}
                  value={scenario.adjustment}
                  onChange={(e) =>
                    updateScenario(scenario.id, {
                      adjustment: parseInt(e.target.value),
                    })
                  }
                  className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <span className="w-12 text-right text-sm font-medium">
                  {scenario.adjustment >= 0 ? "+" : ""}
                  {scenario.adjustment}%
                </span>
              </div>

              {/* Supprimer */}
              {scenario.id !== "baseline" && (
                <button
                  onClick={() => removeScenario(scenario.id)}
                  className="ml-auto p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </GlassCard>
          ))}
        </div>
      </GlassPanel>

      {/* KPIs par scénario */}
      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarioKPIs.map((kpi) => (
          <GlassCard
            key={kpi.id}
            variant={kpi.isRisky ? "subtle" : "default"}
            className={`p-4 ${kpi.isRisky ? "border-red-400/30 bg-red-500/10" : ""}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: kpi.color }}
              />
              <span className="font-medium">{kpi.name}</span>
              {kpi.isRisky && (
                <AlertTriangle className="ml-auto h-4 w-4 text-red-400" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-indigo-200">Solde final</p>
                <p
                  className={`text-lg font-semibold ${
                    kpi.finalBalance >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {money.format(kpi.finalBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-indigo-200">Solde min</p>
                <p
                  className={`text-lg font-semibold ${
                    kpi.minBalance >= 0 ? "text-gray-900 dark:text-white" : "text-red-400"
                  }`}
                >
                  {money.format(kpi.minBalance)}
                </p>
                {kpi.minDate && (
                  <p className="text-xs text-indigo-300">le {kpi.minDate}</p>
                )}
              </div>
              {kpi.daysNegative > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-red-300">
                    ⚠️ {kpi.daysNegative} jour(s) en découvert
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Graphique comparatif */}
      {loading ? (
        <GlassCard className="flex h-80 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-400 border-t-transparent" />
        </GlassCard>
      ) : error ? (
        <GlassCard variant="subtle" className="border-red-400/30 bg-red-500/10 p-6 text-center text-red-200">
          {error}
        </GlassCard>
      ) : (
        <GlassPanel gradient="purple">
          <h3 className="mb-4 text-lg font-medium">
            Comparaison des scénarios sur {horizon} jours
          </h3>
          <div className="h-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-black/20 p-3">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={chartData}>
                <defs>
                  {scenarios
                    .filter((s) => s.visible)
                    .map((scenario) => (
                      <linearGradient
                        key={`gradient-${scenario.id}`}
                        id={`gradient-${scenario.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={scenario.color}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={scenario.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    ))}
                </defs>
                <XAxis
                  dataKey="dateFormatted"
                  stroke="#a5b4fc"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#a5b4fc"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value: number, name: string) => [
                    money.format(value),
                    scenarios.find((s) => s.id === name)?.name || name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) =>
                    scenarios.find((s) => s.id === value)?.name || value
                  }
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                {scenarios
                  .filter((s) => s.visible)
                  .map((scenario) => (
                    <Area
                      key={scenario.id}
                      type="monotone"
                      dataKey={scenario.id}
                      stroke={scenario.color}
                      strokeWidth={scenario.id === "baseline" ? 3 : 2}
                      fill={`url(#gradient-${scenario.id})`}
                      fillOpacity={1}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      )}

      {/* Tableau détaillé */}
      {chartData.length > 0 && (
        <GlassPanel gradient="indigo">
          <h3 className="mb-4 text-lg font-medium">Données détaillées</h3>
          <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-black/20">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 text-left text-indigo-200">Date</th>
                  {scenarios
                    .filter((s) => s.visible)
                    .map((s) => (
                      <th
                        key={s.id}
                        className="px-3 py-2 text-right"
                        style={{ color: s.color }}
                      >
                        {s.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 30).map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:bg-gray-800 transition"
                  >
                    <td className="px-3 py-2 text-indigo-100">
                      {row.dateFormatted}
                    </td>
                    {scenarios
                      .filter((s) => s.visible)
                      .map((s) => (
                        <td
                          key={s.id}
                          className={`px-3 py-2 text-right ${
                            (row[s.id] as number) < 0
                              ? "text-red-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {money.format(row[s.id] as number)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}

      {/* Modal sauvegarde */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Sauvegarder les scénarios
            </h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Nom de la configuration..."
              className="mb-4 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-indigo-200/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm hover:bg-gray-100 dark:bg-gray-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={saveCurrentScenarios}
                disabled={!saveName.trim()}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 transition"
              >
                Sauvegarder
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
    </ModularLayout>
  );
}
