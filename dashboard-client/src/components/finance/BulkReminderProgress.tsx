/**
 * Composant BulkReminderProgress - Progression Job Relances Bulk
 *
 * Affiche progression temps réel :
 * - Barre progression 0-100%
 * - Stats live (envoyé, échec, restant)
 * - Durée écoulée
 * - Résultats détaillés (succès/échec)
 * - Export CSV résultats
 */

import { useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Loader,
} from 'lucide-react';
import {
  useBulkReminderStatus,
  formatJobDuration,
  calculateSuccessRate,
  getJobStatusMessage,
  isJobFinished,
  filterResultsByStatus,
  exportResultsToCSV,
  type BulkReminderJobStatus,
} from '@/hooks/useInvoicesBulkReminder';
import { Button } from '@/components/common';

interface BulkReminderProgressProps {
  jobId: string;
  onComplete?: (status: BulkReminderJobStatus) => void;
}

export function BulkReminderProgress({ jobId, onComplete }: BulkReminderProgressProps) {
  const { data: status, isLoading, error } = useBulkReminderStatus(jobId);

  // Callback lorsque job terminé
  useEffect(() => {
    if (status && isJobFinished(status) && onComplete) {
      onComplete(status);
    }
  }, [status, onComplete]);

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Chargement status job...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">Erreur chargement status job</p>
        </div>
      </div>
    );
  }

  const statusMessage = getJobStatusMessage(status);
  const successRate = calculateSuccessRate(status);
  const finished = isJobFinished(status);

  return (
    <div className="space-y-4">
      {/* Header Status */}
      <div
        className={`rounded-lg border p-4 ${
          statusMessage.variant === 'success'
            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
            : statusMessage.variant === 'error'
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            : statusMessage.variant === 'warning'
            ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
            : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
        }`}
      >
        <p
          className={`text-sm font-medium ${
            statusMessage.variant === 'success'
              ? 'text-green-800 dark:text-green-300'
              : statusMessage.variant === 'error'
              ? 'text-red-800 dark:text-red-300'
              : statusMessage.variant === 'warning'
              ? 'text-yellow-800 dark:text-yellow-300'
              : 'text-blue-800 dark:text-blue-300'
          }`}
        >
          {statusMessage.message}
        </p>
      </div>

      {/* Barre Progression */}
      {!finished && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {status.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {status.invoice_count}
          </p>
        </div>

        {/* Envoyé */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300">Envoyé</p>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
            {status.sent_count}
          </p>
        </div>

        {/* Échec */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-300">Échec</p>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
            {status.failed_count}
          </p>
        </div>

        {/* Durée */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Durée</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatJobDuration(status.duration)}
          </p>
        </div>
      </div>

      {/* Taux Succès */}
      {finished && status.processed_count > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Taux de succès
            </p>
            <p
              className={`text-2xl font-bold ${
                successRate >= 80
                  ? 'text-green-600 dark:text-green-400'
                  : successRate >= 50
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {successRate}%
            </p>
          </div>
        </div>
      )}

      {/* Bouton Export CSV */}
      {finished && status.results && status.results.length > 0 && (
        <Button
          variant="outline"
          onClick={() => exportResultsToCSV(status)}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter résultats (CSV)
        </Button>
      )}

      {/* Résultats Détaillés (Échecs) */}
      {finished && status.results && status.failed_count > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Détails échecs ({status.failed_count})
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filterResultsByStatus(status.results, 'failed').map((result, idx) => (
              <div
                key={idx}
                className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      {result.invoice_name}
                    </p>
                    {result.customer_email && (
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {result.customer_email}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        Erreur : {result.error}
                      </p>
                    )}
                  </div>
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultats Détaillés (Succès) - Affichage condensé */}
      {finished && status.results && status.sent_count > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
            Voir les {status.sent_count} relance(s) envoyée(s) ▼
          </summary>

          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
            {filterResultsByStatus(status.results, 'sent').map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded px-3 py-2"
              >
                <span className="text-sm text-green-900 dark:text-green-100">
                  {result.invoice_name}
                </span>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
