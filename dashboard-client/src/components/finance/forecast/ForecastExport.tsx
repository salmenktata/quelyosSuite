"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { ForecastEnhancedResponse } from "@/lib/finance/reporting";

type ForecastExportProps = {
  data: ForecastEnhancedResponse | null;
};

export function ForecastExport({ data }: ForecastExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!data) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Lazy load exceljs (plus sécurisé que xlsx)
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();

      // ========== Sheet 1: Daily Forecast Data ==========
      const ws1 = wb.addWorksheet("Prévisions quotidiennes");
      ws1.columns = [
        { header: "Date", key: "date", width: 12 },
        { header: "Prévision", key: "prediction", width: 15 },
        { header: "Optimiste (+15%)", key: "optimistic", width: 18 },
        { header: "Pessimiste (-15%)", key: "pessimistic", width: 18 },
        { header: "Conf. 80% (Haut)", key: "conf80Upper", width: 18 },
        { header: "Conf. 80% (Bas)", key: "conf80Lower", width: 18 },
        { header: "Conf. 95% (Haut)", key: "conf95Upper", width: 18 },
        { header: "Conf. 95% (Bas)", key: "conf95Lower", width: 18 },
        { header: "Tendance", key: "trend", width: 12 },
        { header: "Saisonnier", key: "seasonal", width: 12 },
        { header: "Planifié", key: "planned", width: 12 },
      ];

      data.forecast.forEach((day) => {
        ws1.addRow({
          date: day.date,
          prediction: day.predicted || day.projectedBalance,
          optimistic: day.scenarios?.optimistic || 0,
          pessimistic: day.scenarios?.pessimistic || 0,
          conf80Upper: day.confidence80?.upper || 0,
          conf80Lower: day.confidence80?.lower || 0,
          conf95Upper: day.confidence95?.upper || 0,
          conf95Lower: day.confidence95?.lower || 0,
          trend: day.components?.trend || 0,
          seasonal: day.components?.seasonal || 0,
          planned: day.components?.planned || 0,
        });
      });

      // Style header row
      ws1.getRow(1).font = { bold: true };

      // ========== Sheet 2: Summary ==========
      const ws2 = wb.addWorksheet("Résumé");
      ws2.columns = [
        { header: "Métrique", key: "metric", width: 30 },
        { header: "Valeur", key: "value", width: 20 },
      ];

      const finalForecast = data.forecast[data.forecast.length - 1];
      const summaryRows = [
        { metric: "Période", value: `${data.range.from} → ${data.range.to}` },
        { metric: "", value: "" },
        { metric: "Solde actuel", value: data.currentBalance },
        { metric: "Projection finale", value: data.projectedBalance },
        { metric: "Impact futur", value: data.futureImpact },
        { metric: "", value: "" },
        { metric: "Scénario optimiste (fin)", value: finalForecast?.scenarios?.optimistic || 0 },
        { metric: "Scénario pessimiste (fin)", value: finalForecast?.scenarios?.pessimistic || 0 },
        { metric: "", value: "" },
        { metric: "Solde minimum", value: data.minBalance },
        { metric: "Solde maximum", value: data.maxBalance },
        { metric: "Runway (jours)", value: data.runwayDays !== null ? data.runwayDays : "N/A" },
        { metric: "", value: "" },
        { metric: "Modèle utilisé", value: data.model.type },
        { metric: "Historique utilisé (jours)", value: data.model.trainedOn },
        { metric: "Horizon (jours)", value: data.model.horizonDays },
        { metric: "Précision (MAPE)", value: data.model.accuracy?.mape ? `${data.model.accuracy.mape.toFixed(2)}%` : "N/A" },
        { metric: "", value: "" },
        { metric: "Revenu quotidien moyen", value: data.trends.avgDailyIncome },
        { metric: "Dépense quotidienne moyenne", value: data.trends.avgDailyExpense },
        { metric: "Flux net quotidien", value: data.trends.avgDailyNet },
      ];

      summaryRows.forEach((row) => ws2.addRow(row));
      ws2.getRow(1).font = { bold: true };

      // ========== Sheet 3: Events ==========
      if (data.events && data.events.length > 0) {
        const ws3 = wb.addWorksheet("Événements");
        ws3.columns = [
          { header: "Date", key: "date", width: 12 },
          { header: "Événement", key: "event", width: 30 },
          { header: "Type", key: "type", width: 15 },
          { header: "Confiance", key: "confidence", width: 12 },
          { header: "Description", key: "description", width: 40 },
        ];

        data.events.forEach((e) => {
          ws3.addRow({
            date: e.date,
            event: e.label,
            type: e.type === "auto" ? "Détection auto" : e.type === "manual" ? "Manuel" : "Importé",
            confidence: e.confidence ? `${Math.round(e.confidence * 100)}%` : "-",
            description: e.description || "",
          });
        });
        ws3.getRow(1).font = { bold: true };
      }

      // ========== Sheet 4: Alerts ==========
      const ws4 = wb.addWorksheet("Alertes");
      ws4.columns = [
        { header: "Alerte", key: "alert", width: 25 },
        { header: "Statut", key: "status", width: 20 },
      ];

      ws4.addRow({ alert: "Trésorerie faible", status: data.alerts.lowCash ? "OUI" : "Non" });
      ws4.addRow({ alert: "Solde négatif prévu", status: data.alerts.negativeBalance ? "OUI" : "Non" });
      ws4.addRow({ alert: "Runway (jours)", status: data.alerts.runwayDays !== null ? `${data.alerts.runwayDays} jours` : "Illimité" });
      ws4.getRow(1).font = { bold: true };

      // ========== Export ==========
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `previsions-tresorerie-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
      {isExporting ? "Exportation..." : "Exporter vers Excel"}
    </button>
  );
}
