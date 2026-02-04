/**
 * Hook TanStack Query - Audit Trail Factures
 *
 * Gestion historique modifications factures :
 * - Récupération audit trail complet
 * - Ajout notes d'audit
 * - Export PDF piste d'audit
 * - Détection modifications suspectes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface AuditChange {
  field_name: string;
  field_label: string;
  old_value: string;
  new_value: string;
  diff_percent: number | null;
}

export interface AuditEntry {
  id: number;
  date: string | null;
  user_name: string;
  user_email: string | null;
  changes: AuditChange[];
  reason: string | null;
}

export interface AuditTrail {
  audit_entries: AuditEntry[];
  invoice_name: string;
  current_state: string;
  modification_count: number;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Récupère l'audit trail complet d'une facture
 */
export function useInvoiceAuditTrail(invoiceId: number | null) {
  return useQuery({
    queryKey: ['invoice-audit', invoiceId],
    queryFn: async () => {
      if (!invoiceId) {
        throw new Error('Invoice ID required');
      }

      const response = await apiClient.post('/finance/invoices/audit-trail', {
        invoice_id: invoiceId
      });

      return response.data as AuditTrail;
    },
    enabled: !!invoiceId,
    staleTime: 30 * 1000, // Cache 30s (audit trail change peu)
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Ajouter note d'audit / raison modification
 */
export function useAddAuditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      invoice_id: number;
      note: string;
    }) => {
      const response = await apiClient.post('/finance/invoices/add-audit-note', params);
      return response.data as { message: string };
    },
    onMutate: () => {
      toast.loading('Ajout note d\'audit...', { id: 'add-audit-note' });
    },
    onSuccess: (_data, variables) => {
      toast.success('Note ajoutée à l\'historique', { id: 'add-audit-note' });

      // Invalider audit trail de cette facture
      queryClient.invalidateQueries({
        queryKey: ['invoice-audit', variables.invoice_id]
      });
    },
    onError: (error: Error) => {
      toast.error(`Erreur ajout note: ${error.message}`, {
        id: 'add-audit-note'
      });
    },
  });
}

/**
 * Exporter audit trail au format PDF
 */
export function useExportAuditTrail() {
  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiClient.post('/finance/invoices/audit-export', {
        invoice_id: invoiceId
      });

      return response.data as {
        message: string;
        pdf_url: string | null;
        filename: string;
      };
    },
    onMutate: () => {
      toast.loading('Export PDF audit trail...', { id: 'export-audit' });
    },
    onSuccess: (data) => {
      if (data.pdf_url) {
        toast.success(`PDF exporté : ${data.filename}`, { id: 'export-audit' });
        // Télécharger fichier
        window.open(data.pdf_url, '_blank');
      } else {
        // TODO : implémentation génération PDF réelle
        toast.info(data.message, { id: 'export-audit' });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur export: ${error.message}`, {
        id: 'export-audit'
      });
    },
  });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Détecte les modifications suspectes (montants > 20%, changements après validation)
 */
export function detectSuspiciousChanges(auditTrail: AuditTrail): AuditEntry[] {
  const suspicious: AuditEntry[] = [];

  for (const entry of auditTrail.audit_entries) {
    let isSuspicious = false;

    for (const change of entry.changes) {
      // Changement montant > 20%
      if (change.diff_percent !== null && Math.abs(change.diff_percent) > 20) {
        isSuspicious = true;
        break;
      }

      // Changement état posted → draft (annulation)
      if (change.field_name === 'state' &&
          change.old_value === 'posted' &&
          change.new_value === 'draft') {
        isSuspicious = true;
        break;
      }

      // Changement client après validation
      if (change.field_name === 'partner_id' &&
          auditTrail.current_state === 'posted') {
        isSuspicious = true;
        break;
      }
    }

    if (isSuspicious) {
      suspicious.push(entry);
    }
  }

  return suspicious;
}

/**
 * Formatte un changement pour affichage humain
 */
export function formatAuditChange(change: AuditChange): string {
  if (change.diff_percent !== null) {
    const direction = change.diff_percent > 0 ? '+' : '';
    return `${change.field_label}: ${change.old_value} → ${change.new_value} (${direction}${change.diff_percent}%)`;
  }

  return `${change.field_label}: ${change.old_value} → ${change.new_value}`;
}

/**
 * Calcule statistiques audit trail
 */
export function calculateAuditStats(auditTrail: AuditTrail) {
  const uniqueUsers = new Set(
    auditTrail.audit_entries.map(e => e.user_name)
  );

  const totalChanges = auditTrail.audit_entries.reduce(
    (sum, entry) => sum + entry.changes.length,
    0
  );

  const changesWithReason = auditTrail.audit_entries.filter(
    e => e.reason !== null
  ).length;

  const suspiciousChanges = detectSuspiciousChanges(auditTrail);

  return {
    total_modifications: auditTrail.modification_count,
    total_changes: totalChanges,
    unique_users: uniqueUsers.size,
    changes_with_reason: changesWithReason,
    suspicious_count: suspiciousChanges.length,
    suspicious_changes: suspiciousChanges,
  };
}
