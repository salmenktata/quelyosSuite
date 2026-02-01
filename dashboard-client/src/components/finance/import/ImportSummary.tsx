"use client";

import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass";
import type { ImportSummaryProps, ImportErrorDetail } from "@/types/import";

export function ImportSummary({
  results,
  onViewTransactions,
  onImportAnother,
}: ImportSummaryProps) {
  const hasErrors = (results.errors as ImportErrorDetail[]).filter((e: ImportErrorDetail) => e.severity === 'error').length > 0;
  const hasWarnings = (results.errors as ImportErrorDetail[]).filter((e: ImportErrorDetail) => e.severity === 'warning').length > 0;
  const isFullSuccess = !hasErrors && !hasWarnings && results.failed === 0;

  const errorCount = (results.errors as ImportErrorDetail[]).filter((e: ImportErrorDetail) => e.severity === 'error').length;
  const warningCount = (results.errors as ImportErrorDetail[]).filter((e: ImportErrorDetail) => e.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        {isFullSuccess ? (
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
        ) : hasErrors ? (
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 mb-4">
            <XCircle className="h-10 w-10 text-rose-400" />
          </div>
        ) : (
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 mb-4">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isFullSuccess
            ? "Import réussi !"
            : hasErrors
            ? "Import partiel"
            : "Import terminé avec avertissements"}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isFullSuccess
            ? "Toutes les transactions ont été importées avec succès."
            : "Consultez les détails ci-dessous."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassPanel gradient="emerald" className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{results.imported}</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Importées</p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel gradient="amber" className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500 dark:text-amber-400" />
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{results.duplicates}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Doublons</p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel gradient="violet" className="p-6">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{errorCount}</p>
              <p className="text-sm text-rose-700 dark:text-rose-300">Erreurs</p>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Error Details (top 5) */}
      {errorCount > 0 && (
        <GlassPanel gradient="violet" className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            Erreurs détectées ({errorCount})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(results.errors as ImportErrorDetail[])
              .filter((e: ImportErrorDetail) => e.severity === 'error')
              .slice(0, 5)
              .map((error: ImportErrorDetail, idx: number) => (
                <div key={idx} className="text-sm text-rose-800 dark:text-rose-200 flex gap-2">
                  <span className="font-mono text-xs text-rose-700 dark:text-rose-300 shrink-0">
                    Ligne {error.line}:
                  </span>
                  <span>{error.message}</span>
                </div>
              ))}
            {errorCount > 5 && (
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-2">
                ... et {errorCount - 5} autres erreurs
              </p>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Warning Details (if any) */}
      {warningCount > 0 && (
        <GlassPanel gradient="amber" className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            Avertissements ({warningCount})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {(results.errors as ImportErrorDetail[])
              .filter((e: ImportErrorDetail) => e.severity === 'warning')
              .slice(0, 3)
              .map((warning: ImportErrorDetail, idx: number) => (
                <div key={idx} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                  <span className="font-mono text-xs text-amber-700 dark:text-amber-300 shrink-0">
                    Ligne {warning.line}:
                  </span>
                  <span>{warning.message}</span>
                </div>
              ))}
            {warningCount > 3 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                ... et {warningCount - 3} autres avertissements
              </p>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onViewTransactions}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-purple-400"
        >
          Voir les transactions
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={onImportAnother}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white transition hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Importer un autre fichier
        </button>
      </div>

      {/* Processing time */}
      {results.processingTime && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          Import effectué en {(results.processingTime / 1000).toFixed(1)}s
        </p>
      )}
    </div>
  );
}
