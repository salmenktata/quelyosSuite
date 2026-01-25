

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  ChevronDown,
  Calendar,
  Target,
  Sparkles,
  Info,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BarChart3
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { GlassCard, GlassPanel, GlassStatCard } from "@/components/ui/glass";
import { EventMarkers } from "@/components/finance/forecast/EventMarkers";
import { ForecastExport } from "@/components/finance/forecast/ForecastExport";
import { OptimizedForecastChart } from "@/components/finance/forecast/OptimizedForecastChart";
import WhatIfSimulator from "@/components/finance/forecast/WhatIfSimulator";
import { AccuracyMetrics } from "@/components/finance/forecast/AccuracyMetrics";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

const horizons = [7, 30, 90, 180] as const;
type Horizon = typeof horizons[number];

type DailyRow = {
  date: string;
  credit: number;
  debit: number;
  plannedCredit: number;
  plannedDebit: number;
  balance: number;
  // Prophet-specific fields
  predicted?: number;
  confidence80?: { upper: number; lower: number };
  confidence95?: { upper: number; lower: number };
  scenarios?: { optimistic: number; realistic: number; pessimistic: number };
  components?: { trend: number; seasonal: number; planned: number };
};

type ForecastAccount = {
  accountId: number;
  accountName: string;
  baseBalance: number;
  projectedBalance: number;
  daily: DailyRow[];
};

type EventAnnotation = {
  id?: number;
  date: string;
  label: string;
  description?: string;
  type: "auto" | "manual" | "imported";
  confidence?: number;
};

type ForecastResponse = {
  days: number;
  baseBalance: number;
  projectedBalance: number;
  futureImpact: number;
  daily: DailyRow[];
  perAccount: ForecastAccount[];
  // Prophet-specific fields
  events?: EventAnnotation[];
  model?: {
    type: "prophet" | "simple";
    trainedOn: number;
    horizonDays: number;
    accuracy?: { mape: number };
  };
  trends?: {
    avgDailyIncome: number;
    avgDailyExpense: number;
    avgDailyNet: number;
  };
};

// Simulation ML - zone de confiance
interface ConfidenceZone {
  date: string;
  predicted: number;
  upperBound: number;  // +15%
  lowerBound: number;  // -15%
  optimistic: number;  // +25%
  pessimistic: number; // -25%
}

type RiskLevel = "low" | "medium" | "high" | "critical";

interface RiskIndicator {
  level: RiskLevel;
  score: number; // 0-100
  daysToNegative: number | null;
  minimumBalance: number;
  alerts: string[];
}

type ScenarioImpact = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: "expense" | "revenue" | "delay";
  enabled: boolean;
  value: number;
  unit: "€" | "days";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

function generateConfidenceZones(daily: DailyRow[], baseBalance: number): ConfidenceZone[] {
  let runningBalance = baseBalance;

  return daily.map((row, index) => {
    // If Prophet data is available, use it directly
    if (row.predicted !== undefined && row.confidence80 && row.scenarios) {
      return {
        date: row.date,
        predicted: row.predicted,
        upperBound: row.confidence80.upper,
        lowerBound: row.confidence80.lower,
        optimistic: row.scenarios.optimistic,
        pessimistic: row.scenarios.pessimistic,
      };
    }

    // Otherwise, fallback to local calculation
    const dayVariation = row.plannedCredit - row.plannedDebit + row.credit - row.debit;
    runningBalance += dayVariation;

    // Incertitude croissante avec le temps (ML simulation)
    const uncertaintyFactor = 1 + (index * 0.002); // +0.2% par jour
    const baseUncertainty = 0.08; // 8% de base
    const uncertainty = baseUncertainty * uncertaintyFactor;

    return {
      date: row.date,
      predicted: runningBalance,
      upperBound: runningBalance * (1 + uncertainty),
      lowerBound: runningBalance * (1 - uncertainty),
      optimistic: runningBalance * (1 + uncertainty * 2),
      pessimistic: runningBalance * (1 - uncertainty * 2),
    };
  });
}

