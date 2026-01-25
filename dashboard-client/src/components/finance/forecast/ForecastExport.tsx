"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { ForecastEnhancedResponse } from "@/lib/finance/reporting";

type ForecastExportProps = {
  data: ForecastEnhancedResponse | null;
};

export function ForecastExport({ data }: ForecastExportProps) {
  if (!data) return null;

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // ========== Sheet 1: Daily Forecast Data ==========
    const dailyData = data.forecast.map((day) => ({
      Date: day.date,
      "Prévision": day.predicted || day.projectedBalance,
      "Optimiste (+15%)": day.scenarios?.optimistic || 0,
      "Pessimiste (-15%)": day.scenarios?.pessimistic || 0,
      "Conf. 80% (Haut)": day.confidence80?.upper || 0,
      "Conf. 80% (Bas)": day.confidence80?.lower || 0,
      "Conf. 95% (Haut)": day.confidence95?.upper || 0,
      "Conf. 95% (Bas)": day.confidence95?.lower || 0,
      Tendance: day.components?.trend || 0,
      Saisonnier: day.components?.seasonal || 0,
      Planifié: day.components?.planned || 0,
    }));

    const ws1 = XLSX.utils.json_to_sheet(dailyData);

    // Column widths
    ws1["!cols"] = [
      { wch: 12 }, // Date
      { wch: 15 }, // Prévision
      { wch: 18 }, // Optimiste
      { wch: 18 }, // Pessimiste
      { wch: 18 }, // Conf. 80% Haut
      { wch: 18 }, // Conf. 80% Bas
      { wch: 18 }, // Conf. 95% Haut
      { wch: 18 }, // Conf. 95% Bas
      { wch: 12 }, // Tendance
      { wch: 12 }, // Saisonnier
      { wch: 12 }, // Planifié
    ];

    XLSX.utils.book_append_sheet(wb, ws1, "Prévisions quotidiennes");

    // ========== Sheet 2: Summary ==========
    const finalForecast = data.forecast[data.forecast.length - 1];

    const summary = [
      { Métrique: "Période", Valeur: `${data.range.from} → ${data.range.to}` },
      { Métrique: "", Valeur: "" }, // Empty row
      { Métrique: "Solde actuel", Valeur: data.currentBalance },
      { Métrique: "Projection finale", Valeur: data.projectedBalance },
      { Métrique: "Impact futur", Valeur: data.futureImpact },
      { Métrique: "", Valeur: "" }, // Empty row
      {
        Métrique: "Scénario optimiste (fin)",
        Valeur: finalForecast?.scenarios?.optimistic || 0,
      },
      {
        Métrique: "Scénario pessimiste (fin)",
        Valeur: finalForecast?.scenarios?.pessimistic || 0,
      },
      { Métrique: "", Valeur: "" }, // Empty row
      { Métrique: "Solde minimum", Valeur: data.minBalance },
      { Métrique: "Solde maximum", Valeur: data.maxBalance },
      {
        Métrique: "Runway (jours)",
        Valeur: data.runwayDays !== null ? data.runwayDays : "N/A",
      },
      { Métrique: "", Valeur: "" }, // Empty row
      { Métrique: "Modèle utilisé", Valeur: data.model.type },
      {
        Métrique: "Historique utilisé (jours)",
        Valeur: data.model.trainedOn,
      },
      { Métrique: "Horizon (jours)", Valeur: data.model.horizonDays },
      {
        Métrique: "Précision (MAPE)",
        Valeur: data.model.accuracy?.mape
          ? `${data.model.accuracy.mape.toFixed(2)}%`
          : "N/A",
      },
      { Métrique: "", Valeur: "" }, // Empty row
      {
        Métrique: "Revenu quotidien moyen",
        Valeur: data.trends.avgDailyIncome,
      },
      {
        Métrique: "Dépense quotidienne moyenne",
        Valeur: data.trends.avgDailyExpense,
      },
      { Métrique: "Flux net quotidien", Valeur: data.trends.avgDailyNet },
    ];

    const ws2 = XLSX.utils.json_to_sheet(summary);
    ws2["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Résumé");

    // ========== Sheet 3: Events ==========
    if (data.events && data.events.length > 0) {
      const eventsData = data.events.map((e) => ({
        Date: e.date,
        Événement: e.label,
        Type:
          e.type === "auto"
            ? "Détection auto"
            : e.type === "manual"
            ? "Manuel"
            : "Importé",
        Confiance: e.confidence
          ? `${Math.round(e.confidence * 100)}%`
          : "-",
        Description: e.description || "",
      }));

      const ws3 = XLSX.utils.json_to_sheet(eventsData);
      ws3["!cols"] = [
        { wch: 12 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 40 },
      ];
      XLSX.utils.book_append_sheet(wb, ws3, "Événements");
    }

    // ========== Sheet 4: Alerts ==========
    const alertsData = [
      {
        Alerte: "Trésorerie faible",
        Statut: data.alerts.lowCash ? "⚠️ OUI" : "✅ Non",
      },
      {
        Alerte: "Solde négatif prévu",
        Statut: data.alerts.negativeBalance ? "🔴 OUI" : "✅ Non",
      },
      {
        Alerte: "Runway (jours)",
        Statut:
          data.alerts.runwayDays !== null
            ? `${data.alerts.runwayDays} jours`
            : "Illimité",
      },
    ];

    const ws4 = XLSX.utils.json_to_sheet(alertsData);
    ws4["!cols"] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws4, "Alertes");

    // ========== Export ==========
    const filename = `previsions-tresorerie-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
    >
      <Download size={18} />
      Exporter vers Excel
    </button>
  );
}
