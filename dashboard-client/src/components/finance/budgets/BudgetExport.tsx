

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass";
import { Download, FileDown, Filter } from "lucide-react";

type BudgetStatus = "ON_TRACK" | "WARNING" | "EXCEEDED";
type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

interface Budget {
  id: number;
  name: string;
  amount: number;
  currentSpending?: number;
  percentageUsed?: number;
  status?: BudgetStatus;
  category?: { id: number; name: string } | null;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string | null;
}

interface BudgetExportProps {
  allBudgets: Budget[];
  filteredBudgets: Budget[];
  formatCurrency: (amount: number) => string;
}

const periodLabels: Record<BudgetPeriod, string> = {
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
  CUSTOM: "Personnalisé"
};

const statusLabels: Record<BudgetStatus, string> = {
  ON_TRACK: "Sur la bonne voie",
  WARNING: "Attention",
  EXCEEDED: "Dépassé"
};

export function BudgetExport({ allBudgets, filteredBudgets, formatCurrency: _formatCurrency }: BudgetExportProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportToCSV = (budgets: Budget[], filename: string) => {
    // CSV Headers
    const headers = [
      "Nom",
      "Catégorie",
      "Période",
      "Montant budgété",
      "Montant dépensé",
      "Restant",
      "Utilisation %",
      "Statut",
      "Date début",
      "Date fin"
    ];

    // CSV Rows
    const rows = budgets.map(b => {
      const remaining = b.amount - (b.currentSpending || 0);

      return [
        b.name,
        b.category?.name || "Toutes catégories",
        b.period ? periodLabels[b.period] : "-",
        b.amount.toFixed(2),
        (b.currentSpending || 0).toFixed(2),
        remaining.toFixed(2),
        b.percentageUsed?.toFixed(1) || "0.0",
        b.status ? statusLabels[b.status] : "-",
        b.startDate ? new Date(b.startDate).toLocaleDateString("fr-FR") : "-",
        b.endDate ? new Date(b.endDate).toLocaleDateString("fr-FR") : "-"
      ];
    });

    // Build CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsOpen(false);
  };

  const handleExportAll = () => {
    const date = new Date().toISOString().split("T")[0]!;
    exportToCSV(allBudgets, `budgets_tous_${date}.csv`);
  };

  const handleExportFiltered = () => {
    const date = new Date().toISOString().split("T")[0]!;
    exportToCSV(filteredBudgets, `budgets_filtres_${date}.csv`);
  };

  const hasFilters = allBudgets.length !== filteredBudgets.length;

  return (
    <div className="relative">
      <GlassButton
        onClick={() => setIsOpen(!isOpen)}
        variant="subtle"
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Exporter
      </GlassButton>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 z-20 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-indigo-950/95 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="p-2">
              <button
                onClick={handleExportAll}
                className="w-full px-3 py-2.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3"
              >
                <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                <div>
                  <div className="font-medium">Tous les budgets</div>
                  <div className="text-xs text-gray-600 dark:text-indigo-100/60">{allBudgets.length} budget{allBudgets.length > 1 ? "s" : ""}</div>
                </div>
              </button>

              {hasFilters && (
                <button
                  onClick={handleExportFiltered}
                  className="w-full px-3 py-2.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3 mt-1"
                >
                  <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  <div>
                    <div className="font-medium">Budgets filtrés</div>
                    <div className="text-xs text-gray-600 dark:text-indigo-100/60">{filteredBudgets.length} budget{filteredBudgets.length > 1 ? "s" : ""}</div>
                  </div>
                </button>
              )}
            </div>

            <div className="border-t border-white/10 p-2">
              <div className="px-3 py-2 text-xs text-indigo-100/60">
                Format: CSV (compatible Excel)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
