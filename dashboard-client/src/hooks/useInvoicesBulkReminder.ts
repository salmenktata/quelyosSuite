/**
 * Hook TanStack Query - Relances Bulk Asynchrones
 *
 * Gestion envoi asynchrone relances en masse :
 * - Création job async (retour immédiat)
 * - Polling status toutes les 2s
 * - Affichage progression temps réel
 * - Résultats détaillés à la fin
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface BulkReminderResult {
  invoice_id: number;
  invoice_name: string;
  customer_email?: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface BulkReminderJobStatus {
  job_id: string;
  state: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  invoice_count: number;
  processed_count: number;
  sent_count: number;
  failed_count: number;
  duration: number;
  error_message?: string;
  results?: BulkReminderResult[];
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Polling status job relances bulk (refetch automatique toutes les 2s)
 */
export function useBulkReminderStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['bulk-reminder-status', jobId],
    queryFn: async () => {
      if (!jobId) {
        throw new Error('Job ID required');
      }

      const response = await apiClient.post(`/finance/invoices/bulk-remind-status/${jobId}`, {});
      return response.data as BulkReminderJobStatus;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as BulkReminderJobStatus | undefined;

      // Arrêter polling si completed ou failed
      if (!data || data.state === 'completed' || data.state === 'failed') {
        return false;
      }

      // Polling toutes les 2s si processing
      return 2000;
    },
    staleTime: 0, // Toujours refetch (pas de cache)
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Créer job relances bulk async
 */
export function useBulkRemindAsync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoice_ids?: number[];
      overdue_only?: boolean;
    }) => {
      const response = await apiClient.post('/finance/invoices/bulk-remind-async', params);

      return response.data as {
        job_id: string;
        invoice_count: number;
        message: string;
      };
    },
    onMutate: () => {
      toast.loading('Création job relances...', { id: 'bulk-remind-async' });
    },
    onSuccess: (data) => {
      toast.success(
        `Job créé : traitement de ${data.invoice_count} facture(s) en cours`,
        { id: 'bulk-remind-async', duration: 3000 }
      );

      // Invalider liste factures (refresh après envoi)
      queryClient.invalidateQueries({
        queryKey: ['invoices']
      });
    },
    onError: (error: Error) => {
      toast.error(`Erreur création job: ${error.message}`, {
        id: 'bulk-remind-async'
      });
    },
  });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Formatte la durée du job pour affichage
 */
export function formatJobDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}min ${remainingSeconds}s`;
}

/**
 * Calcule le taux de succès
 */
export function calculateSuccessRate(status: BulkReminderJobStatus): number {
  if (status.processed_count === 0) {
    return 0;
  }

  return Math.round((status.sent_count / status.processed_count) * 100);
}

/**
 * Génère message résumé selon état job
 */
export function getJobStatusMessage(status: BulkReminderJobStatus): {
  message: string;
  variant: 'info' | 'success' | 'warning' | 'error';
} {
  switch (status.state) {
    case 'pending':
      return {
        message: 'Job en attente de traitement...',
        variant: 'info',
      };

    case 'processing':
      return {
        message: `Traitement en cours... ${status.processed_count}/${status.invoice_count} factures`,
        variant: 'info',
      };

    case 'completed':
      const successRate = calculateSuccessRate(status);
      if (successRate === 100) {
        return {
          message: `✅ ${status.sent_count} relance(s) envoyée(s) avec succès`,
          variant: 'success',
        };
      } else if (successRate >= 80) {
        return {
          message: `⚠️ ${status.sent_count} envoyé(s), ${status.failed_count} échec(s)`,
          variant: 'warning',
        };
      } else {
        return {
          message: `❌ ${status.failed_count} échec(s) sur ${status.processed_count} factures`,
          variant: 'error',
        };
      }

    case 'failed':
      return {
        message: `❌ Erreur globale : ${status.error_message || 'Erreur inconnue'}`,
        variant: 'error',
      };

    default:
      return {
        message: 'État inconnu',
        variant: 'info',
      };
  }
}

/**
 * Vérifie si le job est terminé (pour arrêt polling)
 */
export function isJobFinished(status: BulkReminderJobStatus): boolean {
  return status.state === 'completed' || status.state === 'failed';
}

/**
 * Filtre résultats par status
 */
export function filterResultsByStatus(
  results: BulkReminderResult[] | undefined,
  status: 'sent' | 'failed'
): BulkReminderResult[] {
  if (!results) {
    return [];
  }

  return results.filter(r => r.status === status);
}

/**
 * Exporte résultats en CSV
 */
export function exportResultsToCSV(status: BulkReminderJobStatus): void {
  if (!status.results || status.results.length === 0) {
    toast.error('Aucun résultat à exporter');
    return;
  }

  // Préparer CSV
  const headers = ['Facture', 'Email Client', 'Status', 'Erreur'];
  const rows = status.results.map(r => [
    r.invoice_name,
    r.customer_email || '-',
    r.status === 'sent' ? 'Envoyé' : 'Échec',
    r.error || '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relances_bulk_${status.job_id}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  toast.success('Résultats exportés en CSV');
}
