import { useState, useMemo, useEffect, useCallback } from "react";
import { api } from "@/lib/finance/api";
import { logger } from "@quelyos/logger";
import type {
  Horizon,
  ForecastResponse,
  DailyRow,
  ConfidenceZone,
  RiskIndicator,
  ScenarioImpact,
} from "@/types/forecast";

// === UTILS ===

function generateConfidenceZones(daily: DailyRow[], baseBalance: number): ConfidenceZone[] {
  let runningBalance = baseBalance;

  return daily.map((row, index) => {
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

    const dayVariation = row.plannedCredit - row.plannedDebit + row.credit - row.debit;
    runningBalance += dayVariation;

    const uncertaintyFactor = 1 + index * 0.002;
    const baseUncertainty = 0.08;
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

  zones.forEach((zone, index) => {
    if (zone.pessimistic < minimumBalance) {
      minimumBalance = zone.pessimistic;
    }
    if (zone.pessimistic < 0 && daysToNegative === null) {
      daysToNegative = index + 1;
    }
  });

  let score = 0;

  const balanceRatio = minimumBalance / baseBalance;
  if (balanceRatio < 0) score += 50;
  else if (balanceRatio < 0.2) score += 35;
  else if (balanceRatio < 0.5) score += 20;
  else if (balanceRatio < 0.8) score += 10;

  if (daysToNegative !== null) {
    if (daysToNegative < 15) score += 40;
    else if (daysToNegative < 30) score += 25;
    else if (daysToNegative < 60) score += 15;
    else score += 5;
  }

  const lastZone = zones[zones.length - 1];
  if (lastZone) {
    const volatility = (lastZone.optimistic - lastZone.pessimistic) / lastZone.predicted;
    if (volatility > 0.5) score += 10;
    else if (volatility > 0.3) score += 5;
  }

  let level: RiskIndicator["level"];
  if (score >= 70) level = "critical";
  else if (score >= 45) level = "high";
  else if (score >= 25) level = "medium";
  else level = "low";

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

function applyWhatIfScenarios(zones: ConfidenceZone[], scenarios: ScenarioImpact[]): ConfidenceZone[] {
  if (scenarios.length === 0) return zones;

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

  const dailyImpact = monthlyImpact / 30;

  return zones.map((zone, index) => {
    const cumulativeImpact = dailyImpact * index;
    let adjustedPredicted = zone.predicted + cumulativeImpact;

    if (paymentDelayDays > 0 && index < paymentDelayDays) {
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

// === HOOK ===

export interface UseForecastOptions {
  initialHorizon?: Horizon;
}

export interface UseForecastReturn {
  forecast: ForecastResponse | null;
  loading: boolean;
  error: string | null;
  selectedDays: Horizon;
  setSelectedDays: (days: Horizon) => void;
  confidenceZones: ConfidenceZone[];
  riskIndicator: RiskIndicator | null;
  whatIfScenarios: ScenarioImpact[];
  handleSimulate: (scenarios: ScenarioImpact[]) => void;
  handleResetSimulation: () => void;
  refetch: () => Promise<void>;
  // Event handlers
  handleAddEvent: (event: { date: string; label: string; description?: string }) => Promise<void>;
  handleDeleteEvent: (id: number) => Promise<void>;
  handleImportEvents: (events: Array<{ date: string; label: string }>) => Promise<void>;
}

export function useForecast({ initialHorizon = 90 }: UseForecastOptions = {}): UseForecastReturn {
  const [selectedDays, setSelectedDays] = useState<Horizon>(initialHorizon);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatIfScenarios, setWhatIfScenarios] = useState<ScenarioImpact[]>([]);

  const fetchForecast = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const useProphetAPI = days >= 90;

      if (useProphetAPI) {
        const historicalDays = Math.min(Math.floor(days / 2), 180);
        const data = (await api(
          `/reporting/forecast-enhanced?horizonDays=${days}&historicalDays=${historicalDays}`
        )) as ForecastResponse;

        setForecast({
          days,
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
        const data = (await api(`/dashboard/forecast?days=${days}`)) as ForecastResponse;
        setForecast(data);
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la projection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast(selectedDays);
  }, [selectedDays, fetchForecast]);

  // Load what-if scenarios from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("whatIfScenarios");
      if (saved) {
        setWhatIfScenarios(JSON.parse(saved) as ScenarioImpact[]);
      }
    } catch (_err) {
      logger.warn("Failed to load what-if scenarios from localStorage:", err);
    }
  }, []);

  const handleSimulate = useCallback((scenarios: ScenarioImpact[]) => {
    setWhatIfScenarios(scenarios);
    try {
      localStorage.setItem("whatIfScenarios", JSON.stringify(scenarios));
    } catch (_err) {
      logger.warn("Failed to save what-if scenarios to localStorage:", err);
    }
  }, []);

  const handleResetSimulation = useCallback(() => {
    setWhatIfScenarios([]);
    try {
      localStorage.removeItem("whatIfScenarios");
    } catch (_err) {
      logger.warn("Failed to remove what-if scenarios from localStorage:", err);
    }
  }, []);

  const handleAddEvent = useCallback(
    async (event: { date: string; label: string; description?: string }) => {
      try {
        await api("/forecast-events", { method: "POST", body: event as Record<string, unknown> });
        fetchForecast(selectedDays);
      } catch (_err: unknown) {
        logger.error("Error adding event:", err);
        alert("Erreur lors de l'ajout de l'événement");
      }
    },
    [selectedDays, fetchForecast]
  );

  const handleDeleteEvent = useCallback(
    async (id: number) => {
      if (!confirm("Supprimer cet événement ?")) return;
      try {
        await api(`/forecast-events/${id}`, { method: "DELETE" });
        fetchForecast(selectedDays);
      } catch (_err: unknown) {
        logger.error("Error deleting event:", err);
        alert("Erreur lors de la suppression de l'événement");
      }
    },
    [selectedDays, fetchForecast]
  );

  const handleImportEvents = useCallback(
    async (events: Array<{ date: string; label: string }>) => {
      try {
        await api("/forecast-events/import", { method: "POST", body: { events } as Record<string, unknown> });
        fetchForecast(selectedDays);
        alert(`${events.length} événements importés avec succès`);
      } catch (_err: unknown) {
        logger.error("Error importing events:", err);
        alert("Erreur lors de l'import des événements");
      }
    },
    [selectedDays, fetchForecast]
  );

  // Computed values
  const confidenceZones = useMemo(() => {
    if (!forecast) return [];
    const baseZones = generateConfidenceZones(forecast.daily, forecast.baseBalance);
    return applyWhatIfScenarios(baseZones, whatIfScenarios);
  }, [forecast, whatIfScenarios]);

  const riskIndicator = useMemo(() => {
    if (confidenceZones.length === 0 || !forecast) return null;
    return calculateRiskIndicator(confidenceZones, forecast.baseBalance);
  }, [confidenceZones, forecast]);

  const refetch = useCallback(() => fetchForecast(selectedDays), [selectedDays, fetchForecast]);

  return {
    forecast,
    loading,
    error,
    selectedDays,
    setSelectedDays,
    confidenceZones,
    riskIndicator,
    whatIfScenarios,
    handleSimulate,
    handleResetSimulation,
    refetch,
    handleAddEvent,
    handleDeleteEvent,
    handleImportEvents,
  };
}
