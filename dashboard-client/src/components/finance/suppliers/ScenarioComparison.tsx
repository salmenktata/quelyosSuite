"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitCompare, Loader2, X } from "lucide-react";
import { logger } from '@quelyos/logger';

interface Scenario {
  id: string;
  name: string;
  strategy: string;
  metrics?: {
    totalInvoices: number;
    scheduledInvoices: number;
    totalAmount: number;
    totalPenalties: number;
    totalDiscounts: number;
    totalCost: number;
    netSavings: number;
    onTimeRate: number;
    averagePaymentDelay: string;
  };
}

const STRATEGIES = {
  BY_DUE_DATE: "Par date d'échéance",
  BY_IMPORTANCE: "Par importance",
  MINIMIZE_PENALTIES: "Minimiser les pénalités",
  MAXIMIZE_DISCOUNTS: "Maximiser les remises",
  OPTIMIZE_CASH_FLOW: "Optimiser la trésorerie",
};

export default function ScenarioComparison() {
  const [availableScenarios, setAvailableScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch("/api/ecommerce/payment-planning/scenarios");
      if (response.ok) {
        const data = await response.json();
        setAvailableScenarios(data.scenarios || []);
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des scénarios:", error);
    }
  };

  const handleAddScenario = (scenarioId: string) => {
    if (!selectedScenarios.includes(scenarioId) && selectedScenarios.length < 3) {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
      loadScenarioData(scenarioId);
    }
  };

  const handleRemoveScenario = (scenarioId: string) => {
    setSelectedScenarios(selectedScenarios.filter((id) => id !== scenarioId));
    setComparisonData(comparisonData.filter((s) => s.id !== scenarioId));
  };

  const loadScenarioData = async (scenarioId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ecommerce/payment-planning/scenarios/${scenarioId}`);
      if (response.ok) {
        const scenario = await response.json();

        // Simuler l'optimisation pour obtenir les métriques
        const optimizeResponse = await fetch("/api/ecommerce/payment-planning/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategy: scenario.strategy,
            maxDailyAmount: scenario.maxDailyAmount,
            targetCashReserve: scenario.targetCashReserve,
            invoiceIds: scenario.invoices?.map((inv: { id: number }) => inv.id) || [],
          }),
        });

        if (optimizeResponse.ok) {
          const optimizeData = await optimizeResponse.json();
          setComparisonData((prev) => [
            ...prev.filter((s) => s.id !== scenarioId),
            {
              id: scenario.id,
              name: scenario.name,
              strategy: scenario.strategy,
              metrics: optimizeData.metrics,
            },
          ]);
        }
      }
    } catch (error) {
      logger.error("Erreur lors du chargement du scénario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBestScenario = (metric: keyof NonNullable<Scenario["metrics"]>) => {
    if (comparisonData.length === 0) return null;

    // Pour certaines métriques, plus c'est bas, mieux c'est
    const lowerIsBetter = ["totalPenalties", "totalCost", "averagePaymentDelay"];

    let best = comparisonData[0];
    comparisonData.forEach((scenario) => {
      if (!scenario.metrics || !best.metrics) return;

      const scenarioValue = scenario.metrics[metric];
      const bestValue = best.metrics[metric];

      if (typeof scenarioValue === "number" && typeof bestValue === "number") {
        if (lowerIsBetter.includes(metric)) {
          if (scenarioValue < bestValue) best = scenario;
        } else {
          if (scenarioValue > bestValue) best = scenario;
        }
      }
    });

    return best.id;
  };

  const MetricRow = ({
    label,
    metricKey,
    format = (v: number) => v.toFixed(2),
    suffix = "",
  }: {
    label: string;
    metricKey: keyof NonNullable<Scenario["metrics"]>;
    format?: (value: number) => string;
    suffix?: string;
  }) => {
    const bestId = getBestScenario(metricKey);

    return (
      <div className="grid grid-cols-4 gap-4 py-3 border-b border-gray-200 dark:border-gray-700 items-center">
        <div className="font-medium text-sm text-gray-900 dark:text-white dark:!text-white">{label}</div>
        {comparisonData.map((scenario) => {
          if (!scenario.metrics) return <div key={scenario.id} className="text-gray-900 dark:text-white dark:!text-white">-</div>;

          const value = scenario.metrics[metricKey];
          const isBest = scenario.id === bestId;
          const displayValue =
            typeof value === "number" ? format(value) : value.toString();

          return (
            <div
              key={scenario.id}
              className={`text-center font-semibold ${
                isBest ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:!text-white"
              }`}
            >
              {displayValue}
              {suffix}
              {isBest && " ✓"}
            </div>
          );
        })}
        {Array.from({ length: 3 - comparisonData.length }).map((_, i) => (
          <div key={`empty-${i}`} className="text-center text-muted-foreground">
            -
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitCompare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:!text-white">Comparaison de scénarios</h3>
            <p className="text-sm text-muted-foreground">
              Comparez jusqu'à 3 stratégies d'optimisation différentes
            </p>
          </div>
        </div>

        {/* Sélecteur de scénarios */}
        <div className="flex gap-4 items-center">
          <Select
            value=""
            onValueChange={handleAddScenario}
            disabled={selectedScenarios.length >= 3}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Ajouter un scénario..." />
            </SelectTrigger>
            <SelectContent>
              {availableScenarios
                .filter((s) => !selectedScenarios.includes(s.id))
                .map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {selectedScenarios.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {comparisonData.map((scenario) => (
                <Badge key={scenario.id} variant="secondary" className="px-3 py-1">
                  {scenario.name}
                  <button
                    onClick={() => handleRemoveScenario(scenario.id)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
      </Card>

      {/* Tableau de comparaison */}
      {comparisonData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:!text-white mb-4">Comparaison des métriques</h3>

          <div className="space-y-1">
            {/* En-têtes */}
            <div className="grid grid-cols-4 gap-4 pb-3 border-b-2 border-gray-300 dark:border-gray-600 font-semibold">
              <div className="text-gray-900 dark:text-white dark:!text-white">Métrique</div>
              {comparisonData.map((scenario) => (
                <div key={scenario.id} className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white dark:!text-white">{scenario.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {STRATEGIES[scenario.strategy as keyof typeof STRATEGIES]}
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - comparisonData.length }).map((_, i) => (
                <div key={`empty-header-${i}`} className="text-center text-muted-foreground">
                  -
                </div>
              ))}
            </div>

            {/* Métriques de performance */}
            <div className="pt-3">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📊 Performance
              </div>
              <MetricRow
                label="Factures planifiées"
                metricKey="scheduledInvoices"
                format={(v) => v.toString()}
              />
              <MetricRow
                label="Taux de ponctualité"
                metricKey="onTimeRate"
                format={(v) => v.toFixed(1)}
                suffix="%"
              />
              <MetricRow
                label="Délai moyen"
                metricKey="averagePaymentDelay"
                format={(v) => parseFloat(v.toString()).toFixed(1)}
                suffix="j"
              />
            </div>

            {/* Métriques financières */}
            <div className="pt-3">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                💰 Finances
              </div>
              <MetricRow
                label="Montant factures"
                metricKey="totalAmount"
                format={(v) => v.toFixed(2)}
                suffix="€"
              />
              <MetricRow
                label="Pénalités de retard"
                metricKey="totalPenalties"
                format={(v) => v.toFixed(2)}
                suffix="€"
              />
              <MetricRow
                label="Remises obtenues"
                metricKey="totalDiscounts"
                format={(v) => v.toFixed(2)}
                suffix="€"
              />
              <MetricRow
                label="Coût total"
                metricKey="totalCost"
                format={(v) => v.toFixed(2)}
                suffix="€"
              />
              <MetricRow
                label="Économies nettes"
                metricKey="netSavings"
                format={(v) => v.toFixed(2)}
                suffix="€"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Comment lire ce tableau ?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Les valeurs marquées d'un ✓ vert sont les meilleures pour chaque métrique</li>
              <li>
                Comparez les stratégies pour trouver le meilleur équilibre entre ponctualité et
                coût
              </li>
              <li>
                Les économies nettes = remises obtenues - pénalités de retard (positif = gain)
              </li>
            </ul>
          </div>
        </Card>
      )}

      {comparisonData.length === 0 && (
        <Card className="p-12 text-center">
          <GitCompare className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:!text-white mb-2">Aucun scénario sélectionné</h3>
          <p className="text-muted-foreground">
            Sélectionnez jusqu'à 3 scénarios pour les comparer côte à côte
          </p>
        </Card>
      )}
    </div>
  );
}