function calculateRiskIndicator(zones: ConfidenceZone[], baseBalance: number): RiskIndicator {
  const alerts: string[] = [];
  let minimumBalance = Infinity;
  let daysToNegative: number | null = null;
  
  // Analyse des projections
  zones.forEach((zone, index) => {
    if (zone.pessimistic < minimumBalance) {
      minimumBalance = zone.pessimistic;
    }
    
    // Détection du premier jour négatif (scénario pessimiste)
    if (zone.pessimistic < 0 && daysToNegative === null) {
      daysToNegative = index + 1;
    }
  });
  
  // Calcul du score de risque (0-100)
  let score = 0;
  
  // Facteur 1: Ratio solde minimum / solde actuel
  const balanceRatio = minimumBalance / baseBalance;
  if (balanceRatio < 0) score += 50;
  else if (balanceRatio < 0.2) score += 35;
  else if (balanceRatio < 0.5) score += 20;
  else if (balanceRatio < 0.8) score += 10;
  
  // Facteur 2: Jours avant solde négatif
  if (daysToNegative !== null) {
    if (daysToNegative < 15) score += 40;
    else if (daysToNegative < 30) score += 25;
    else if (daysToNegative < 60) score += 15;
    else score += 5;
  }
  
  // Facteur 3: Volatilité (différence entre optimiste et pessimiste)
  const lastZone = zones[zones.length - 1];
  if (lastZone) {
    const volatility = (lastZone.optimistic - lastZone.pessimistic) / lastZone.predicted;
    if (volatility > 0.5) score += 10;
    else if (volatility > 0.3) score += 5;
  }
  
  // Détermination du niveau
  let level: RiskLevel;
  if (score >= 70) level = "critical";
  else if (score >= 45) level = "high";
  else if (score >= 25) level = "medium";
  else level = "low";
  
  // Génération des alertes
  if (daysToNegative !== null && daysToNegative < 30) {
    alerts.push(`Risque de solde négatif dans ${daysToNegative} jours (scénario pessimiste)`);
  }
  if (minimumBalance < baseBalance * 0.3) {
    alerts.push("Solde minimum projeté inférieur à 30% du solde actuel");
  }
  if (level === "high" || level === "critical") {
    alerts.push("Envisagez de sécuriser des rentrées ou reporter des dépenses");
  }
  
  return {
    level,
    score: Math.min(100, Math.max(0, score)),
    daysToNegative,
    minimumBalance,
    alerts,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

// Indicateur de risque visuel
function RiskIndicatorCard({ risk, currency }: { risk: RiskIndicator; currency: string }) {
  const config = {
    low: { 
      color: "emerald", 
      icon: Shield, 
      label: "Risque faible",
      description: "Votre trésorerie est saine",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400"
    },
    medium: { 
      color: "amber", 
      icon: Activity, 
      label: "Risque modéré",
      description: "Vigilance recommandée",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400"
    },
    high: { 
      color: "orange", 
      icon: AlertTriangle, 
      label: "Risque élevé",
      description: "Actions correctives conseillées",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400"
    },
    critical: { 
      color: "red", 
      icon: AlertTriangle, 
      label: "Risque critique",
      description: "Intervention urgente requise",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400"
    },
  };
  
  const c = config[risk.level];
  const Icon = c.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border ${c.border} ${c.bg} p-6`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg}`}>
            <Icon className={`h-6 w-6 ${c.text}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${c.text}`}>{c.label}</h3>
            <p className="text-sm text-slate-400">{c.description}</p>
          </div>
        </div>
        
        {/* Score gauge */}
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-white">{risk.score}</div>
          <div className="text-xs text-slate-500">/ 100</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${risk.score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            risk.level === "low" ? "bg-emerald-500" :
            risk.level === "medium" ? "bg-amber-500" :
            risk.level === "high" ? "bg-orange-500" :
            "bg-red-500"
          }`}
        />
      </div>
      
      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Solde minimum projeté</p>
          <p className={`text-lg font-semibold ${risk.minimumBalance < 0 ? "text-red-400" : "text-white"}`}>
            {risk.minimumBalance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Jours avant solde négatif</p>
          <p className="text-lg font-semibold text-white">
            {risk.daysToNegative !== null ? `${risk.daysToNegative}j` : "—"}
          </p>
        </div>
      </div>
      
      {/* Alerts */}
      {risk.alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {risk.alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-white/5 p-3">
              <Info size={14} className={`mt-0.5 shrink-0 ${c.text}`} />
              <p className="text-xs text-slate-300">{alert}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// GRAPHIQUE OPTIMISÉ
// Le graphique SVG custom a été remplacé par OptimizedForecastChart (Recharts)
// Voir: components/forecast/OptimizedForecastChart.tsx
// Gain: ~80% de performance, -350 lignes de code
// ═══════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function ForecastPage() {
  useRequireAuth();
  const { currency } = useCurrency();
  const [selectedDays, setSelectedDays] = useState<Horizon>(90);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Options d'affichage
  const [showConfidence, setShowConfidence] = useState(true);
  const [showScenarios, setShowScenarios] = useState(true);
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null);

  // What-If simulation
  const [whatIfScenarios, setWhatIfScenarios] = useState<ScenarioImpact[]>([]);

  async function fetchForecast(days: number) {
    setLoading(true);
    setError(null);
    try {
      // Use new Prophet-enhanced forecast API for horizons >= 90 days
      const useProphetAPI = days >= 90;

      if (useProphetAPI) {
        const historicalDays = Math.min(Math.floor(days / 2), 180);
        const data = (await api(`/reporting/forecast-enhanced?horizonDays=${days}&historicalDays=${historicalDays}`)) as any;

        // Transform Prophet response to match ForecastResponse format
        setForecast({
          days: days,
          baseBalance: data.currentBalance || 0,
          projectedBalance: data.projectedBalance || 0,
          futureImpact: data.futureImpact || 0,
          daily: data.forecast || [],
          perAccount: data.perAccount || [],
          events: data.events || [],
          model: data.model,
          trends: data.trends,
        });
      } else {
        // Fallback to simple forecast for short horizons
        const data = (await api(`/dashboard/forecast?days=${days}`)) as ForecastResponse;
        setForecast(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger la projection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchForecast(selectedDays);
  }, [selectedDays]);

  // Event annotation handlers
  async function handleAddEvent(event: {
    date: string;
    label: string;
    description?: string;
  }) {
    try {
      await api("/forecast-events", {
        method: "POST",
        body: event as any,
      });
      fetchForecast(selectedDays); // Reload to show new event
    } catch (err: any) {
      console.error("Error adding event:", err);
      alert("Erreur lors de l'ajout de l'événement");
    }
  }

  async function handleDeleteEvent(id: number) {
    if (!confirm("Supprimer cet événement ?")) return;

    try {
      await api(`/forecast-events/${id}`, { method: "DELETE" });
      fetchForecast(selectedDays); // Reload to remove event
    } catch (err: any) {
      console.error("Error deleting event:", err);
      alert("Erreur lors de la suppression de l'événement");
    }
  }

  async function handleImportEvents(
    events: Array<{ date: string; label: string }>
  ) {
    try {
      await api("/forecast-events/import", {
        method: "POST",
        body: { events } as any,
      });
      fetchForecast(selectedDays); // Reload to show imported events
      alert(`${events.length} événements importés avec succès`);
    } catch (err: any) {
      console.error("Error importing events:", err);
      alert("Erreur lors de l'import des événements");
    }
  }

  // What-If simulation handlers
  function handleSimulate(scenarios: ScenarioImpact[]) {
    setWhatIfScenarios(scenarios);
    // Sauvegarder dans localStorage
    try {
      localStorage.setItem("whatIfScenarios", JSON.stringify(scenarios));
    } catch (err) {
      console.warn("Failed to save what-if scenarios to localStorage:", err);
    }
  }

  function handleResetSimulation() {
    setWhatIfScenarios([]);
    // Nettoyer localStorage
    try {
      localStorage.removeItem("whatIfScenarios");
    } catch (err) {
      console.warn("Failed to remove what-if scenarios from localStorage:", err);
    }
  }

  // Charger les scénarios depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("whatIfScenarios");
      if (saved) {
        const scenarios = JSON.parse(saved) as ScenarioImpact[];
        setWhatIfScenarios(scenarios);
      }
    } catch (err) {
      console.warn("Failed to load what-if scenarios from localStorage:", err);
    }
  }, []);

  // Appliquer les scénarios what-if aux zones de confiance
  function applyWhatIfScenarios(zones: ConfidenceZone[], scenarios: ScenarioImpact[]): ConfidenceZone[] {
    if (scenarios.length === 0) return zones;

    // Calculer l'impact mensuel total
    let monthlyImpact = 0;
    let paymentDelayDays = 0;

    scenarios.forEach((scenario) => {
      if (scenario.type === "expense") {
        monthlyImpact -= scenario.value;
      } else if (scenario.type === "revenue") {
        monthlyImpact += scenario.value;
      } else if (scenario.type === "delay") {
        paymentDelayDays = Math.max(paymentDelayDays, scenario.value);
      }
    });

    // Impact quotidien
    const dailyImpact = monthlyImpact / 30;

    return zones.map((zone, index) => {
      // Appliquer l'impact progressif
      const cumulativeImpact = dailyImpact * index;

      // Appliquer le retard de paiement (décalage)
      let adjustedPredicted = zone.predicted + cumulativeImpact;
      if (paymentDelayDays > 0 && index < paymentDelayDays) {
        // Réduire temporairement le solde pendant le délai
        adjustedPredicted -= monthlyImpact * 0.5;
      }

      return {
        ...zone,
        predicted: adjustedPredicted,
        upperBound: zone.upperBound + cumulativeImpact,
        lowerBound: zone.lowerBound + cumulativeImpact,
        optimistic: zone.optimistic + cumulativeImpact,
        pessimistic: zone.pessimistic + cumulativeImpact,
      };
    });
  }

  // Calculs dérivés
  const confidenceZones = useMemo(() => {
    if (!forecast) return [];
    const baseZones = generateConfidenceZones(forecast.daily, forecast.baseBalance);
    // Appliquer les scénarios what-if s'il y en a
    return applyWhatIfScenarios(baseZones, whatIfScenarios);
  }, [forecast, whatIfScenarios]);

  const riskIndicator = useMemo(() => {
    if (confidenceZones.length === 0 || !forecast) return null;
    return calculateRiskIndicator(confidenceZones, forecast.baseBalance);
  }, [confidenceZones, forecast]);

  const cards = forecast
    ? [
        { 
          label: "Solde actuel", 
          value: forecast.baseBalance, 
          icon: BarChart3,
          color: "indigo" as const,
          trend: null
        },
        { 
          label: "Impact prévu", 
          value: forecast.futureImpact, 
          icon: forecast.futureImpact >= 0 ? TrendingUp : TrendingDown,
          color: forecast.futureImpact >= 0 ? "emerald" as const : "rose" as const,
          trend: forecast.futureImpact >= 0 ? "up" : "down"
        },
        { 
          label: `Projection ${forecast.days}j`, 
          value: forecast.projectedBalance, 
          icon: Target,
          color: "purple" as const,
          trend: forecast.projectedBalance >= forecast.baseBalance ? "up" : "down"
        },
      ]
    : [];

  const perAccount = forecast?.perAccount ?? [];

  return (
    <div className="relative min-h-screen text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
                <Sparkles size={12} />
                Prévisions IA
              </span>
            </div>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
              Trésorerie prévisionnelle
            </h1>
            <p className="text-sm text-indigo-100/80">
              Visualisez l&apos;évolution de votre trésorerie avec zone de confiance et scénarios.
            </p>
          </div>
          
          {/* Options */}
          <div className="flex flex-wrap gap-2" data-guide="forecast-scenarios">
            <button
              onClick={() => setShowConfidence(!showConfidence)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
                showConfidence
                  ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <Shield size={14} />
              Zone confiance
            </button>
            <button
              onClick={() => setShowScenarios(!showScenarios)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
                showScenarios
                  ? "border-purple-500/50 bg-purple-500/20 text-purple-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <Zap size={14} />
              Scénarios
            </button>
            {forecast && <ForecastExport data={forecast} />}
          </div>
        </div>

        {/* Horizon selector */}
        <GlassPanel gradient="indigo" className="flex flex-wrap gap-2 p-4" data-guide="forecast-horizon">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Calendar size={16} />
            Horizon :
          </div>
          {horizons.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDays(d)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selectedDays === d
                  ? "border-indigo-400 bg-white/20 text-white shadow-lg"
                  : "border-white/10 bg-white/5 text-indigo-100 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {d} jours
            </button>
          ))}
        </GlassPanel>

        {/* Model info banner */}
        {forecast?.model && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3"
          >
            <Sparkles size={16} className="text-indigo-400" />
            <div className="flex-1">
              <p className="text-sm text-indigo-200">
                {forecast.model.type === "prophet" ? (
                  <>
                    Modèle Prophet IA entraîné sur <strong>{forecast.model.trainedOn}</strong> jours avec
                    saisonnalité {forecast.model.seasonality?.join(", ") || "auto-détectée"}
                  </>
                ) : (
                  <>Prévision simple basée sur la tendance historique</>
                )}
              </p>
            </div>
            {forecast.model.last_trained && (
              <span className="text-xs text-indigo-300/70">
                Entraîné: {new Date(forecast.model.last_trained).toLocaleDateString("fr-FR")}
              </span>
            )}
          </motion.div>
        )}

        {loading && (
          <GlassCard variant="subtle" className="flex items-center justify-center gap-3 p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span className="text-sm text-indigo-100/80">Calcul des prévisions en cours...</span>
          </GlassCard>
        )}

        {error && (
          <GlassCard className="border-red-300/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </GlassCard>
        )}

        {/* Stats cards */}
        {forecast && (
          <div className="grid gap-4 sm:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassStatCard
                    label={card.label}
                    value={`${card.value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${currency}`}
                    accentColor={card.color}
                    icon={<Icon size={18} />}
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Risk indicator */}
        {riskIndicator && (
          <RiskIndicatorCard risk={riskIndicator} currency={currency} />
        )}

        {/* What-If Simulator */}
        {forecast && (
          <WhatIfSimulator
            baseBalance={forecast.baseBalance}
            onSimulate={handleSimulate}
            onReset={handleResetSimulation}
          />
        )}

        {/* Main chart */}
        {confidenceZones.length > 0 && (
          <GlassPanel gradient="purple" className="p-6" data-guide="forecast-chart">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Évolution sur {selectedDays} jours</h2>
                <p className="text-sm text-indigo-100/80">
                  Graphique interactif avec zone de confiance ML
                </p>
              </div>
            </div>
            
            <OptimizedForecastChart
              zones={confidenceZones}
              currency={currency}
              showConfidence={showConfidence}
              showScenarios={showScenarios}
            />
          </GlassPanel>
        )}

        {/* Event Annotations */}
        {forecast && forecast.events !== undefined && (
          <GlassPanel gradient="emerald" className="p-6">
            <EventMarkers
              events={forecast.events || []}
              onAdd={handleAddEvent}
              onDelete={handleDeleteEvent}
              onImport={handleImportEvents}
            />
          </GlassPanel>
        )}

        {/* Model Accuracy Metrics */}
        {forecast?.model?.type === "prophet" && forecast.model.backtesting_available && (
          <AccuracyMetrics horizonDays={selectedDays} currency={currency} />
        )}

        {/* Per account breakdown */}
        {perAccount.length > 0 && (
          <GlassPanel gradient="indigo" className="space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold">Détail par compte</h2>
              <p className="text-sm text-indigo-100/80">
                Projection individuelle de chaque compte bancaire
              </p>
            </div>
            
            <div className="space-y-3">
              {perAccount.map((acc) => {
                const futureImpact = acc.projectedBalance - acc.baseBalance;
                const isExpanded = expandedAccount === acc.accountId;
                
                return (
                  <motion.div
                    key={acc.accountId}
                    layout
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                  >
                    <button
                      onClick={() => setExpandedAccount(isExpanded ? null : acc.accountId)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                          <BarChart3 size={18} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{acc.accountName}</p>
                          <p className="text-xs text-slate-500">
                            Solde actuel : {acc.baseBalance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {currency}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">
                            {acc.projectedBalance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {currency}
                          </p>
                          <p className={`flex items-center justify-end gap-1 text-xs ${
                            futureImpact >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {futureImpact >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {futureImpact >= 0 ? "+" : ""}{futureImpact.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {currency}
                          </p>
                        </div>
                        <ChevronDown 
                          size={18} 
                          className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                        />
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && acc.daily.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5"
                        >
                          <div className="max-h-60 overflow-auto p-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-slate-500">
                                  <th className="pb-2">Date</th>
                                  <th className="pb-2 text-right">Entrées</th>
                                  <th className="pb-2 text-right">Sorties</th>
                                  <th className="pb-2 text-right">Solde</th>
                                </tr>
                              </thead>
                              <tbody>
                                {acc.daily.slice(0, 30).map((day, i) => (
                                  <tr key={i} className="border-t border-white/5">
                                    <td className="py-2 text-slate-300">
                                      {new Date(day.date).toLocaleDateString("fr-FR", { 
                                        day: "2-digit", 
                                        month: "short" 
                                      })}
                                    </td>
                                    <td className="py-2 text-right text-emerald-400">
                                      +{(day.credit + day.plannedCredit).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-2 text-right text-rose-400">
                                      -{(day.debit + day.plannedDebit).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-2 text-right font-medium text-white">
                                      {day.balance.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
