"use client";

import React, { useState } from "react";
import { API_BASE_URL } from "@/lib/api-base";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Calendar,
  Filter,
  Check
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass";

type ExportFormat = "csv" | "pdf";
type ExportScope = "all" | "month" | "quarter" | "year" | "custom";

interface ExportButtonProps {
  accountId?: number;
  className?: string;
}

export function ExportButton({ accountId, className = "" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [scope, setScope] = useState<ExportScope>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("format", format);
      
      if (accountId) {
        params.append("accountId", accountId.toString());
      }

      // Calculate dates based on scope
      const now = new Date();
      let fromDate: Date | null = null;
      let toDate: Date = now;

      switch (scope) {
        case "month":
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          fromDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case "year":
          fromDate = new Date(now.getFullYear(), 0, 1);
          break;
        case "custom":
          if (dateFrom) fromDate = new Date(dateFrom);
          if (dateTo) toDate = new Date(dateTo);
          break;
        case "all":
        default:
          // No date filter
          break;
      }

      if (fromDate) params.append("from", fromDate.toISOString());
      if (scope !== "all") params.append("to", toDate.toISOString());

      // Fetch export
      const response = await fetch(
        `${API_BASE_URL}/user/transactions/export?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `transactions_${new Date().toISOString().split("T")[0]}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Export error:", err);
      alert(err instanceof Error ? err.message : "Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
        data-guide="export-transactions"
      >
        <Download className="h-4 w-4" />
        Exporter
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80">
            <GlassPanel gradient="none" className="border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Exporter les transactions</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Format selection */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat("csv")}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      format === "csv"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => setFormat("pdf")}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      format === "pdf"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </button>
                </div>
              </div>

              {/* Period selection */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Période</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "month", label: "Ce mois" },
                    { value: "quarter", label: "Ce trimestre" },
                    { value: "year", label: "Cette année" },
                    { value: "all", label: "Tout" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setScope(option.value as ExportScope)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        scope === option.value
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setScope("custom")}
                  className={`w-full mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    scope === "custom"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Période personnalisée
                </button>
              </div>

              {/* Custom date range */}
              {scope === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Du</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-400/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Au</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-400/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Export button */}
              <button
                onClick={handleExport}
                disabled={loading || (scope === "custom" && (!dateFrom || !dateTo))}
                className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  success
                    ? "bg-green-500"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400"
                }`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  <>
                    <Check className="h-4 w-4" />
                    Téléchargé !
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Télécharger {format.toUpperCase()}
                  </>
                )}
              </button>
            </GlassPanel>
          </div>
        </>
      )}
    </div>
  );
}

// Standalone export page component
export function ExportPanel() {
  return (
    <GlassPanel gradient="indigo" className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">
            Exporter vos données
          </h2>
          <p className="text-sm text-indigo-200">
            Téléchargez vos transactions en CSV ou PDF
          </p>
        </div>
        <ExportButton />
      </div>
    </GlassPanel>
  );
}

export default ExportButton;
