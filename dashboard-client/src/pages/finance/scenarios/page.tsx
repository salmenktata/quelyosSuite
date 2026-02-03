/**
 * Page Scénarios de Trésorerie
 *
 * Fonctionnalités :
 * - Comparaison de scénarios ±10/20/30% de variation
 * - Configuration dynamique des scénarios (nom, ajustement, visibilité)
 * - Graphique comparatif avec zones de risque (ligne rouge à 0)
 * - Sauvegarde/chargement de configurations en localStorage
 * - Export CSV des projections
 * - KPIs par scénario (solde final, min, jours en découvert)
 * - Sélection horizon temporel (30, 60, 90, 180 jours)
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Layout } from "@/components/Layout"
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from "@/components/common"
import { useRequireAuth } from "@/lib/finance/compat/auth"
import { financeNotices } from "@/lib/notices/finance-notices"
import { useCurrency } from "@/lib/finance/CurrencyContext"
import { api } from "@/lib/finance/api"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import { logger } from '@quelyos/logger';
import {
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  ChevronDown,
  Download,
  GitBranch,
} from "lucide-react"

// Types
type DailyRow = {
  date: string
  credit: number
  debit: number
  balance: number
}

type ForecastResponse = {
  days: number
  baseBalance: number
  projectedBalance: number
  futureImpact: number
  daily: DailyRow[]
}

type Scenario = {
  id: string
  name: string
  adjustment: number
  color: string
  visible: boolean
}

type SavedScenario = {
  id: string
  name: string
  scenarios: Scenario[]
  createdAt: string
  horizon: number
}

const ADJUSTMENT_PRESETS = [
  { value: -30, label: "-30%" },
  { value: -20, label: "-20%" },
  { value: -10, label: "-10%" },
  { value: 0, label: "Base" },
  { value: 10, label: "+10%" },
  { value: 20, label: "+20%" },
  { value: 30, label: "+30%" },
]

const SCENARIO_COLORS = [
  "#6366f1", // indigo (baseline)
  "#ef4444", // red (pessimiste)
  "#22c55e", // green (optimiste)
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
]

const HORIZONS = [30, 60, 90, 180]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })

export default function ScenariosPage() {
  useRequireAuth()
  const { currency } = useCurrency()

  const money = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  )

  // State
  const [horizon, setHorizon] = useState(90)
  const [baseData, setBaseData] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "baseline", name: "Scénario de base", adjustment: 0, color: SCENARIO_COLORS[0]!, visible: true },
    { id: "pessimiste", name: "Pessimiste", adjustment: -20, color: SCENARIO_COLORS[1]!, visible: true },
    { id: "optimiste", name: "Optimiste", adjustment: 20, color: SCENARIO_COLORS[2]!, visible: true },
  ])

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([])
  const [saveName, setSaveName] = useState("")
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadMenu, setShowLoadMenu] = useState(false)

  // Fetch data
  const fetchForecast = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = (await api(`/dashboard/forecast?days=${horizon}`)) as ForecastResponse
      setBaseData(data)
    } catch (err) {
      logger.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [horizon])

  useEffect(() => {
    fetchForecast()
  }, [fetchForecast])

  useEffect(() => {
    const saved = localStorage.getItem("quelyos_scenarios")
    if (saved) {
      try {
        setSavedScenarios(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  // Chart data
  const chartData = useMemo(() => {
    if (!baseData?.daily) return []

    return baseData.daily.map((day) => {
      const row: Record<string, number | string> = {
        date: day.date,
        dateFormatted: formatDate(day.date),
      }

      scenarios.forEach((scenario) => {
        if (scenario.visible) {
          const factor = 1 + scenario.adjustment / 100
          const adjustedBalance =
            baseData.baseBalance + (day.balance - baseData.baseBalance) * factor
          row[scenario.id] = Math.round(adjustedBalance)
        }
      })

      return row
    })
  }, [baseData, scenarios])

  // KPIs
  const scenarioKPIs = useMemo(() => {
    if (!baseData?.daily || !chartData.length) return []

    return scenarios
      .filter((s) => s.visible)
      .map((scenario) => {
        const values = chartData.map((d) => (d[scenario.id] as number) || 0)
        const minBalance = Math.min(...values)
        const maxBalance = Math.max(...values)
        const finalBalance = values[values.length - 1] || 0
        const daysNegative = values.filter((v) => v < 0).length
        const minDate = chartData.find((d) => d[scenario.id] === minBalance)?.dateFormatted

        return {
          ...scenario,
          minBalance,
          maxBalance,
          finalBalance,
          daysNegative,
          minDate,
          isRisky: minBalance < 0,
        }
      })
  }, [scenarios, chartData, baseData])

  // Actions
  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addScenario = () => {
    const newId = `scenario_${Date.now()}`
    const colorIndex = scenarios.length % SCENARIO_COLORS.length
    setScenarios((prev) => [
      ...prev,
      {
        id: newId,
        name: `Scénario ${prev.length + 1}`,
        adjustment: 0,
        color: SCENARIO_COLORS[colorIndex]!,
        visible: true,
      },
    ])
  }

  const removeScenario = (id: string) => {
    if (id === "baseline") return
    setScenarios((prev) => prev.filter((s) => s.id !== id))
  }

  const saveCurrentScenarios = () => {
    if (!saveName.trim()) return

    const newSaved: SavedScenario = {
      id: `saved_${Date.now()}`,
      name: saveName.trim(),
      scenarios: [...scenarios],
      createdAt: new Date().toISOString(),
      horizon,
    }

    const updated = [...savedScenarios, newSaved]
    setSavedScenarios(updated)
    localStorage.setItem("quelyos_scenarios", JSON.stringify(updated))
    setSaveName("")
    setShowSaveModal(false)
  }

  const loadSavedScenario = (saved: SavedScenario) => {
    setScenarios(saved.scenarios)
    setHorizon(saved.horizon)
    setShowLoadMenu(false)
  }

  const deleteSavedScenario = (id: string) => {
    const updated = savedScenarios.filter((s) => s.id !== id)
    setSavedScenarios(updated)
    localStorage.setItem("quelyos_scenarios", JSON.stringify(updated))
  }

  const exportCSV = () => {
    if (!chartData.length) return

    const headers = ["Date", ...scenarios.filter((s) => s.visible).map((s) => s.name)]
    const rows = chartData.map((row) => [
      row.date,
      ...scenarios.filter((s) => s.visible).map((s) => row[s.id] || 0),
    ])

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `scenarios_${horizon}j_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Tableau de bord", href: "/dashboard" },
            { label: "Finance", href: "/finance" },
            { label: "Scénarios" },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-emerald-600" />
              Scénarios de trésorerie
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comparez différents scénarios d'évolution et identifiez les risques
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Load button */}
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setShowLoadMenu(!showLoadMenu)}
                icon={<ChevronDown className="h-4 w-4" />}
              >
                Charger
              </Button>
              {showLoadMenu && savedScenarios.length > 0 && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                  {savedScenarios.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Button
                        onClick={() => loadSavedScenario(saved)}
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start text-left text-sm text-gray-900 dark:text-white"
                      >
                        {saved.name}
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {saved.horizon}j
                        </span>
                      </Button>
                      <Button
                        onClick={() => deleteSavedScenario(saved.id)}
                        variant="ghost"
                        size="sm"
                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={() => setShowSaveModal(true)}
              icon={<Save className="h-4 w-4" />}
            >
              Sauvegarder
            </Button>

            <Button
              variant="secondary"
              onClick={exportCSV}
              icon={<Download className="h-4 w-4" />}
            >
              CSV
            </Button>
          </div>
        </div>

        <PageNotice config={financeNotices['scenarios']} className="mb-2" />

        {/* Horizon selector */}
        <div className="flex gap-2 flex-wrap">
          {HORIZONS.map((h) => (
            <Button
              key={h}
              onClick={() => setHorizon(h)}
              variant={horizon === h ? "primary" : "secondary"}
              size="sm"
              className="rounded-full"
            >
              {h} jours
            </Button>
          ))}
        </div>

        {/* Scenarios config */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuration des scénarios
            </h2>
            <Button variant="secondary" size="sm" onClick={addScenario} icon={<Plus className="h-4 w-4" />}>
              Ajouter
            </Button>
          </div>

          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={scenario.visible}
                  onChange={(e) => updateScenario(scenario.id, { visible: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />

                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: scenario.color }}
                />

                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                  className="w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                />

                <div className="flex gap-1 flex-wrap">
                  {ADJUSTMENT_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      onClick={() => updateScenario(scenario.id, { adjustment: preset.value })}
                      variant={scenario.adjustment === preset.value ? "primary" : "secondary"}
                      size="sm"
                      className="px-2 py-1 text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={5}
                    value={scenario.adjustment}
                    onChange={(e) => updateScenario(scenario.id, { adjustment: parseInt(e.target.value) })}
                    className="h-1 w-24 cursor-pointer"
                  />
                  <span className="w-12 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {scenario.adjustment >= 0 ? "+" : ""}{scenario.adjustment}%
                  </span>
                </div>

                {scenario.id !== "baseline" && (
                  <Button
                    onClick={() => removeScenario(scenario.id)}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarioKPIs.map((kpi) => (
            <div
              key={kpi.id}
              className={`p-4 rounded-lg border ${
                kpi.isRisky
                  ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: kpi.color }} />
                <span className="font-medium text-gray-900 dark:text-white">{kpi.name}</span>
                {kpi.isRisky && <AlertTriangle className="ml-auto h-4 w-4 text-red-500" />}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solde final</p>
                  <p className={`text-lg font-semibold ${kpi.finalBalance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {money.format(kpi.finalBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solde min</p>
                  <p className={`text-lg font-semibold ${kpi.minBalance >= 0 ? "text-gray-900 dark:text-white" : "text-red-500"}`}>
                    {money.format(kpi.minBalance)}
                  </p>
                  {kpi.minDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">le {kpi.minDate}</p>
                  )}
                </div>
                {kpi.daysNegative > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-red-500">{kpi.daysNegative} jour(s) en découvert</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {loading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : error ? (
          <div role="alert" className="p-6 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="secondary" onClick={fetchForecast}>Réessayer</Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Comparaison sur {horizon} jours
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <AreaChart data={chartData}>
                  <defs>
                    {scenarios.filter((s) => s.visible).map((scenario) => (
                      <linearGradient key={`gradient-${scenario.id}`} id={`gradient-${scenario.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={scenario.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={scenario.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="dateFormatted" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "8px",
                    }}
                    formatter={(value, name) => [
                      money.format(Number(value) || 0),
                      scenarios.find((s) => s.id === name)?.name || String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} formatter={(value) => scenarios.find((s) => s.id === value)?.name || value} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                  {scenarios.filter((s) => s.visible).map((scenario) => (
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
          </div>
        )}

        {/* Data table */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Données détaillées</h3>
            <div className="max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">Date</th>
                    {scenarios.filter((s) => s.visible).map((s) => (
                      <th key={s.id} className="px-3 py-2 text-right" style={{ color: s.color }}>
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice(0, 30).map((row, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{row.dateFormatted}</td>
                      {scenarios.filter((s) => s.visible).map((s) => (
                        <td
                          key={s.id}
                          className={`px-3 py-2 text-right ${(row[s.id] as number) < 0 ? "text-red-500" : "text-gray-900 dark:text-white"}`}
                        >
                          {money.format(row[s.id] as number)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Save modal */}
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Sauvegarder les scénarios
              </h3>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Nom de la configuration..."
                className="mb-4 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
                  Annuler
                </Button>
                <Button variant="primary" onClick={saveCurrentScenarios} disabled={!saveName.trim()}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
