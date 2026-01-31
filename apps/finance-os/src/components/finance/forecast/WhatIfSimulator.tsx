"use client";

import React, { useState } from "react";
import { GlassCard, GlassButton, GlassBadge } from '@quelyos/ui/glass';
import { Calculator, RotateCcw, ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, UserPlus, UserMinus, Clock, DollarSign } from "lucide-react";
import { useCurrency } from "@/lib/finance/CurrencyContext";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

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
};

type WhatIfSimulatorProps = {
  baseBalance: number;
  onSimulate: (scenarios: ScenarioImpact[]) => void;
  onReset: () => void;
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const SCENARIO_TEMPLATES: Omit<ScenarioImpact, "enabled" | "value">[] = [
  {
    id: "hire",
    label: "Embauche CDI",
    description: "Coût mensuel charges comprises",
    icon: <UserPlus className="w-4 h-4" />,
    type: "expense",
    unit: "€",
    min: 0,
    max: 10000,
    step: 500,
    defaultValue: 3500,
  },
  {
    id: "lost-client",
    label: "Perte d'un client",
    description: "Baisse du CA mensuel",
    icon: <UserMinus className="w-4 h-4" />,
    type: "expense",
    unit: "€",
    min: 0,
    max: 20000,
    step: 500,
    defaultValue: 5000,
  },
  {
    id: "payment-delay",
    label: "Retard de paiement",
    description: "Décalage des encaissements",
    icon: <Clock className="w-4 h-4" />,
    type: "delay",
    unit: "days",
    min: 0,
    max: 90,
    step: 5,
    defaultValue: 30,
  },
  {
    id: "new-contract",
    label: "Nouveau contrat",
    description: "Revenu récurrent mensuel",
    icon: <DollarSign className="w-4 h-4" />,
    type: "revenue",
    unit: "€",
    min: 0,
    max: 20000,
    step: 500,
    defaultValue: 5000,
  },
  {
    id: "cost-reduction",
    label: "Réduction des coûts",
    description: "Économies mensuelles",
    icon: <TrendingDown className="w-4 h-4" />,
    type: "revenue",
    unit: "€",
    min: 0,
    max: 10000,
    step: 250,
    defaultValue: 2000,
  },
  {
    id: "new-expense",
    label: "Nouvelle dépense récurrente",
    description: "Coût mensuel supplémentaire",
    icon: <TrendingUp className="w-4 h-4" />,
    type: "expense",
    unit: "€",
    min: 0,
    max: 10000,
    step: 250,
    defaultValue: 1500,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function WhatIfSimulator({
  baseBalance: _baseBalance,
  onSimulate,
  onReset,
}: WhatIfSimulatorProps) {
  const { formatMoney } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioImpact[]>(
    SCENARIO_TEMPLATES.map((t) => ({
      ...t,
      enabled: false,
      value: t.defaultValue,
    }))
  );

  // Calculer l'impact total
  const totalImpact = scenarios
    .filter((s) => s.enabled)
    .reduce((sum, s) => {
      if (s.type === "expense") {
        return sum - s.value;
      } else if (s.type === "revenue") {
        return sum + s.value;
      }
      // delay doesn't affect monthly total directly
      return sum;
    }, 0);

  const hasActiveScenarios = scenarios.some((s) => s.enabled);

  // Mettre à jour un scénario
  function updateScenario(id: string, updates: Partial<ScenarioImpact>) {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  // Réinitialiser tous les scénarios
  function resetAll() {
    setScenarios(
      SCENARIO_TEMPLATES.map((t) => ({
        ...t,
        enabled: false,
        value: t.defaultValue,
      }))
    );
    onReset();
  }

  // Simuler avec les scénarios actifs
  function handleSimulate() {
    const activeScenarios = scenarios.filter((s) => s.enabled && s.value > 0);
    if (activeScenarios.length === 0) {
      alert("Activez au moins un scénario avec une valeur non nulle");
      return;
    }
    onSimulate(activeScenarios);
  }

  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Simulateur What-If
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Testez l'impact de décisions stratégiques sur votre trésorerie
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">Masquer</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="hidden sm:inline">Afficher</span>
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Scénarios */}
          <div className="space-y-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`p-4 rounded-xl border transition-all ${
                  scenario.enabled
                    ? "bg-indigo-100 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30"
                    : "bg-gray-100 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700/50"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={scenario.enabled}
                    onChange={(e) =>
                      updateScenario(scenario.id, {
                        enabled: e.target.checked,
                      })
                    }
                    className="mt-1 accent-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`p-1.5 rounded-lg ${
                          scenario.type === "revenue"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : scenario.type === "expense"
                            ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {scenario.icon}
                      </div>
                      <label className="block text-gray-900 dark:text-white font-medium">
                        {scenario.label}
                      </label>
                      <GlassBadge
                        variant={
                          scenario.type === "revenue"
                            ? "success"
                            : scenario.type === "expense"
                            ? "error"
                            : "warning"
                        }
                        className="text-xs"
                      >
                        {scenario.type === "revenue" && "Revenu"}
                        {scenario.type === "expense" && "Dépense"}
                        {scenario.type === "delay" && "Délai"}
                      </GlassBadge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {scenario.description}
                    </p>

                    {scenario.enabled && (
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={scenario.min}
                          max={scenario.max}
                          step={scenario.step}
                          value={scenario.value}
                          onChange={(e) =>
                            updateScenario(scenario.id, {
                              value: Number(e.target.value),
                            })
                          }
                          className="w-full accent-indigo-500"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {scenario.unit === "€" ? "Montant" : "Durée"}:
                          </span>
                          <span
                            className={`font-medium ${
                              scenario.type === "revenue"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : scenario.type === "expense"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {scenario.unit === "€"
                              ? formatMoney(scenario.value)
                              : `${scenario.value} jours`}
                            {scenario.unit === "€" && "/mois"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Impact total */}
          {hasActiveScenarios && (
            <div
              className={`p-4 rounded-xl border ${
                totalImpact >= 0
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                  : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {totalImpact >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="text-gray-900 dark:text-white font-medium">
                    Impact mensuel total
                  </span>
                </div>
                <span
                  className={`text-xl font-bold ${
                    totalImpact >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {totalImpact >= 0 ? "+" : ""}
                  {formatMoney(totalImpact)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Impact estimé sur votre solde de trésorerie après 30 jours
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <GlassButton
              onClick={handleSimulate}
              variant="primary"
              disabled={!hasActiveScenarios}
              className="flex-1"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Simuler l'impact
            </GlassButton>
            <GlassButton
              onClick={resetAll}
              variant="ghost"
              disabled={!hasActiveScenarios}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </GlassButton>
          </div>

          {/* Info */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-lg">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                Les simulations sont appliquées à vos prévisions existantes.
                Les scénarios ne modifient pas vos données réelles.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* État replié */}
      {!isExpanded && hasActiveScenarios && (
        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-900 dark:text-white">
              {scenarios.filter((s) => s.enabled).length} scénario(s) actif(s)
            </span>
            <span
              className={`font-medium ${
                totalImpact >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {totalImpact >= 0 ? "+" : ""}
              {formatMoney(totalImpact)}/mois
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
