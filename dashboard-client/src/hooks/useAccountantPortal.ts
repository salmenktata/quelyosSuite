/**
 * Hook TanStack Query - Portail Expert-Comptable
 *
 * Gestion accès multi-clients pour experts-comptables :
 * - Liste clients assignés à l'EC
 * - Dashboard agrégé tous clients
 * - Données temps réel client spécifique
 * - Commentaires collaboratifs EC ↔ Client
 * - Validation période comptable
 * - Export FEC
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface AccountantClient {
  access_id: number;
  tenant_id: number;
  tenant_name: string;
  company_name: string;
  permission_level: 'readonly' | 'comment' | 'validate' | 'edit';
  can_export_fec: boolean;
  last_access: string | null;
  invoice_count: number;
}

export interface AccountantDashboard {
  total_clients: number;
  total_invoices_month: number;
  total_revenue_month: number;
  pending_validations: number;
  unresolved_comments: number;
}

export interface ClientInvoice {
  id: number;
  name: string;
  partner_name: string;
  invoice_date: string | null;
  amount_total: number;
  payment_state: string;
  has_comments: boolean;
}

export interface ValidationStatus {
  is_validated: boolean;
  validation_date: string | null;
  checks: {
    invoices_complete: boolean;
    payments_reconciled: boolean;
    bank_reconciled: boolean;
    vat_correct: boolean;
    expenses_categorized: boolean;
  };
  anomaly_count: number;
}

export interface ClientData {
  invoices: ClientInvoice[];
  invoice_count: number;
  validation_status: ValidationStatus | null;
}

export interface AccountantComment {
  id: number;
  author_name: string;
  is_accountant: boolean;
  subject: string;
  comment: string;
  priority: 'info' | 'warning' | 'critical';
  category: 'question' | 'anomaly' | 'suggestion' | 'validation' | 'other';
  state: 'open' | 'in_progress' | 'resolved' | 'closed';
  create_date: string | null;
  reply_count: number;
  replies: Array<{
    id: number;
    author_name: string;
    is_accountant: boolean;
    comment: string;
    create_date: string | null;
  }>;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Liste tous les clients de l'EC connecté
 */
export function useAccountantClients() {
  return useQuery({
    queryKey: ['accountant', 'clients'],
    queryFn: async () => {
      const response = await apiClient.post('/accountant/clients', {});
      return response.data as {
        clients: AccountantClient[];
        count: number;
      };
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });
}

/**
 * Dashboard agrégé tous clients EC
 */
export function useAccountantDashboard() {
  return useQuery({
    queryKey: ['accountant', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.post('/accountant/dashboard', {});
      return response.data as AccountantDashboard;
    },
    staleTime: 2 * 60 * 1000, // Cache 2 min
  });
}

/**
 * Données temps réel pour un client spécifique
 */
export function useClientData(params: {
  tenant_id: number;
  period_year?: number;
  period_month?: number;
}) {
  return useQuery({
    queryKey: ['accountant', 'client-data', params],
    queryFn: async () => {
      const response = await apiClient.post('/accountant/client-data', params);
      return response.data as ClientData;
    },
    enabled: !!params.tenant_id,
    staleTime: 1 * 60 * 1000, // Cache 1 min (données temps réel)
  });
}

/**
 * Commentaires pour un document spécifique
 */
export function useDocumentComments(params: {
  document_model: 'account.move' | 'account.payment' | 'quelyos.bank_transaction';
  document_id: number;
}) {
  return useQuery({
    queryKey: ['accountant', 'comments', params.document_model, params.document_id],
    queryFn: async () => {
      // Note : endpoint pas encore créé dans le contrôleur
      // Utilise get_document_comments du modèle
      const response = await apiClient.post('/accountant/comments/list', params);
      return response.data as AccountantComment[];
    },
    enabled: !!params.document_id,
    staleTime: 30 * 1000, // Cache 30s (commentaires temps réel)
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Créer commentaire collaboratif
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tenant_id: number;
      document_model: 'account.move' | 'account.payment' | 'quelyos.bank_transaction';
      document_id: number;
      subject?: string;
      comment: string;
      priority?: 'info' | 'warning' | 'critical';
      category?: 'question' | 'anomaly' | 'suggestion' | 'validation' | 'other';
    }) => {
      const response = await apiClient.post('/accountant/comments/create', params);
      return response.data as {
        comment_id: number;
        message: string;
      };
    },
    onMutate: () => {
      toast.loading('Création commentaire...', { id: 'create-comment' });
    },
    onSuccess: (data) => {
      toast.success(`Commentaire créé et notifications envoyées`, { id: 'create-comment' });

      // Invalider commentaires du document
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'comments']
      });

      // Invalider données client (pour has_comments)
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'client-data']
      });
    },
    onError: (error: Error) => {
      toast.error(`Erreur création commentaire: ${error.message}`, {
        id: 'create-comment'
      });
    },
  });
}

