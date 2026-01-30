"use client";

import { _AlertCircle, Download, XCircle, AlertTriangle, Info } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass";
import type { ValidationErrorsProps } from "@/types/import";

export function ValidationErrors({
  errors,
  onDownloadReport,
  className = "",
}: ValidationErrorsProps) {
  const errorsList = errors.filter(e => e.severity === 'error');
  const warningsList = errors.filter(e => e.severity === 'warning');
  const infosList = errors.filter(e => e.severity === 'info');

  const _getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getSeverityStyles = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return {
          panel: "border-rose-500/50 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10",
          text: "text-rose-800 dark:text-rose-200",
          badge: "text-rose-700 dark:text-rose-300",
        };
      case 'warning':
        return {
          panel: "border-amber-500/50 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10",
          text: "text-amber-800 dark:text-amber-200",
          badge: "text-amber-700 dark:text-amber-300",
        };
      case 'info':
        return {
          panel: "border-blue-500/50 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10",
          text: "text-blue-800 dark:text-blue-200",
          badge: "text-blue-700 dark:text-blue-300",
        };
    }
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Erreurs critiques */}
      {errorsList.length > 0 && (
        <GlassPanel gradient="violet" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-6 w-6 text-rose-500 dark:text-rose-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {errorsList.length} erreur{errorsList.length > 1 ? 's' : ''} détectée{errorsList.length > 1 ? 's' : ''}
            </h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errorsList.sort((a, b) => a.line - b.line).map((error, idx) => {
              const styles = getSeverityStyles(error.severity);
              return (
                <div key={idx} className={`rounded-lg border p-3 ${styles.panel}`}>
                  <div className="flex items-start gap-2">
                    <span className={`font-mono text-xs shrink-0 ${styles.badge}`}>
                      Ligne {error.line}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${styles.text}`}>
                        {error.field && <span className="font-semibold">{error.field}: </span>}
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}

      {/* Avertissements */}
      {warningsList.length > 0 && (
        <GlassPanel gradient="amber" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {warningsList.length} avertissement{warningsList.length > 1 ? 's' : ''}
            </h3>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {warningsList.sort((a, b) => a.line - b.line).slice(0, 10).map((warning, idx) => {
              const styles = getSeverityStyles(warning.severity);
              return (
                <div key={idx} className={`text-sm flex gap-2 p-2 rounded ${styles.panel}`}>
                  <span className={`font-mono text-xs shrink-0 ${styles.badge}`}>
                    L{warning.line}
                  </span>
                  <span className={styles.text}>{warning.message}</span>
                </div>
              );
            })}
            {warningsList.length > 10 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 pl-2">
                ... et {warningsList.length - 10} autres avertissements
              </p>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Informations */}
      {infosList.length > 0 && (
        <GlassPanel gradient="indigo" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {infosList.length} information{infosList.length > 1 ? 's' : ''}
            </h4>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {infosList.slice(0, 5).map((info, idx) => (
              <p key={idx} className="text-xs text-blue-700 dark:text-blue-300">
                Ligne {info.line}: {info.message}
              </p>
            ))}
            {infosList.length > 5 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                ... et {infosList.length - 5} autres
              </p>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Download report button */}
      {onDownloadReport && errors.length > 10 && (
        <button
          onClick={onDownloadReport}
          className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
        >
          <Download className="h-4 w-4" />
          Télécharger le rapport complet ({errors.length} éléments)
        </button>
      )}
    </div>
  );
}
