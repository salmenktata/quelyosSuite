/**
 * Page Prévisions de Trésorerie
 *
 * Fonctionnalités :
 * - Projection trésorerie sur 7/15/30/60/90 jours avec modèle Prophet IA
 * - Zone de confiance ML avec intervalles de probabilité
 * - Simulateur What-If pour tester des scénarios stratégiques
 * - Indicateur de risque automatique (faible/modéré/élevé/critique)
 * - Détail par compte bancaire avec évolution individuelle
 * - Export des prévisions (PDF, Excel)
 * - Événements planifiés avec impact sur projection
 */

import { useState } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice, SkeletonTable, Button } from "@/components/common";
import { financeNotices } from "@/lib/notices/finance-notices";
import { TrendingUp, TrendingDown, Target, Sparkles, BarChart3, AlertCircle, RefreshCw } from "lucide-react";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { useForecast } from "@/hooks/finance/useForecast";
import { GlassStatCard, GlassPanel } from "@/components/ui/glass";
import { EventMarkers } from "@/components/finance/forecast/EventMarkers";
import { OptimizedForecastChart } from "@/components/finance/forecast/OptimizedForecastChart";
import WhatIfSimulator from "@/components/finance/forecast/WhatIfSimulator";
import { AccuracyMetrics } from "@/components/finance/forecast/AccuracyMetrics";
import { ForecastHeader } from "@/components/finance/forecast/ForecastHeader";
import { HorizonSelector } from "@/components/finance/forecast/HorizonSelector";
import { RiskIndicatorCard } from "@/components/finance/forecast/RiskIndicatorCard";
import { AccountBreakdown } from "@/components/finance/forecast/AccountBreakdown";

export default function ForecastPage() {
  useRequireAuth();
  const { currency } = useCurrency();
  const [showConfidence, setShowConfidence] = useState(true);
  const [showScenarios, setShowScenarios] = useState(true);

  const {
    forecast,
    loading,
    error,
    refetch,
    selectedDays,
    setSelectedDays,
    confidenceZones,
    riskIndicator,
    handleSimulate,
    handleResetSimulation,
    handleAddEvent,
    handleDeleteEvent,
    handleImportEvents,
  } = useForecast();

  const cards = forecast
    ? [
        {
          label: "Solde actuel",
          value: forecast.baseBalance,
          icon: BarChart3,
          color: "indigo" as const,
        },
        {
          label: "Impact prévu",
          value: forecast.futureImpact,
          icon: forecast.futureImpact >= 0 ? TrendingUp : TrendingDown,
          color: forecast.futureImpact >= 0 ? ("emerald" as const) : ("rose" as const),
        },
        {
          label: `Projection ${forecast.days}j`,
          value: forecast.projectedBalance,
          icon: Target,
          color: "purple" as const,
        },
      ]
    : [];

  return (
    <LazyMotion features={domAnimation}>
    <Layout>
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Prévisions' },
          ]}
        />

        <ForecastHeader
          showConfidence={showConfidence}
          showScenarios={showScenarios}
          onToggleConfidence={() => setShowConfidence(!showConfidence)}
          onToggleScenarios={() => setShowScenarios(!showScenarios)}
          forecast={forecast}
        />

        <PageNotice config={financeNotices.forecast} className="![animation:none] mb-6" />

        <HorizonSelector selectedDays={selectedDays} onSelect={setSelectedDays} />

        {forecast?.model && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="![animation:none] flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-100 dark:bg-indigo-500/10 px-4 py-3"
          >
            <Sparkles size={16} className="![animation:none] text-indigo-600 dark:text-indigo-400" />
            <div className="![animation:none] flex-1">
              <p className="![animation:none] text-sm text-indigo-700 dark:text-indigo-200">
                {forecast.model.type === "prophet" ? (
                  <>
                    Modèle Prophet IA entraîné sur <strong>{forecast.model.trainedOn}</strong> jours
                    avec saisonnalité {forecast.model.seasonality?.join(", ") || "auto-détectée"}
                  </>
                ) : (
                  <>Prévision simple basée sur la tendance historique</>
                )}
              </p>
            </div>
            {forecast.model.last_trained && (
              <span className="![animation:none] text-xs text-indigo-500 dark:text-indigo-300/70">
                Entraîné: {new Date(forecast.model.last_trained).toLocaleDateString("fr-FR")}
              </span>
            )}
          </m.div>
        )}

        {loading && <SkeletonTable rows={5} columns={4} />}

        {error && (
          <div role="alert" className="![animation:none] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="![animation:none] flex items-center gap-3">
              <AlertCircle className="![animation:none] w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="![animation:none] flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des prévisions.
              </p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="![animation:none] w-4 h-4" />} onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {forecast && (
          <div className="![animation:none] grid gap-4 sm:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <m.div
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
                </m.div>
              );
            })}
          </div>
        )}

        {riskIndicator && <RiskIndicatorCard risk={riskIndicator} currency={currency} />}

        {forecast && (
          <WhatIfSimulator
            baseBalance={forecast.baseBalance}
            onSimulate={handleSimulate}
            onReset={handleResetSimulation}
          />
        )}

        {confidenceZones.length > 0 && (
          <GlassPanel gradient="purple" className="![animation:none] p-6" data-guide="forecast-chart">
            <div className="![animation:none] mb-4 flex items-center justify-between">
              <div>
                <h2 className="![animation:none] text-xl font-semibold text-gray-900 dark:text-white">
                  Évolution sur {selectedDays} jours
                </h2>
                <p className="![animation:none] text-sm text-gray-600 dark:text-indigo-100/80">
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

        {forecast && forecast.events !== undefined && (
          <GlassPanel gradient="emerald" className="![animation:none] p-6">
            <EventMarkers
              events={forecast.events || []}
              onAdd={handleAddEvent}
              onDelete={handleDeleteEvent}
              onImport={handleImportEvents}
            />
          </GlassPanel>
        )}

        {forecast?.model?.type === "prophet" && forecast.model.backtesting_available && (
          <AccuracyMetrics horizonDays={selectedDays} currency={currency} />
        )}

        <AccountBreakdown accounts={forecast?.perAccount ?? []} currency={currency} />
      </div>
    </Layout>
    </LazyMotion>
  );
}