/**
 * Valider période comptable
 */
export function useValidatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tenant_id: number;
      period_year: number;
      period_month: number;
      validation_notes?: string;
      checks: {
        invoices_complete: boolean;
        payments_reconciled: boolean;
        bank_reconciled: boolean;
        vat_correct: boolean;
        expenses_categorized: boolean;
      };
    }) => {
      const response = await apiClient.post('/accountant/validate-period', params);
      return response.data;
    },
    onMutate: () => {
      toast.loading('Validation période...', { id: 'validate-period' });
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Période ${variables.period_month}/${variables.period_year} validée`,
        { id: 'validate-period' }
      );

      // Invalider données client
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'client-data', { tenant_id: variables.tenant_id }]
      });

      // Invalider dashboard (pending_validations)
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'dashboard']
      });
    },
    onError: (error: Error) => {
      toast.error(`Erreur validation: ${error.message}`, {
        id: 'validate-period'
      });
    },
  });
}

/**
 * Exporter FEC (Fichier Écritures Comptables)
 */
export function useExportFEC() {
  return useMutation({
    mutationFn: async (params: {
      tenant_id: number;
      year: number;
    }) => {
      const response = await apiClient.post('/accountant/export-fec', params);
      return response.data as {
        message: string;
        download_url: string | null;
        filename: string;
      };
    },
    onMutate: () => {
      toast.loading('Export FEC en cours...', { id: 'export-fec' });
    },
    onSuccess: (data) => {
      if (data.download_url) {
        toast.success(`FEC exporté : ${data.filename}`, { id: 'export-fec' });
        // Télécharger fichier
        window.open(data.download_url, '_blank');
      } else {
        // TODO : implémentation génération FEC réelle
        toast.info(data.message, { id: 'export-fec' });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur export FEC: ${error.message}`, {
        id: 'export-fec'
      });
    },
  });
}

/**
 * Résoudre commentaire
 */
export function useResolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiClient.post('/accountant/comments/resolve', {
        comment_id: commentId
      });
      return response.data;
    },
    onMutate: () => {
      toast.loading('Résolution commentaire...', { id: 'resolve-comment' });
    },
    onSuccess: () => {
      toast.success('Commentaire marqué comme résolu', { id: 'resolve-comment' });

      // Invalider commentaires
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'comments']
      });

      // Invalider dashboard (unresolved_comments)
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'dashboard']
      });
    },
    onError: (error: Error) => {
      toast.error(`Erreur résolution: ${error.message}`, {
        id: 'resolve-comment'
      });
    },
  });
}

/**
 * Rouvrir commentaire
 */
export function useReopenComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiClient.post('/accountant/comments/reopen', {
        comment_id: commentId
      });
      return response.data;
    },
    onMutate: () => {
      toast.loading('Réouverture commentaire...', { id: 'reopen-comment' });
    },
    onSuccess: () => {
      toast.success('Commentaire rouvert', { id: 'reopen-comment' });

      // Invalider commentaires
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'comments']
      });

      // Invalider dashboard
      queryClient.invalidateQueries({
        queryKey: ['accountant', 'dashboard']
      });
    },
    onError: (error: Error) => {
      toast.error(`Erreur réouverture: ${error.message}`, {
        id: 'reopen-comment'
      });
    },
  });
}
